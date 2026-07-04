import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeychangeinproduction';

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const ident = email.toLowerCase().trim();

  try {
    // Fetch user and check school status if not super admin
    const userResult = await query(
      `SELECT sa.*, s.name as school_name, s.admission_status, s.logo_url 
       FROM school_admins sa
       LEFT JOIN schools s ON sa.school_id = s.id
       WHERE sa.email = $1 OR LOWER(sa.staff_id) = $1`,
      [ident]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // 1. Shift Schedule Restriction Check
    if (user.shift_start && user.shift_end) {
      const now = new Date();
      const currentStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
      const start = user.shift_start;
      const end = user.shift_end;
      
      let isWithinShift = false;
      if (start <= end) {
        isWithinShift = currentStr >= start && currentStr <= end;
      } else {
        // Overnight shift (e.g. 22:00:00 to 06:00:00)
        isWithinShift = currentStr >= start || currentStr <= end;
      }
      
      if (!isWithinShift) {
        return res.status(403).json({ error: `Shift-gaaga shaqo wuxuu ku eg yahay ${start} ilaa ${end}. Hadda ma soo geli kartid.` });
      }
    }

    // 2. IP Address Restriction Check
    if (user.allowed_ip && user.allowed_ip.trim() !== '') {
      const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').split(',')[0].trim();
      if (clientIp !== user.allowed_ip && !clientIp.includes(user.allowed_ip)) {
        return res.status(403).json({ error: `Cinwaankaaga IP-ga (${clientIp}) looma oggola inuu ka soo galo koontadan.` });
      }
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        school_id: user.school_id,
        email: user.email,
        role: user.role,
        sub_role: user.sub_role,
        staff_id: user.staff_id
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    await logAudit(user.id, 'User Login', `Logged in user: ${user.name} (${user.staff_id || user.email})`);

    // Insert session record
    let sessionId = null;
    try {
      const sessionResult = await query(
        `INSERT INTO user_sessions (user_id, user_name, user_email, user_role, school_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          user.id, 
          user.name, 
          user.staff_id || user.email, 
          user.sub_role ? `SuperAdmin (${user.sub_role})` : user.role, 
          user.school_name || 'System Admin'
        ]
      );
      sessionId = sessionResult.rows[0]?.id;
    } catch (sessionErr) {
      console.error('Error logging user session:', sessionErr);
    }

    res.json({
      token,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        sub_role: user.sub_role,
        staff_id: user.staff_id,
        school_id: user.school_id,
        school_name: user.school_name,
        logo_url: user.logo_url
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      details: error?.message || String(error),
      stack: error?.stack
    });
  }
};

export const registerAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, school_id, role } = req.body;
  const superAdminId = req.user?.id || null;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = await query('SELECT id FROM school_admins WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO school_admins (name, email, password_hash, school_id, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, school_id`,
      [name, email.toLowerCase(), hash, school_id || null, role || 'Admin']
    );

    const schoolResult = await query('SELECT name FROM schools WHERE id = $1', [school_id]);
    const schoolName = schoolResult.rows.length > 0 ? schoolResult.rows[0].name : 'System';

    await logAudit(superAdminId, 'Created User Account', `Registered admin user "${name}" (${email}) for school: "${schoolName}"`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const result = await query(
      `SELECT sa.id, sa.name, sa.email, sa.role, sa.school_id, s.name as school_name, s.logo_url 
       FROM school_admins sa
       LEFT JOIN schools s ON sa.school_id = s.id
       WHERE sa.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT al.*, sa.name as user_name, sa.email as user_email
       FROM audit_logs al
       LEFT JOIN school_admins sa ON al.user_id = sa.id
       ORDER BY al.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Server error fetching audit logs' });
  }
};

export const heartbeat = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    await query(
      `UPDATE user_sessions 
       SET last_active_time = CURRENT_TIMESTAMP,
           duration_minutes = CEIL(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time)) / 60.0)
       WHERE id = $1`,
      [sessionId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: 'Server error updating heartbeat' });
  }
};

export const getSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT * FROM user_sessions 
       ORDER BY login_time DESC 
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Server error fetching user sessions' });
  }
};

export const getSystemUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT sa.id, sa.name, sa.email, sa.role, sa.created_at, s.name as school_name 
       FROM school_admins sa
       LEFT JOIN schools s ON sa.school_id = s.id
       ORDER BY sa.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching system users:', error);
    res.status(500).json({ error: 'Server error fetching system users' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId } = req.body;

  if (sessionId) {
    try {
      await query(
        `UPDATE user_sessions 
         SET logout_time = CURRENT_TIMESTAMP,
             duration_minutes = CEIL(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time)) / 60.0)
         WHERE id = $1`,
        [sessionId]
      );
    } catch (error) {
      console.error('Error logging logout:', error);
    }
  }

  res.json({ success: true });
};
