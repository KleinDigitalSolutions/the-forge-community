import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

// Wir versuchen, über die IP zu verbinden, aber den Hostnamen für SNI zu setzen
const client = new Client({
  host: '3.69.34.233',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_uASE9O4nUPCo',
  database: 'neondb',
  ssl: {
    servername: 'ep-shiny-heart-agvjkvj5.c-2.eu-central-1.aws.neon.tech',
    rejectUnauthorized: false
  }
});

async function test() {
  console.log("Connecting to IP with SNI...");
  try {
    await client.connect();
    console.log("SUCCESS! Connected via IP + SNI.");
    const res = await client.query('SELECT NOW()');
    console.log("Time:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

test();
