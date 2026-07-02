import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

// Helper to generate the next appointment number: 4-digit unique number starting at 1001
const generateAppointmentNumber = async (): Promise<string> => {
  try {
    const result = await query('SELECT appointment_number FROM appointments');
    let maxNum = 1000;
    for (const row of result.rows) {
      const num = parseInt(row.appointment_number, 10);
      if (!isNaN(num) && num >= 1000 && num < 10000) {
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    return (maxNum + 1).toString();
  } catch (error) {
    console.error('Error generating appointment number:', error);
    const countResult = await query('SELECT count(*) as count FROM appointments');
    const nextNum = 1000 + parseInt(countResult.rows[0].count, 10) + 1;
    return nextNum.toString();
  }
};

export const createAppointment = async (req: AuthenticatedRequest, res: Response) => {
  const {
    school_id,
    parent_name,
    phone_number,
    email,
    appointment_date,
    appointment_time,
    students, // optional array: [{ student_name, gender, grade_applying_for, student_age, student_photo }]
    custom_data // optional JSONB object: { father_occupation, previous_school, ... }
  } = req.body;

  if (!school_id || !parent_name || !phone_number || !email || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Support batch booking or legacy single booking format
  const studentsList = Array.isArray(students) && students.length > 0
    ? students
    : [{
        student_name: req.body.student_name,
        gender: req.body.gender,
        grade_applying_for: req.body.grade_applying_for,
        student_age: req.body.student_age,
        student_photo: req.body.student_photo
      }];

  // Validate all students in list
  for (const s of studentsList) {
    if (!s.student_name || !s.gender || !s.grade_applying_for) {
      return res.status(400).json({ error: 'Student details (name, gender, grade) are required for all bookings' });
    }
  }

  try {
    // 1. Get School Configuration and Capacity
    const schoolResult = await query(
      `SELECT name, max_appointments_per_day, max_appointments_per_hour, admission_status, phone, blockout_dates 
       FROM schools WHERE id = $1`,
      [school_id]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    const school = schoolResult.rows[0];

    if (school.admission_status === 'Closed') {
      return res.status(400).json({ error: 'Admissions are closed for this school' });
    }

    // Validate if appointment_date is in the school's blockout_dates list
    const blockoutDates = school.blockout_dates || [];
    const formattedApptDate = new Date(appointment_date).toISOString().split('T')[0];
    if (blockoutDates.includes(formattedApptDate)) {
      return res.status(400).json({ error: 'Fadlan naga raali noqo, taariikhdan waa maalin fasax ah oo ballantu xiran tahay / Please excuse us, this date is blocked for holidays/closures.' });
    }

    // 2. Check Capacity Limits
    // Count total appointments for that school on that day
    const dayCountResult = await query(
      `SELECT count(*) as count FROM appointments 
       WHERE school_id = $1 AND appointment_date = $2 AND status != 'Cancelled' AND status != 'Rejected'`,
      [school_id, appointment_date]
    );
    const dayCount = parseInt(dayCountResult.rows[0].count, 10);

    // Count appointments for that hour
    const hourCountResult = await query(
      `SELECT count(*) as count FROM appointments 
       WHERE school_id = $1 AND appointment_date = $2 AND EXTRACT(HOUR FROM appointment_time) = EXTRACT(HOUR FROM $3::TIME) AND status != 'Cancelled' AND status != 'Rejected'`,
      [school_id, appointment_date, appointment_time]
    );
    const hourCount = parseInt(hourCountResult.rows[0].count, 10);

    // Check if limit is reached with the new batch size
    const isDayLimit = (dayCount + studentsList.length - 1) >= school.max_appointments_per_day;
    const isHourLimit = (hourCount + studentsList.length - 1) >= school.max_appointments_per_hour;

    if (isDayLimit || isHourLimit) {
      // Automatic Waiting List Enrollment for all siblings
      const waitingListEntries = [];
      for (const s of studentsList) {
        const wlResult = await query(
          `INSERT INTO waiting_list (school_id, parent_name, phone_number, student_name, grade, custom_data)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            school_id,
            parent_name,
            phone_number,
            s.student_name,
            s.grade_applying_for,
            custom_data ? JSON.stringify(custom_data) : JSON.stringify({})
          ]
        );
        waitingListEntries.push(wlResult.rows[0]);
      }

      await logAudit(null, 'Enrolled Waitlist', `Parent "${parent_name}" enrolled ${studentsList.length} student(s) into waiting list for school: "${school.name}"`);

      return res.status(200).json({
        status: 'WaitingList',
        message: 'Admissions for this slot/day are currently full. You have been added to the waiting list.',
        school_name: school.name,
        whatsapp_number: school.phone,
        waiting_list: waitingListEntries
      });
    }

    // 3. Generate APP Number and Book Appointments for all siblings
    const bookedAppointments = [];
    for (const s of studentsList) {
      const appNum = await generateAppointmentNumber();
      const result = await query(
        `INSERT INTO appointments (
           appointment_number, school_id, student_name, parent_name, phone_number, 
           email, gender, grade_applying_for, appointment_date, appointment_time, status,
           student_age, student_photo, custom_data
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', $11, $12, $13)
         RETURNING *`,
        [
          appNum,
          school_id,
          s.student_name,
          parent_name,
          phone_number,
          email,
          s.gender,
          s.grade_applying_for,
          appointment_date,
          appointment_time,
          s.student_age ? parseInt(s.student_age, 10) : null,
          s.student_photo || null,
          custom_data ? JSON.stringify(custom_data) : JSON.stringify({})
        ]
      );
      bookedAppointments.push(result.rows[0]);
    }

    await logAudit(null, 'Created Appointment', `Parent "${parent_name}" booked ${studentsList.length} appointment(s) for school: "${school.name}"`);

    res.status(201).json({
      status: 'Success',
      appointment: bookedAppointments[0], // backward compatibility
      appointments: bookedAppointments,
      school_name: school.name,
      whatsapp_number: school.phone
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Server error during booking' });
  }
};

export const getAppointments = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id, role } = req.user!;
  const { status, search, page = 1, limit = 20 } = req.query;

  let queryText = `
    SELECT a.*, s.name as school_name 
    FROM appointments a
    JOIN schools s ON a.school_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If not SuperAdmin, restrict to school_id
  if (role !== 'SuperAdmin') {
    params.push(school_id);
    queryText += ` AND a.school_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    queryText += ` AND a.status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    queryText += ` AND (a.student_name ILIKE $${params.length} OR a.parent_name ILIKE $${params.length} OR a.appointment_number ILIKE $${params.length})`;
  }

  // Pagination
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  queryText += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  try {
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Server error fetching appointments' });
  }
};

export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Approved, Rejected, Cancelled, Rescheduled
  const { school_id, role } = req.user!;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    // Verify ownership
    const appCheck = await query('SELECT school_id, appointment_number, student_name, status FROM appointments WHERE id = $1', [id]);
    if (appCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (role !== 'SuperAdmin' && appCheck.rows[0].school_id !== school_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    const userId = req.user?.id || null;
    await logAudit(
      userId,
      'Updated Appointment Status',
      `Changed appointment "${appCheck.rows[0].appointment_number}" for student "${appCheck.rows[0].student_name}" status to "${status}"`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Server error updating appointment' });
  }
};

export const exportAppointmentsCSV = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id, role } = req.user!;

  try {
    let result;
    if (role === 'SuperAdmin') {
      result = await query('SELECT * FROM appointments ORDER BY created_at DESC');
    } else {
      result = await query('SELECT * FROM appointments WHERE school_id = $1 ORDER BY created_at DESC', [school_id]);
    }

    const rows = result.rows;

    // Convert to CSV string
    const headers = ['Appointment Number', 'Student Name', 'Parent Name', 'Phone', 'Email', 'Gender', 'Grade', 'Date', 'Time', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.appointment_number}"`,
        `"${r.student_name}"`,
        `"${r.parent_name}"`,
        `"${r.phone_number}"`,
        `"${r.email}"`,
        `"${r.gender}"`,
        `"${r.grade_applying_for}"`,
        `"${r.appointment_date.toISOString().split('T')[0]}"`,
        `"${r.appointment_time}"`,
        `"${r.status}"`,
        `"${r.created_at.toISOString()}"`
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.attachment('appointments.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Server error exporting CSV' });
  }
};

export const getWaitingList = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id, role } = req.user!;

  try {
    let result;
    if (role === 'SuperAdmin') {
      result = await query('SELECT wl.*, s.name as school_name FROM waiting_list wl JOIN schools s ON wl.school_id = s.id ORDER BY wl.created_at DESC');
    } else {
      result = await query('SELECT * FROM waiting_list WHERE school_id = $1 ORDER BY created_at DESC', [school_id]);
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waiting list:', error);
    res.status(500).json({ error: 'Server error fetching waiting list' });
  }
};

export const getAppointmentByNumber = async (req: AuthenticatedRequest, res: Response) => {
  const { apptNum } = req.params;
  const { school_id, role } = req.user!;

  try {
    const result = await query(
      `SELECT a.*, s.name as school_name 
       FROM appointments a
       JOIN schools s ON a.school_id = s.id
       WHERE a.appointment_number = $1`,
      [apptNum]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = result.rows[0];

    if (role !== 'SuperAdmin' && appointment.school_id !== school_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment by number:', error);
    res.status(500).json({ error: 'Server error fetching appointment' });
  }
};
