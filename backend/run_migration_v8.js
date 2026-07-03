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
    console.log('🚀 Running database migration v8...');
    
    // Add selected_plan to onboarding_requests table
    await pool.query(`
      ALTER TABLE onboarding_requests 
      ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50) DEFAULT 'Starter';
    `);
    console.log('✅ Added selected_plan column to onboarding_requests (if not exists).');

    console.log('🎉 Migration v8 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v8 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
