const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is missing in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('🚀 Running database migration v7...');

    // 1. Create billing_invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
        school_name VARCHAR(150) NOT NULL,
        plan_name VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        billing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'Paid' NOT NULL
      );
    `);
    console.log('✅ Created billing_invoices table (if not exists).');

    // 2. Create support_tickets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
        school_name VARCHAR(150) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        reply TEXT,
        status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        replied_at TIMESTAMP
      );
    `);
    console.log('✅ Created support_tickets table (if not exists).');

    // 3. Seed maintenance_mode default setting
    await pool.query(`
      INSERT INTO system_settings (key, value)
      VALUES ('maintenance_mode', 'false')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✅ Seeded default maintenance_mode setting.');

    console.log('🎉 Migration v7 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v7 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
