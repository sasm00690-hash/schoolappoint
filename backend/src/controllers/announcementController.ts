import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, type = 'Info' } = req.body;
  const superAdminId = req.user?.id || null;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await query(
      `INSERT INTO announcements (title, content, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, type]
    );

    await logAudit(superAdminId, 'Broadcast Announcement', `Broadcasted system announcement: "${title}"`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Server error creating announcement' });
  }
};

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Server error fetching announcements' });
  }
};

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const superAdminId = req.user?.id || null;

  try {
    const checkResult = await query('SELECT title FROM announcements WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const title = checkResult.rows[0].title;
    await query('DELETE FROM announcements WHERE id = $1', [id]);

    await logAudit(superAdminId, 'Deleted Announcement', `Removed system announcement: "${title}"`);

    res.json({ message: 'Announcement deleted successfully', id });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Server error deleting announcement' });
  }
};
