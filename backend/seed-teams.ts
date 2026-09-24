import { db } from './server/db.js';
import crypto from 'crypto';

async function run() {
  console.log("Cleaning DB...");
  await db.exec('DELETE FROM matches');
  await db.exec('DELETE FROM standings');
  await db.exec('DELETE FROM group_teams');
  // keep groups
  await db.exec('DELETE FROM players');
  await db.exec('DELETE FROM teams');

  console.log("Inserting 7 teams...");
  const teams = [
    { name: 'Tanzania Taifa Stars', country: 'Tanzania' },
    { name: 'Super Eagles FC', country: 'Nigeria' },
    { name: 'MULSU', country: 'Liberia' },
    { name: 'SSD', country: 'South Sudan' },
    { name: 'Eswatini FC', country: 'Eswatini' },
    { name: 'USAMU', country: 'Uganda' },
    { name: 'Zimbabwe Warriors', country: 'Zimbabwe' },
  ];

  for (const t of teams) {
    const id = crypto.randomUUID();
    const ref = crypto.randomUUID().substring(0, 8);
    await db.prepare('INSERT INTO teams (id, name, country, status, registration_ref, university, coach_name, manager_name, manager_email, manager_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, t.name, t.country, 'APPROVED', ref, 'MU', 'Coach', 'Manager', 'test@test.com', '1234567890');
  }
  
  console.log("Teams seeded. Use Admin panel or API to generate draw.");
}

run().catch(console.error);
