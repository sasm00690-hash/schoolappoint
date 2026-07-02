const pg = require('pg');
const fs = require('fs');
const path = require('path');
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
    console.log('📖 Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    
    console.log('📖 Reading seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8');
    
    try {
      console.log('🚀 Initializing database tables...');
      await pool.query(schemaSql);
      console.log('✅ Tables initialized successfully.');
    } catch (schemaError) {
      console.log('⚠️ Schema initialization skipped (tables may already exist):', schemaError.message);
    }
    
    console.log('🚀 Seeding database data (Super Admin & Alhudda Model)...');
    await pool.query(seedSql);
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();
