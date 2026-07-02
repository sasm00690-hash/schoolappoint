import { Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// Helper to generate a unique random school password
const generatePassword = (schoolName: string): string => {
  const prefix = schoolName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${randomNum}`;
};

export const createRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, address, description, selected_plan } = req.body;

  if (!name || !email || !phone || !address) {
    return res.status(400).json({ error: 'Name, email, phone, and address are required' });
  }

  try {
    // Check if request or school already exists with this email
    const existingSchool = await query('SELECT id FROM schools WHERE email = $1', [email.toLowerCase()]);
    if (existingSchool.rows.length > 0) {
      return res.status(400).json({ error: 'A school is already registered with this email' });
    }

    const existingRequest = await query('SELECT id FROM onboarding_requests WHERE email = $1 AND status = \'Pending\'', [email.toLowerCase()]);
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'A registration request for this email is already pending approval' });
    }

    const result = await query(
      `INSERT INTO onboarding_requests (name, email, phone, address, description, selected_plan, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
       RETURNING *`,
      [name, email.toLowerCase(), phone, address, description || '', selected_plan || 'Starter']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating onboarding request:', error);
    res.status(500).json({ error: 'Server error processing onboarding request' });
  }
};

export const getRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM onboarding_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching onboarding requests:', error);
    res.status(500).json({ error: 'Server error fetching onboarding requests' });
  }
};

export const approveRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const superAdminId = req.user?.id || null;

  try {
    // 1. Get request details
    const requestResult = await query('SELECT * FROM onboarding_requests WHERE id = $1', [id]);
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding request not found' });
    }

    const request = requestResult.rows[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ error: `Onboarding request is already ${request.status}` });
    }

    // 2. Check if school email already in use
    const emailCheck = await query('SELECT id FROM schools WHERE email = $1', [request.email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'A school is already registered with this email' });
    }

    // 3. Create the School
    const schoolResult = await query(
      `INSERT INTO schools (name, address, phone, email, max_appointments_per_day, max_appointments_per_hour, admission_status, working_days, time_slots)
       VALUES ($1, $2, $3, $4, 50, 5, 'Closed', 
               '["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"]'::jsonb, 
               '["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]'::jsonb)
       RETURNING *`,
      [request.name, request.address, request.phone, request.email]
    );

    const school = schoolResult.rows[0];

    // 4. Generate random password & create School Admin account
    const generatedPass = generatePassword(request.name);
    const passwordHash = await bcrypt.hash(generatedPass, 12);
    const adminEmail = request.email; // Admin email same as school email for simplicity

    const adminResult = await query(
      `INSERT INTO school_admins (school_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Admin')
       RETURNING id, name, email`,
      [school.id, `${request.name} Administrator`, adminEmail, passwordHash]
    );

    // 5. Create active selected Subscription
    const planName = request.selected_plan || 'Starter';
    const planResult = await query('SELECT id, price FROM subscription_plans WHERE name = $1', [planName]);
    let planId = null;
    let planPrice = 0;
    if (planResult.rows.length > 0) {
      planId = planResult.rows[0].id;
      planPrice = parseFloat(planResult.rows[0].price || 0);
    } else {
      // Fallback
      const plans = await query('SELECT id, price FROM subscription_plans WHERE name = \'Starter\'');
      if (plans.rows.length > 0) {
        planId = plans.rows[0].id;
        planPrice = parseFloat(plans.rows[0].price || 0);
      }
    }

    if (planId) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 120); // 120 months duration

      await query(
        `INSERT INTO subscriptions (school_id, plan_id, status, start_date, end_date)
         VALUES ($1, $2, 'Active', $3, $4)`,
        [school.id, planId, startDate, endDate]
      );

      // Create active selected Plan Billing Invoice
      await query(
        `INSERT INTO billing_invoices (school_id, school_name, plan_name, amount, status)
         VALUES ($1, $2, $3, $4, 'Paid')`,
        [school.id, school.name, planName, planPrice]
      );
    }

    // 6. Update onboarding request status to Approved
    await query('UPDATE onboarding_requests SET status = \'Approved\' WHERE id = $1', [id]);

    // 7. Log Action in Audit Logs
    await logAudit(superAdminId, 'Approved Onboarding Request', `Onboarded school: ${school.name}. Created admin account: ${adminEmail}`);

    // Return the school details and generated admin credentials
    res.json({
      message: 'Onboarding request approved and school created successfully.',
      school,
      admin: {
        email: adminEmail,
        password: generatedPass
      }
    });
  } catch (error) {
    console.error('Error approving onboarding request:', error);
    res.status(500).json({ error: 'Server error during onboarding approval' });
  }
};

export const rejectRequest = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const superAdminId = req.user?.id || null;

  try {
    const requestCheck = await query('SELECT name, status FROM onboarding_requests WHERE id = $1', [id]);
    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding request not found' });
    }

    if (requestCheck.rows[0].status !== 'Pending') {
      return res.status(400).json({ error: `Onboarding request is already ${requestCheck.rows[0].status}` });
    }

    await query('UPDATE onboarding_requests SET status = \'Rejected\' WHERE id = $1', [id]);

    await logAudit(superAdminId, 'Rejected Onboarding Request', `Rejected onboarding request from school: ${requestCheck.rows[0].name}`);

    res.json({ message: 'Onboarding request rejected.' });
  } catch (error) {
    console.error('Error rejecting onboarding request:', error);
    res.status(500).json({ error: 'Server error during onboarding rejection' });
  }
};
