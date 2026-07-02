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
    console.log('🚀 Running database migration v3...');
    
    // 1. Add admin_note column to appointments table
    await pool.query(`
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS admin_note TEXT;
    `);
    console.log('✅ Added admin_note column to appointments (if not exists).');

    // 2. Create scan_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
        sender_id UUID REFERENCES school_admins(id) ON DELETE CASCADE NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created scan_messages table (if not exists).');

    console.log('🎉 Migration v3 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v3 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
