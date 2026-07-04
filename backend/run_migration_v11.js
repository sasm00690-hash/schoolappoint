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
    console.log('🚀 Running database migration v11...');
    
    // Add screening question answers to staff_applications table
    await pool.query(`
      ALTER TABLE staff_applications 
      ADD COLUMN IF NOT EXISTS experience_ans TEXT,
      ADD COLUMN IF NOT EXISTS scenario_ans TEXT,
      ADD COLUMN IF NOT EXISTS availability_ans TEXT;
    `);
    console.log('✅ Added screening answers columns to staff_applications.');

    console.log('🚀 Migration v11 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration v11 failed:', error);
    process.exit(1);
  }
}

main();
