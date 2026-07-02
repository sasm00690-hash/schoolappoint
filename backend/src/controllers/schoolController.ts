import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getSchools = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, logo_url, description, address, phone, email, admission_status, max_appointments_per_day, max_appointments_per_hour, working_days, time_slots, custom_fields, blockout_dates
       FROM schools
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Server error fetching schools' });
  }
};

export const getSchoolById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT id, name, logo_url, description, address, phone, email, admission_status, max_appointments_per_day, max_appointments_per_hour, working_days, time_slots, custom_fields, blockout_dates
       FROM schools
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching school by ID:', error);
    res.status(500).json({ error: 'Server error fetching school' });
  }
};

export const createSchool = async (req: AuthenticatedRequest, res: Response) => {
  const { name, logo_url, description, address, phone, email, max_appointments_per_day, max_appointments_per_hour, working_days, time_slots, custom_fields, blockout_dates } = req.body;
  const superAdminId = req.user?.id || null;

  if (!name || !address || !phone || !email) {
    return res.status(400).json({ error: 'Name, address, phone, and email are required' });
  }

  try {
    const result = await query(
      `INSERT INTO schools (name, logo_url, description, address, phone, email, max_appointments_per_day, max_appointments_per_hour, working_days, time_slots, custom_fields, blockout_dates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        logo_url || null,
        description || '',
        address,
        phone,
        email.toLowerCase(),
        max_appointments_per_day || 50,
        max_appointments_per_hour || 5,
        working_days ? JSON.stringify(working_days) : JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"]),
        time_slots ? JSON.stringify(time_slots) : JSON.stringify(["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]),
        custom_fields ? JSON.stringify(custom_fields) : JSON.stringify([]),
        blockout_dates ? JSON.stringify(blockout_dates) : JSON.stringify([])
      ]
    );

    await logAudit(superAdminId, 'Registered School Tenant', `Onboarded school: "${name}" (${email.toLowerCase()})`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Server error creating school' });
  }
};

export const updateSchool = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, logo_url, description, address, phone, email, admission_status, max_appointments_per_day, max_appointments_per_hour, working_days, time_slots, custom_fields, blockout_dates } = req.body;
  const userId = req.user?.id || null;

  // Ensure school admin can only modify their own school
  if (req.user?.role === 'Admin' && req.user.school_id !== id) {
    return res.status(403).json({ error: 'Access denied: You can only edit your own school' });
  }

  try {
    const result = await query(
      `UPDATE schools
       SET name = COALESCE($1, name),
           logo_url = COALESCE($2, logo_url),
           description = COALESCE($3, description),
           address = COALESCE($4, address),
           phone = COALESCE($5, phone),
           email = COALESCE($6, email),
           admission_status = COALESCE($7, admission_status),
           max_appointments_per_day = COALESCE($8, max_appointments_per_day),
           max_appointments_per_hour = COALESCE($9, max_appointments_per_hour),
           working_days = COALESCE($10, working_days),
           time_slots = COALESCE($11, time_slots),
           custom_fields = COALESCE($12, custom_fields),
           blockout_dates = COALESCE($13, blockout_dates)
       WHERE id = $14
       RETURNING *`,
      [
        name,
        logo_url,
        description,
        address,
        phone,
        email ? email.toLowerCase() : undefined,
        admission_status,
        max_appointments_per_day,
        max_appointments_per_hour,
        working_days ? JSON.stringify(working_days) : undefined,
        time_slots ? JSON.stringify(time_slots) : undefined,
        custom_fields ? JSON.stringify(custom_fields) : undefined,
        blockout_dates ? JSON.stringify(blockout_dates) : undefined,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    await logAudit(userId, 'Updated School Details', `Modified details for school: "${result.rows[0].name}"`);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Server error updating school' });
  }
};

export const deleteSchool = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const superAdminId = req.user?.id || null;

  try {
    const checkResult = await query('SELECT name FROM schools WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    const schoolName = checkResult.rows[0].name;

    await query('DELETE FROM schools WHERE id = $1', [id]);

    await logAudit(superAdminId, 'Deleted School Tenant', `Removed school: "${schoolName}"`);

    res.json({ message: 'School deleted successfully', id });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Server error deleting school' });
  }
};
