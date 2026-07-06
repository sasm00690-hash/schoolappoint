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
    console.log('🚀 Running database migration v12...');
    
    // Add columns
    await pool.query(`
      ALTER TABLE school_admins 
      ADD COLUMN IF NOT EXISTS is_department_head BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR(50) UNIQUE;
    `);
    console.log('✅ Added hierarchy and serial_number columns.');

    // Fetch existing SuperAdmins to backfill serial numbers
    const res = await pool.query(`
      SELECT id, role, sub_role, is_department_head, serial_number 
      FROM school_admins 
      WHERE role = 'SuperAdmin'
    `);
    
    console.log(`ℹ️ Found ${res.rows.length} existing admin accounts to backfill.`);
    
    for (const row of res.rows) {
      if (row.serial_number) continue; // Already has one
      
      let serial = '';
      if (!row.sub_role) {
        // Owner
        serial = 'SMA-OWNER-001';
      } else {
        const typeStr = row.is_department_head ? 'HEAD' : 'AGENT';
        const deptAbbrev = row.sub_role.slice(0, 3).toUpperCase();
        serial = `SMA-${typeStr}-${deptAbbrev}-${row.id}`;
      }
      
      // Ensure uniqueness (in case of conflict, we append random chars)
      let uniqueSerial = serial;
      let conflict = true;
      let counter = 1;
      while (conflict) {
        const check = await pool.query('SELECT id FROM school_admins WHERE serial_number = $1', [uniqueSerial]);
        if (check.rows.length === 0) {
          conflict = false;
        } else {
          uniqueSerial = `${serial}-${counter}`;
          counter++;
        }
      }
      
      await pool.query('UPDATE school_admins SET serial_number = $1 WHERE id = $2', [uniqueSerial, row.id]);
      console.log(`✅ Backfilled user ${row.id} (${row.sub_role || 'Owner'}) with serial: ${uniqueSerial}`);
    }

    console.log('🚀 Migration v12 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration v12 failed:', error);
    process.exit(1);
  }
}

main();
