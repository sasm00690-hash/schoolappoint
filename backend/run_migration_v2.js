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
    console.log('🚀 Running database migration v2...');
    
    // Create onboarding_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS onboarding_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        address VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created onboarding_requests table (if not exists).');

    // Create announcements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(150) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(30) DEFAULT 'Info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created announcements table (if not exists).');

    console.log('🎉 Migration v2 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v2 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
