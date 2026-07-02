import { Response } from 'express';
import { query } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/auditLogger';

export const getSubscriptionPlans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM subscription_plans ORDER BY price ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Server error fetching subscription plans' });
  }
};

export const getSchoolSubscription = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id } = req.params;

  try {
    const result = await query(
      `SELECT s.*, sp.name as plan_name, sp.price, sp.max_appointments_per_month 
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.school_id = $1 AND s.status = 'Active'
       ORDER BY s.end_date DESC LIMIT 1`,
      [school_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found for this school' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Server error fetching subscription' });
  }
};

export const upgradeSubscription = async (req: AuthenticatedRequest, res: Response) => {
  const { school_id, plan_id, duration_months = 12 } = req.body;
  const superAdminId = req.user?.id || null;

  if (!school_id || !plan_id) {
    return res.status(400).json({ error: 'School ID and Plan ID are required' });
  }

  try {
    // 1. Get plan details
    const planResult = await query('SELECT * FROM subscription_plans WHERE id = $1', [plan_id]);
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const planName = planResult.rows[0].name;
    const planPrice = parseFloat(planResult.rows[0].price || 0);
    const amount = planPrice * duration_months;

    // 2. Get school details
    const schoolResult = await query('SELECT name FROM schools WHERE id = $1', [school_id]);
    const schoolName = schoolResult.rows.length > 0 ? schoolResult.rows[0].name : school_id;

    // 3. Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration_months);

    // 4. Deactivate old subscriptions
    await query(
      `UPDATE subscriptions SET status = 'Expired' WHERE school_id = $1 AND status = 'Active'`,
      [school_id]
    );

    // 5. Create new subscription
    const result = await query(
      `INSERT INTO subscriptions (school_id, plan_id, status, start_date, end_date)
       VALUES ($1, $2, 'Active', $3, $4)
       RETURNING *`,
      [school_id, plan_id, startDate, endDate]
    );

    // Create billing history invoice
    await query(
      `INSERT INTO billing_invoices (school_id, school_name, plan_name, amount, status)
       VALUES ($1, $2, $3, $4, 'Paid')`,
      [school_id, schoolName, planName, amount]
    );

    await logAudit(superAdminId, 'Upgraded School Subscription', `Set school "${schoolName}" subscription plan to "${planName}" for ${duration_months} months`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Server error upgrading subscription' });
  }
};

export const updateSubscriptionPlan = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { price, max_appointments_per_month } = req.body;
  const superAdminId = req.user?.id || null;

  if (price === undefined || max_appointments_per_month === undefined) {
    return res.status(400).json({ error: 'Price and max appointments are required' });
  }

  try {
    const planCheck = await query('SELECT name FROM subscription_plans WHERE id = $1', [id]);
    if (planCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const planName = planCheck.rows[0].name;

    const result = await query(
      `UPDATE subscription_plans
       SET price = $1, max_appointments_per_month = $2
       WHERE id = $3
       RETURNING *`,
      [Number(price), Number(max_appointments_per_month), id]
    );

    await logAudit(
      superAdminId,
      'Configured Billing Plan',
      `Updated plan rules for ${planName}: Price=$${price}, Limit=${max_appointments_per_month} bookings/month`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ error: 'Server error updating subscription plan' });
  }
};
