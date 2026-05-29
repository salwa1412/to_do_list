// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase pooler
});

// Test connection
pool.query('SELECT 1', (err) => {
  if (err) console.error('❌ DB connect error:', err.message);
  else console.log('✅ Database pool ready');
});

module.exports = pool;