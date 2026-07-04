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
    console.log('🚀 Running database migration v10...');
    
    // 1. Add avatar_url column to school_admins table
    await pool.query(`
      ALTER TABLE school_admins 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
    console.log('✅ Added avatar_url column to school_admins.');

    // 2. Create staff_applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        sub_role VARCHAR(50) NOT NULL,
        resume_url TEXT,
        bio TEXT,
        status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created staff_applications table.');

    console.log('🚀 Migration v10 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration v10 failed:', error);
    process.exit(1);
  }
}

main();
