import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// 1. Maintenance Mode Endpoints
export const getMaintenanceMode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query("SELECT value FROM system_settings WHERE key = 'maintenance_mode'");
    const maintenanceMode = result.rows.length > 0 ? result.rows[0].value === 'true' : false;
    res.json({ maintenance_mode: maintenanceMode });
  } catch (error) {
    console.error('Error fetching maintenance mode:', error);
    res.status(500).json({ error: 'Server error checking maintenance mode' });
  }
};

export const setMaintenanceMode = async (req: AuthenticatedRequest, res: Response) => {
  const { maintenance_mode } = req.body;
  const superAdminId = req.user?.id || null;

  if (maintenance_mode === undefined) {
    return res.status(400).json({ error: 'maintenance_mode parameter is required' });
  }

  const valStr = maintenance_mode ? 'true' : 'false';

  try {
    await query(
      `INSERT INTO system_settings (key, value)
       VALUES ('maintenance_mode', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [valStr]
    );

    await logAudit(superAdminId, 'Toggled Maintenance Mode', `Set maintenance mode to ${valStr}`);

    res.json({ success: true, maintenance_mode: maintenance_mode });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ error: 'Server error updating maintenance mode' });
  }
};

// 2. Billing history
export const getBillingHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM billing_invoices ORDER BY billing_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: 'Server error fetching billing history' });
  }
};

// 3. Usage Limits & Alerts
export const getUsageAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Start of current month in YYYY-MM-DD
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get all schools with their active subscription plan details
    const schoolsWithPlans = await query(`
      SELECT s.id as school_id, s.name as school_name, sp.name as plan_name, sp.max_appointments_per_month
      FROM schools s
      JOIN subscriptions sub ON sub.school_id = s.id AND sub.status = 'Active'
      JOIN subscription_plans sp ON sub.plan_id = sp.id
    `);

    const alerts = [];

    for (const row of schoolsWithPlans.rows) {
      const { school_id, school_name, plan_name, max_appointments_per_month } = row;

      // Count appointments for current month
      const apptCountResult = await query(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE school_id = $1 AND status != 'Cancelled' AND status != 'Rejected' AND created_at >= $2`,
        [school_id, startOfMonth]
      );

      const usageCount = parseInt(apptCountResult.rows[0].count, 10);
      const percentage = max_appointments_per_month > 0
        ? Math.round((usageCount / max_appointments_per_month) * 100)
        : 0;

      alerts.push({
        school_id,
        school_name,
        plan_name,
        max_appointments_per_month,
        usage_count: usageCount,
        percentage
      });
    }

    res.json(alerts);
  } catch (error) {
    console.error('Error calculating usage alerts:', error);
    res.status(500).json({ error: 'Server error fetching usage alerts' });
  }
};

export const sendUpgradeAlert = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id, percentage } = req.body;
  const superAdminId = req.user?.id || null;

  if (!school_id) {
    return res.status(400).json({ error: 'school_id is required' });
  }

  try {
    const schoolRes = await query('SELECT email FROM schools WHERE id = $1', [school_id]);
    const recipient = schoolRes.rows.length > 0 ? schoolRes.rows[0].email : 'unknown@school.com';

    const title = 'Digniin: Xadka Ballamaha (SaaS Limit Warning)';
    const message = `${title} - Iskuulkaaga wuxuu isticmaalay ${percentage || 90}% oo ka mid ah xadka ballamaha qorshahaaga bishaan. Fadlan ku sameey kor u qaadis (Upgrade) subscription-kaaga si aad uga fogaato in ballamaha ay kaa xirmaan.`;

    await query(
      `INSERT INTO notifications (school_id, recipient, type, message, status)
       VALUES ($1, $2, 'Email', $3, 'Pending')`,
      [school_id, recipient, message]
    );

    await logAudit(superAdminId, 'Sent Subscription Upgrade Alert', `Sent warning notification to school admin ID: ${school_id}`);

    res.json({ success: true, message: 'Upgrade alert sent successfully.' });
  } catch (error) {
    console.error('Error sending upgrade alert:', error);
    res.status(500).json({ error: 'Server error sending upgrade alert' });
  }
};

// 4. Support Tickets Console
export const getSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let result;
    if (user.role === 'SuperAdmin') {
      result = await query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    } else {
      result = await query('SELECT * FROM support_tickets WHERE school_id = $1 ORDER BY created_at DESC', [user.school_id]);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Server error fetching support tickets' });
  }
};

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const { subject, message } = req.body;
  const user = req.user;

  if (!user || !user.school_id) {
    return res.status(401).json({ error: 'Unauthorized: Only school admins can submit tickets' });
  }
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  try {
    // Get school name
    const schoolRes = await query('SELECT name FROM schools WHERE id = $1', [user.school_id]);
    const schoolName = schoolRes.rows.length > 0 ? schoolRes.rows[0].name : 'Unknown School';

    const result = await query(
      `INSERT INTO support_tickets (school_id, school_name, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.school_id, schoolName, subject, message]
    );

    await logAudit(user.id, 'Created Support Ticket', `Submitted ticket with subject: "${subject}"`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Server error submitting support ticket' });
  }
};

export const replySupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reply } = req.body;
  const superAdminId = req.user?.id || null;

  if (!reply) {
    return res.status(400).json({ error: 'Reply content is required' });
  }

  try {
    const checkTicket = await query('SELECT school_id, subject FROM support_tickets WHERE id = $1', [id]);
    if (checkTicket.rows.length === 0) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    const { school_id, subject } = checkTicket.rows[0];

    const result = await query(
      `UPDATE support_tickets 
       SET reply = $1, status = 'Resolved', replied_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reply, id]
    );

    // Fetch school recipient email
    const schoolRes = await query('SELECT email FROM schools WHERE id = $1', [school_id]);
    const recipient = schoolRes.rows.length > 0 ? schoolRes.rows[0].email : 'unknown@school.com';

    // Send notification to school
    await query(
      `INSERT INTO notifications (school_id, recipient, type, message, status)
       VALUES ($1, $2, 'Email', $3, 'Pending')`,
      [
        school_id,
        recipient,
        `Jawaab: Cabashadaada waa la xaliyay - Jawaab ka timid Super Admin ku saabsan su'aashaadii: "${subject}". Jawaab: "${reply}"`
      ]
    );

    await logAudit(superAdminId, 'Replied Support Ticket', `Replied to ticket ID: ${id}`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error replying support ticket:', error);
    res.status(500).json({ error: 'Server error replying support ticket' });
  }
};
