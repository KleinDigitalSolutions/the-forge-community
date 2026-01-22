import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
  // Ensure we handle SSL correctly for Neon
  ssl: process.env.DATABASE_URL_UNPOOLED.includes('sslmode=require') || process.env.DATABASE_URL_UNPOOLED.includes('sslmode=verify-full') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 60000,
});

async function test() {
  console.log("Connecting to:", process.env.DATABASE_URL_UNPOOLED);
  try {
    await client.connect();
    console.log("Connected successfully to Postgres!");
    const res = await client.query('SELECT NOW()');
    console.log("Time:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

test();
