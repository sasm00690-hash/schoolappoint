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
    console.log('🚀 Running database migration v9...');
    
    // 1. Add staff columns to school_admins table
    await pool.query(`
      ALTER TABLE school_admins 
      ADD COLUMN IF NOT EXISTS sub_role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS staff_id VARCHAR(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS shift_start TIME,
      ADD COLUMN IF NOT EXISTS shift_end TIME,
      ADD COLUMN IF NOT EXISTS allowed_ip VARCHAR(45);
    `);
    console.log('✅ Added staff and security columns to school_admins.');

    // 2. Add logout and duration columns to user_sessions table
    await pool.query(`
      ALTER TABLE user_sessions 
      ADD COLUMN IF NOT EXISTS logout_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    `);
    console.log('✅ Added logout_time and duration_minutes to user_sessions.');

    // 3. Add target_audience to announcements table
    await pool.query(`
      ALTER TABLE announcements 
      ADD COLUMN IF NOT EXISTS target_audience VARCHAR(30) DEFAULT 'All';
    `);
    console.log('✅ Added target_audience column to announcements.');

    // 4. Create staff_tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        assigned_to UUID REFERENCES school_admins(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at TIMESTAMP
      );
    `);
    console.log('✅ Created staff_tasks table (if not exists).');

    // 5. Create staff_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID REFERENCES school_admins(id) ON DELETE CASCADE NOT NULL,
        receiver_id UUID REFERENCES school_admins(id) ON DELETE CASCADE NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created staff_messages table (if not exists).');

    console.log('🎉 Migration v9 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v9 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
