import { Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// 1. Get List of Super Admin Staff
export const getStaffList = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid inaad maamusho shaqaalaha' });
  }

  try {
    const result = await query(
      `SELECT id, name, email, role, sub_role, staff_id, shift_start, shift_end, allowed_ip, avatar_url, is_department_head, serial_number, created_at
       FROM school_admins
       WHERE role = 'SuperAdmin' AND id != $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({ error: 'Server error fetching staff list' });
  }
};

// 2. Create Staff Member with Sequential ID
export const createStaff = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid inaad maamusho shaqaalaha' });
  }

  const { name, email, password, sub_role, shift_start, shift_end, allowed_ip, avatar_url, is_department_head } = req.body;

  if (!name || !email || !password || !sub_role) {
    return res.status(400).json({ error: 'Name, email, password, and sub-role are required' });
  }

  try {
    // Check if email already exists
    const existing = await query('SELECT id FROM school_admins WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate next sequential staff_id (e.g. SMA-101, SMA-102)
    const lastStaff = await query(
      `SELECT staff_id FROM school_admins 
       WHERE staff_id LIKE 'SMA-%' 
       ORDER BY staff_id DESC LIMIT 1`
    );

    let nextId = 'SMA-101';
    if (lastStaff.rows.length > 0 && lastStaff.rows[0].staff_id) {
      const match = lastStaff.rows[0].staff_id.match(/SMA-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1]);
        nextId = `SMA-${lastNum + 1}`;
      }
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Generate unique serial number
    const typeStr = is_department_head ? 'HEAD' : 'AGENT';
    const deptAbbrev = sub_role.slice(0, 3).toUpperCase();
    const seqNum = nextId.replace('SMA-', '');
    const serialNum = `SMA-${typeStr}-${deptAbbrev}-${seqNum}`;

    // Insert staff
    const result = await query(
      `INSERT INTO school_admins (name, email, password_hash, role, sub_role, staff_id, shift_start, shift_end, allowed_ip, avatar_url, is_department_head, serial_number)
       VALUES ($1, $2, $3, 'SuperAdmin', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, email, role, sub_role, staff_id, avatar_url, is_department_head, serial_number`,
      [
        name, 
        email.toLowerCase().trim(), 
        hash, 
        sub_role, 
        nextId, 
        shift_start || null, 
        shift_end || null, 
        allowed_ip || null,
        avatar_url || null,
        !!is_department_head,
        serialNum
      ]
    );

    await logAudit(
      req.user.id, 
      'Created Staff Member', 
      `Created staff account "${name}" (${nextId}) with role: ${sub_role} (Serial: ${serialNum})`
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Server error creating staff account' });
  }
};

// 3. Update Staff Details
export const updateStaff = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid inaad maamusho shaqaalaha' });
  }

  const { id } = req.params;
  const { name, email, sub_role, shift_start, shift_end, allowed_ip, avatar_url, is_department_head } = req.body;

  try {
    // Fetch current staff_id first
    const staffCheck = await query('SELECT staff_id FROM school_admins WHERE id = $1', [id]);
    if (staffCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    const staff_id = staffCheck.rows[0].staff_id;
    const seqNum = staff_id.replace('SMA-', '');
    const typeStr = is_department_head ? 'HEAD' : 'AGENT';
    const deptAbbrev = sub_role.slice(0, 3).toUpperCase();
    const serialNum = `SMA-${typeStr}-${deptAbbrev}-${seqNum}`;

    const result = await query(
      `UPDATE school_admins
       SET name = $1, email = $2, sub_role = $3, shift_start = $4, shift_end = $5, allowed_ip = $6, avatar_url = $7, is_department_head = $8, serial_number = $9
       WHERE id = $10 AND role = 'SuperAdmin'
       RETURNING id, name, email, sub_role, staff_id, avatar_url, is_department_head, serial_number`,
      [
        name, 
        email.toLowerCase().trim(), 
        sub_role, 
        shift_start || null, 
        shift_end || null, 
        allowed_ip || null, 
        avatar_url || null,
        !!is_department_head,
        serialNum,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await logAudit(
      req.user.id, 
      'Updated Staff Member', 
      `Updated staff account "${name}" (${staff_id})`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Server error updating staff account' });
  }
};

// 4. Delete Staff Member
export const deleteStaff = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid inaad maamusho shaqaalaha' });
  }

  const { id } = req.params;

  try {
    const nameCheck = await query('SELECT name, staff_id FROM school_admins WHERE id = $1', [id]);
    if (nameCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    await query('DELETE FROM school_admins WHERE id = $1', [id]);

    await logAudit(
      req.user.id, 
      'Deleted Staff Member', 
      `Deleted staff account "${nameCheck.rows[0].name}" (${nameCheck.rows[0].staff_id})`
    );

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Server error deleting staff account' });
  }
};

// 5. Get Assigned Tasks
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    let result;
    if (!req.user.sub_role) {
      // Owner sees all tasks with assignee details
      result = await query(
        `SELECT t.*, sa.name as assignee_name, sa.staff_id as assignee_staff_id
         FROM staff_tasks t
         JOIN school_admins sa ON t.assigned_to = sa.id
         ORDER BY t.created_at DESC`
      );
    } else {
      // Staff member sees only their assigned tasks
      result = await query(
        `SELECT * FROM staff_tasks 
         WHERE assigned_to = $1 
         ORDER BY created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
};

// 6. Create Task
export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid inaad abuurto hawlo' });
  }

  const { assigned_to, title, description } = req.body;

  if (!assigned_to || !title) {
    return res.status(400).json({ error: 'Assignee and title are required' });
  }

  try {
    const result = await query(
      `INSERT INTO staff_tasks (assigned_to, title, description, status)
       VALUES ($1, $2, $3, 'Pending')
       RETURNING *`,
      [assigned_to, title, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

// 7. Update Task Status (Complete/Pending)
export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'Pending' && status !== 'Completed') {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const completedAt = status === 'Completed' ? new Date() : null;
    const result = await query(
      `UPDATE staff_tasks
       SET status = $1, completed_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, completedAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
};

// 8. Get Messages (Direct chat between users)
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { otherUserId } = req.params;
  let targetId = otherUserId;

  try {
    if (otherUserId === 'owner') {
      const ownerRes = await query("SELECT id FROM school_admins WHERE role = 'SuperAdmin' AND sub_role IS NULL LIMIT 1");
      if (ownerRes.rows.length > 0) {
        targetId = ownerRes.rows[0].id;
      } else {
        return res.status(404).json({ error: 'Owner not found' });
      }
    }

    const result = await query(
      `SELECT m.*, sender.name as sender_name, receiver.name as receiver_name
       FROM staff_messages m
       JOIN school_admins sender ON m.sender_id = sender.id
       JOIN school_admins receiver ON m.receiver_id = receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [req.user.id, targetId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
};

// 9. Send Message
export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { receiver_id, message } = req.body;
  let targetId = receiver_id;

  if (!receiver_id || !message || message.trim() === '') {
    return res.status(400).json({ error: 'Receiver and message content are required' });
  }

  try {
    if (receiver_id === 'owner') {
      const ownerRes = await query("SELECT id FROM school_admins WHERE role = 'SuperAdmin' AND sub_role IS NULL LIMIT 1");
      if (ownerRes.rows.length > 0) {
        targetId = ownerRes.rows[0].id;
      } else {
        return res.status(404).json({ error: 'Owner not found' });
      }
    }

    const result = await query(
      `INSERT INTO staff_messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, targetId, message.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
};

// 10. Get Staff Performance Metrics (Owner dashboard only)
export const getStaffPerformance = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Count onboarding requests approved by each user
    const approvals = await query(
      `SELECT user_id, COUNT(*) as count 
       FROM audit_logs 
       WHERE action = 'Approved Onboarding Request' 
       GROUP BY user_id`
    );

    // Count support tickets replied by each user
    const supportReplies = await query(
      `SELECT user_id, COUNT(*) as count 
       FROM audit_logs 
       WHERE action = 'Replied Support Ticket' 
       GROUP BY user_id`
    );

    // Sum active session time (minutes) for each user
    const sessionTime = await query(
      `SELECT user_id, COALESCE(SUM(duration_minutes), 0) as total_minutes 
       FROM user_sessions 
       GROUP BY user_id`
    );

    res.json({
      approvals: approvals.rows,
      supportReplies: supportReplies.rows,
      sessionTime: sessionTime.rows
    });
  } catch (error) {
    console.error('Error compiling staff performance:', error);
    res.status(500).json({ error: 'Server error compiling performance metrics' });
  }
};

// 11. Public: Submit Staff Application
export const applyStaff = async (req: any, res: Response) => {
  const { name, email, sub_role, resume_url, bio, experience_ans, scenario_ans, availability_ans } = req.body;

  if (!name || !email || !sub_role) {
    return res.status(400).json({ error: 'Name, email, and preferred role are required' });
  }

  try {
    const result = await query(
      `INSERT INTO staff_applications (name, email, sub_role, resume_url, bio, experience_ans, scenario_ans, availability_ans)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name, 
        email.toLowerCase().trim(), 
        sub_role, 
        resume_url || null, 
        bio || null,
        experience_ans || null,
        scenario_ans || null,
        availability_ans || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting staff application:', error);
    res.status(500).json({ error: 'Server error submitting application' });
  }
};

// 12. Super Admin: List Staff Applications
export const getStaffApplications = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid' });
  }

  try {
    const result = await query(
      `SELECT * FROM staff_applications 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff applications:', error);
    res.status(500).json({ error: 'Server error fetching applications' });
  }
};

// 13. Super Admin: Reject Staff Application
export const rejectStaffApplication = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid' });
  }

  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE staff_applications 
       SET status = 'Rejected' 
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await logAudit(
      req.user.id,
      'Rejected Staff Application',
      `Rejected staff application from "${result.rows[0].name}" (${result.rows[0].email})`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting staff application:', error);
    res.status(500).json({ error: 'Server error rejecting application' });
  }
};

// 14. Super Admin: Hire Staff Application (Approves & Creates Account)
export const hireStaffApplication = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin' || req.user.sub_role) {
    return res.status(403).json({ error: 'Fasax uma lihid' });
  }

  const { id } = req.params;

  try {
    // 1. Fetch application details
    const appResult = await query(
      `SELECT * FROM staff_applications WHERE id = $1 AND status = 'Pending'`,
      [id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pending application not found' });
    }

    const app = appResult.rows[0];

    // 2. Check if email already registered in system
    const existing = await query('SELECT id FROM school_admins WHERE email = $1', [app.email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // 3. Generate sequential staff ID
    const lastStaff = await query(
      `SELECT staff_id FROM school_admins 
       WHERE staff_id LIKE 'SMA-%' 
       ORDER BY staff_id DESC LIMIT 1`
    );

    let nextId = 'SMA-101';
    if (lastStaff.rows.length > 0 && lastStaff.rows[0].staff_id) {
      const match = lastStaff.rows[0].staff_id.match(/SMA-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1]);
        nextId = `SMA-${lastNum + 1}`;
      }
    }

    // 4. Generate random temporary password
    const tempPassword = Math.random().toString(36).slice(-8); // random 8-character string
    const hash = await bcrypt.hash(tempPassword, 12);

    // 5. Insert new staff admin record
    const serialNum = `SMA-AGENT-${app.sub_role.slice(0, 3).toUpperCase()}-${nextId.replace('SMA-', '')}`;
    const staffResult = await query(
      `INSERT INTO school_admins (name, email, password_hash, role, sub_role, staff_id, is_department_head, serial_number)
       VALUES ($1, $2, $3, 'SuperAdmin', $4, $5, FALSE, $6)
       RETURNING id, name, email, role, sub_role, staff_id, is_department_head, serial_number`,
      [app.name, app.email, hash, app.sub_role, nextId, serialNum]
    );

    // 6. Update application status to Hired
    await query(
      `UPDATE staff_applications SET status = 'Hired' WHERE id = $1`,
      [id]
    );

    await logAudit(
      req.user.id,
      'Hired Staff Member',
      `Approved application and hired "${app.name}" (${nextId}) as ${app.sub_role}`
    );

    // 7. Return details including temp password to show owner
    res.json({
      success: true,
      staff: staffResult.rows[0],
      tempPassword
    });
  } catch (error) {
    console.error('Error hiring staff application:', error);
    res.status(500).json({ error: 'Server error hiring application' });
  }
};

// 15. Public: Verify Staff Member Credentials
export const verifyStaff = async (req: any, res: Response) => {
  const { id } = req.params; // this is the serial_number, e.g. SMA-AGENT-BIL-102
  
  try {
    const result = await query(
      `SELECT name, email, role, sub_role, staff_id, avatar_url, is_department_head, serial_number, created_at
       FROM school_admins
       WHERE serial_number = $1 OR (staff_id = $1 AND role = 'SuperAdmin')`,
      [id.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nambarkan tixraaca ma jiro ama ma ahan shaqaale rami ah (Invalid reference number)' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying staff member:', error);
    res.status(500).json({ error: 'Cillad dhinaca server-ka ah ayaa dhacday' });
  }
};
