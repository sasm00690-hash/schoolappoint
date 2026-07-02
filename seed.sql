-- Seed script for SchoolAppoint database (Production Ready)

-- 1. Populate Subscription Plans
INSERT INTO subscription_plans (name, price, max_appointments_per_month, features)
VALUES 
('Starter', 0.00, 50, '["50 bookings/month", "1 School Admin", "Basic Dashboard"]'::jsonb),
('Standard', 0.00, 500, '["500 bookings/month", "5 School Admins", "Waiting List & Reminders"]'::jsonb),
('Premium', 0.00, 999999, '["Unlimited bookings", "Unlimited admins", "Custom Branding & CSV Export"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. Populate Platform Super Admin (adnantik19@gmail.com / adnantik12)
INSERT INTO school_admins (name, email, password_hash, role, school_id)
VALUES (
  'Platform Super Admin', 
  'adnantik19@gmail.com', 
  '$2b$12$vdgFE7mk5B3/t0QbOy5pQ.nP1aKyMhrkffSx4F1I.wAKvPGOZOQua', 
  'SuperAdmin', 
  NULL
)
ON CONFLICT (email) DO NOTHING;

-- 3. Populate Your First Real School (Alhudda model) & School Admin account (alhuddamodel2@gmail.com / alhudda123)
DO $$
DECLARE
    alhudda_id UUID;
    premium_plan_id UUID;
BEGIN
    -- Get Plan ID
    SELECT id INTO premium_plan_id FROM subscription_plans WHERE name = 'Premium';

    -- Check if Alhudda model exists
    SELECT id INTO alhudda_id FROM schools WHERE email = 'alhuddamodel2@gmail.com';
    IF alhudda_id IS NULL THEN
        INSERT INTO schools (name, logo_url, description, address, phone, email, admission_status, max_appointments_per_day, max_appointments_per_hour)
        VALUES (
          'Alhudda model', 
          NULL, 
          'Alhudda Model School - Providing high-quality education and modern admission facilities.', 
          'Dharkenley mogadisho', 
          '615455565', 
          'alhuddamodel2@gmail.com', 
          'Open', 
          50, 
          5
        ) RETURNING id INTO alhudda_id;

        -- Create Admin Login Account (alhuddamodel2@gmail.com / alhudda123)
        INSERT INTO school_admins (name, email, password_hash, role, school_id)
        VALUES (
          'Alhudda Admin', 
          'alhuddamodel2@gmail.com', 
          '$2b$12$EcS/LL1Nn4Y96y6fw7V7auwYhYuXVumvuQaGQj4zEmLIdnTgXOZ1C', 
          'Admin', 
          alhudda_id
        );

        -- Create Subscription (Active, Premium)
        INSERT INTO subscriptions (school_id, plan_id, status, start_date, end_date)
        VALUES (
          alhudda_id, 
          premium_plan_id, 
          'Active', 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP + INTERVAL '12 months'
        );
    END IF;
END $$;
