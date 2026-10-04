import { db, initDatabase } from './db.js';
import * as crypto from 'crypto';

async function seedDev() {
  await initDatabase();
  console.log("Seeding test data for development...");

  const teams: string[] = [];
  
  // Create 7 Teams
  for (let i = 1; i <= 7; i++) {
    const teamId = crypto.randomUUID();
    teams.push(teamId);
    await db.prepare(`
      INSERT INTO teams (id, registration_ref, name, university, country, coach_name, manager_name, manager_email, manager_phone, logo_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(teamId, crypto.randomUUID().slice(0, 8), `FC Testing ${i}`, `Test Uni ${i}`, `TestLand ${i}`, `Coach ${i}`, `Mgr ${i}`, `mgr${i}@test.com`, '12345678', null, 'APPROVED');
  }

  // Create 200 Players
  for (let i = 1; i <= 200; i++) {
    const pid = crypto.randomUUID();
    const teamId = teams[i % 7];
    await db.prepare(`
      INSERT INTO players (id, player_id, team_id, full_name, dob, nationality, student_id, university, position, jersey_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pid, `T-${crypto.randomUUID().slice(0,4)}-${i}`, teamId, `Player ${i}`, '2000-01-01', 'TestLand', `STU-${i}`, 'Test Uni', i % 2 === 0 ? 'Forward' : 'Defender', i % 99, 'APPROVED');
  }

  // Create 13 Live Matches
  for (let i = 1; i <= 13; i++) {
    const matchId = crypto.randomUUID();
    const teamAId = teams[i % 7];
    // Ensure teams are different
    let bIndex = (i + 1) % 7;
    if (bIndex === (i % 7)) bIndex = (i + 2) % 7;
    const teamBId = teams[bIndex];
    
    await db.prepare(`
      INSERT INTO matches (id, match_code, match_day_id, stage, team_a_id, team_b_id, date, time, venue, status, score_a, score_b, minute_text, live_period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(matchId, `DEV-M-${crypto.randomUUID().slice(0, 4)}-${i}`, 'md-1', 'GROUP', teamAId, teamBId, '2026-10-10', '19:00', 'Test Stadium', 'LIVE', 0, 0, '45', '1ST_HALF');
  }

  console.log("Done! Created 7 teams, 200 players, and 13 LIVE matches.");
}

seedDev().catch(console.error);
