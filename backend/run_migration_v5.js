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
    console.log('🚀 Running database migration v5...');
    
    // Alter schools logo_url column to TEXT to support long Facebook/Instagram CDN URLs
    await pool.query(`
      ALTER TABLE schools ALTER COLUMN logo_url TYPE TEXT;
    `);
    console.log('✅ Altered schools.logo_url to TYPE TEXT.');

    console.log('🎉 Migration v5 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v5 failed:', error);
  } finally {
    await pool.end();
  }
}

main();
