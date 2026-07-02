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
    console.log('🚀 Running database migration v4...');
    
    // Create user_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES school_admins(id) ON DELETE CASCADE NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(100) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        school_name VARCHAR(150),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        duration_minutes INTEGER DEFAULT 0
      );
    `);
    console.log('✅ Created user_sessions table (if not exists).');

    console.log('🎉 Migration v4 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v4 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
