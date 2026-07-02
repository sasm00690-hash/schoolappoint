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
    console.log('🚀 Altering tables to add new features...');
    
    // Add student_age and student_photo to appointments
    await pool.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS student_age INTEGER;
    `);
    console.log('✅ Added student_age column (if not exists).');

    await pool.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS student_photo TEXT;
    `);
    console.log('✅ Added student_photo column (if not exists).');

    // Add working_days and time_slots to schools
    await pool.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS working_days JSONB DEFAULT '["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"]'::jsonb;
    `);
    console.log('✅ Added working_days column (if not exists).');

    await pool.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT '["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]'::jsonb;
    `);
    console.log('✅ Added time_slots column (if not exists).');

    console.log('🚀 Updating existing records to default values...');
    await pool.query(`
      UPDATE schools 
      SET working_days = '["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"]'::jsonb
      WHERE working_days IS NULL;
    `);
    await pool.query(`
      UPDATE schools 
      SET time_slots = '["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"]'::jsonb
      WHERE time_slots IS NULL;
    `);
    console.log('✅ Updated default working days and slots for existing schools.');
    
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();
