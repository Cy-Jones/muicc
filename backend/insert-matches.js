import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.production' });

async function run() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  const teams = {
    LBR: '3cea1757-6fb0-4422-87e5-7dc1e9a54d7a',
    SWZ: '5083c6c5-227f-4739-807f-80320a9fc5d1',
    UGA: '688c8567-0171-482d-806b-a5266f63f559',
    TZA: '26b8fa4b-1dae-41a7-a6a7-f78e2621b57d',
    ZWE: '95410ca6-244e-46a8-a50e-d5ec182278fa',
    NGA: '2d0d35f1-865c-49d1-9790-a54d80945715',
    SSD: '6ccab531-08d4-456b-9b2c-d78022511c86'
  };

  const matchDays = [
    { id: 'md-1', number: 1, name: 'MATCH DAY 1', date: '2026-09-26', status: 'OPEN' },
    { id: 'md-2', number: 2, name: 'MATCH DAY 2', date: '2026-09-27', status: 'NOT_OPEN' },
    { id: 'md-3', number: 3, name: 'MATCH DAY 3', date: '2026-10-02', status: 'NOT_OPEN' },
    { id: 'md-4', number: 4, name: 'MATCH DAY 4', date: '2026-10-03', status: 'NOT_OPEN' },
    { id: 'md-5', number: 5, name: 'MATCH DAY 5', date: '2026-10-04', status: 'NOT_OPEN' },
    { id: 'md-6', number: 6, name: 'MATCH DAY 6', date: '2026-10-05', status: 'NOT_OPEN' },
    { id: 'md-7', number: 7, name: 'MATCH DAY 7', date: '2026-10-06', status: 'NOT_OPEN' },
    { id: 'md-8', number: 8, name: 'SEMI-FINALS', date: '2026-10-08', status: 'NOT_OPEN' },
    { id: 'md-9', number: 9, name: 'FINALS', date: '2026-10-10', status: 'NOT_OPEN' }
  ];

  // Upsert match days
  for (const md of matchDays) {
    const existing = await client.execute({ sql: 'SELECT id FROM match_days WHERE id = ?', args: [md.id] });
    if (existing.rows.length === 0) {
      await client.execute({
        sql: 'INSERT INTO match_days (id, number, name, date, prediction_status) VALUES (?, ?, ?, ?, ?)',
        args: [md.id, md.number, md.name, md.date, md.status]
      });
    } else {
      await client.execute({
        sql: 'UPDATE match_days SET name = ?, date = ? WHERE id = ?',
        args: [md.name, md.date, md.id]
      });
    }
  }

  async function ensureTBD(name) {
    const existing = await client.execute({ sql: 'SELECT id FROM teams WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) return existing.rows[0].id;
    const id = crypto.randomUUID();
    await client.execute({
      sql: 'INSERT INTO teams (id, registration_ref, name, university, country, coach_name, manager_name, manager_email, manager_phone, logo_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, \'\', \'APPROVED\')',
      args: [id, id, name, "TBD", "TBD", "TBD", "TBD", "tbd@example.com", "000"]
    });
    return id;
  }

  const tbdA1 = await ensureTBD('Group A Winner');
  const tbdB2 = await ensureTBD('Group B Runner-up');
  const tbdB1 = await ensureTBD('Group B Winner');
  const tbdA2 = await ensureTBD('Group A Runner-up');
  const tbdSF1 = await ensureTBD('Semi-Final Loser 1');
  const tbdSF2 = await ensureTBD('Semi-Final Loser 2');
  const tbdSFW1 = await ensureTBD('Semi-Final Winner 1');
  const tbdSFW2 = await ensureTBD('Semi-Final Winner 2');

  const matches = [
    { teamA: teams.LBR, teamB: teams.SSD, md: 'md-1', date: '2026-09-26', time: '16:30', group: 'grp-a', stage: 'GROUP' },
    { teamA: teams.NGA, teamB: teams.TZA, md: 'md-2', date: '2026-09-27', time: '15:30', group: 'grp-a', stage: 'GROUP' },
    { teamA: teams.ZWE, teamB: teams.UGA, md: 'md-2', date: '2026-09-27', time: '17:30', group: 'grp-b', stage: 'GROUP' },
    { teamA: teams.ZWE, teamB: teams.SWZ, md: 'md-3', date: '2026-10-02', time: '17:00', group: 'grp-b', stage: 'GROUP' },
    { teamA: teams.SSD, teamB: teams.NGA, md: 'md-4', date: '2026-10-03', time: '15:30', group: 'grp-a', stage: 'GROUP' },
    { teamA: teams.LBR, teamB: teams.TZA, md: 'md-4', date: '2026-10-03', time: '17:30', group: 'grp-a', stage: 'GROUP' },
    { teamA: teams.SWZ, teamB: teams.UGA, md: 'md-5', date: '2026-10-04', time: '17:00', group: 'grp-b', stage: 'GROUP' },
    { teamA: teams.SSD, teamB: teams.TZA, md: 'md-6', date: '2026-10-05', time: '17:00', group: 'grp-a', stage: 'GROUP' },
    { teamA: teams.LBR, teamB: teams.NGA, md: 'md-7', date: '2026-10-06', time: '17:00', group: 'grp-a', stage: 'GROUP' },
    { teamA: tbdA1, teamB: tbdB2, md: 'md-8', date: '2026-10-08', time: '15:00', group: null, stage: 'SEMI_FINAL' },
    { teamA: tbdB1, teamB: tbdA2, md: 'md-8', date: '2026-10-08', time: '17:00', group: null, stage: 'SEMI_FINAL' },
    { teamA: tbdSF1, teamB: tbdSF2, md: 'md-9', date: '2026-10-10', time: '15:00', group: null, stage: 'THIRD_PLACE' },
    { teamA: tbdSFW1, teamB: tbdSFW2, md: 'md-9', date: '2026-10-10', time: '16:45', group: null, stage: 'FINAL' }
  ];

  // Clear existing matches to avoid duplicates
  await client.execute('DELETE FROM matches');

  let count = 1;
  for (const m of matches) {
    const matchCode = `MIUCC-M${count.toString().padStart(2, '0')}`;
    const newId = crypto.randomUUID();
    await client.execute({
      sql: `
        INSERT INTO matches (id, match_code, match_day_id, group_id, stage, team_a_id, team_b_id, date, time, venue, status, score_a, score_b, minute_text, confirmed_result)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Marwadi University Main Stadium', 'SCHEDULED', 0, 0, '', 0)
      `,
      args: [newId, matchCode, m.md, m.group, m.stage, m.teamA, m.teamB, m.date, m.time]
    });
    count++;
  }

  console.log("Matches inserted successfully!");
}
run().catch(console.error);
