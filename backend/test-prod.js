import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

async function run() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  const teams = await client.execute('SELECT id, name FROM teams');
  console.log("TEAMS:", teams.rows);
  
  const matchDays = await client.execute('SELECT id, date FROM match_days');
  console.log("MATCH DAYS:", matchDays.rows);
}
run();
