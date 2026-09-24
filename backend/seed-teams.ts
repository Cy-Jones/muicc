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

  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const id = crypto.randomUUID();
    const countryClean = (t.country || 'TEAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const ref = `MULSU-${countryClean}-${2601 + i}`;
    await db.prepare('INSERT INTO teams (id, name, country, status, registration_ref, university, coach_name, manager_name, manager_email, manager_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, t.name, t.country, 'APPROVED', ref, 'MU', 'Coach', 'Manager', 'test@test.com', '1234567890');
  }
  
  console.log("Teams seeded. Use Admin panel or API to generate draw.");
}

run().catch(console.error);
