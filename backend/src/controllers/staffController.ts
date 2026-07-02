import { Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// ==========================================
// 1. STAFF USER ACCOUNTS
// ==========================================

export const createStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  const adminId = req.user?.id || null;
  const schoolId = req.user?.school_id || null;

  if (!schoolId) {
    return res.status(400).json({ error: 'School ID context is required' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Check if email already in use
    const emailCheck = await query('SELECT id FROM school_admins WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const result = await query(
      `INSERT INTO school_admins (school_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'Scanner')
       RETURNING id, name, email, role, created_at`,
      [schoolId, name, email.toLowerCase(), passwordHash]
    );

    await logAudit(
      adminId,
      'Created Scanner Staff Account',
      `Created staff member "${name}" (${email.toLowerCase()})`
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating staff account:', error);
    res.status(500).json({ error: 'Server error during staff account creation' });
  }
};

export const getStaff = async (req: AuthenticatedRequest, res: Response) => {
  const schoolId = req.user?.school_id || null;

  if (!schoolId) {
    return res.status(400).json({ error: 'School ID context is required' });
  }

  try {
    const result = await query(
      `SELECT id, name, email, role, created_at 
       FROM school_admins 
       WHERE school_id = $1 AND role = 'Scanner'
       ORDER BY created_at DESC`,
      [schoolId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Server error fetching staff members' });
  }
};

export const deleteStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id || null;
  const schoolId = req.user?.school_id || null;

  if (!schoolId) {
    return res.status(400).json({ error: 'School ID context is required' });
  }

  try {
    const checkResult = await query(
      'SELECT name, email FROM school_admins WHERE id = $1 AND school_id = $2 AND role = \'Scanner\'',
      [id, schoolId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Staff account not found' });
    }

    const staffName = checkResult.rows[0].name;
    const staffEmail = checkResult.rows[0].email;

    await query('DELETE FROM school_admins WHERE id = $1 AND school_id = $2 AND role = \'Scanner\'', [id, schoolId]);

    await logAudit(
      adminId,
      'Deleted Scanner Staff Account',
      `Deleted staff member "${staffName}" (${staffEmail})`
    );

    res.json({ message: 'Staff account deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff account:', error);
    res.status(500).json({ error: 'Server error deleting staff account' });
  }
};

// ==========================================
// 2. LIVE SCAN MESSAGES / CHAT CONSOLE
// ==========================================

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  const schoolId = req.user?.school_id || null;

  if (!schoolId) {
    return res.status(400).json({ error: 'School ID context is required' });
  }

  try {
    const result = await query(
      `SELECT * FROM scan_messages 
       WHERE school_id = $1 
       ORDER BY created_at ASC 
       LIMIT 50`,
      [schoolId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

export const postMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { message } = req.body;
  const schoolId = req.user?.school_id || null;
  const userId = req.user?.id || null;

  if (!schoolId || !userId) {
    return res.status(400).json({ error: 'Authentication details missing' });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    // Fetch sender's name
    const userResult = await query('SELECT name FROM school_admins WHERE id = $1', [userId]);
    const senderName = userResult.rows[0]?.name || 'Staff';

    const result = await query(
      `INSERT INTO scan_messages (school_id, sender_id, sender_name, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [schoolId, userId, senderName, message.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ error: 'Server error posting message' });
  }
};

// ==========================================
// 3. APPOINTMENT-SPECIFIC DIRECTIVE NOTE
// ==========================================

export const updateAppointmentNote = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { admin_note } = req.body;
  const { school_id, role } = req.user!;
  const adminId = req.user?.id || null;

  try {
    // Verify ownership
    const appCheck = await query('SELECT school_id, appointment_number, student_name FROM appointments WHERE id = $1', [id]);
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (role !== 'SuperAdmin' && appCheck.rows[0].school_id !== school_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE appointments SET admin_note = $1 WHERE id = $2 RETURNING *`,
      [admin_note || null, id]
    );

    await logAudit(
      adminId,
      'Updated Appointment Admin Note',
      `Set check-in directive note on appointment "${appCheck.rows[0].appointment_number}" for "${appCheck.rows[0].student_name}" to: "${admin_note || 'None'}"`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment note:', error);
    res.status(500).json({ error: 'Server error updating appointment note' });
  }
};
