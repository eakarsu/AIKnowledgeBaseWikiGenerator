require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { initializeDatabase, pool } = require('../config/database');

async function main() {
  await initializeDatabase();
  const email=(process.env.ADMIN_EMAIL||'runtime-admin@example.com').trim().toLowerCase();
  const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD||'RuntimeAcceptance123!',12);
  await pool.query(`INSERT INTO users (email,password,name,role,email_verified) VALUES ($1,$2,$3,'admin',true) ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role=EXCLUDED.role,email_verified=true`,[email,hash,'Runtime Administrator']);
}
main().then(()=>pool.end()).catch(async e=>{console.error(`Runtime initialization failed: ${e.message}`);await pool.end().catch(()=>{});process.exit(1)});
