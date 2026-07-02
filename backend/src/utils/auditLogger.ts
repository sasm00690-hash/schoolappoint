import { query } from '../config/db';

export const logAudit = async (userId: string | null, action: string, details: string) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, action, details]
    );
  } catch (error) {
    console.error('❌ Failed to log audit action to DB:', error);
  }
};
