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
    console.log('🚀 Running database migration v6...');

    // 1. Add configuration columns to schools table
    await pool.query(`
      ALTER TABLE schools 
      ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS blockout_dates JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Added custom_fields and blockout_dates columns to schools (if not exists).');

    // 2. Add custom_data column to appointments and waiting_list tables
    await pool.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added custom_data column to appointments (if not exists).');

    await pool.query(`
      ALTER TABLE waiting_list 
      ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added custom_data column to waiting_list (if not exists).');

    console.log('🎉 Migration v6 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v6 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
