import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import { useTestDatabase, removeDbFiles, uniqueEmail } from './helpers.js';

/**
 * The test that justifies the whole migration.
 *
 * Simulates a real backend restart: write representative tournament data,
 * close the database connection, re-run the full initialization path exactly
 * as a cold boot would, then assert nothing was lost or reset.
 *
 * Under the old sql.js implementation on an ephemeral disk this is precisely
 * what failed.
 */

const DB_FILE = useTestDatabase('persistence');

const { initDatabase, db, closeDatabase } = await import('../server/db.js');

const TEAM_REF = 'MULSU-PERSIST-0001';
const TEAM_ID = 'team-persist-1';
const PLAYER_ID = 'player-persist-1';
const MATCH_ID = 'match-persist-1';
const SPONSOR_ID = 'sponsor-persist-1';

/** Restart the backend's database layer the way a process restart would. */
async function restartBackend() {
  closeDatabase();
  await initDatabase();
}

describe('Data safety across backend restarts', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
    removeDbFiles(DB_FILE);
  });

  it('1. starts from an initialized database', async () => {
    const settings = await db.prepare('SELECT * FROM tournament_settings LIMIT 1').get() as any;
    expect(settings).toBeDefined();
    expect(settings.name).toBe('MULSU_ICC 2026 Champions Cup');
  });

  it('2. accepts representative tournament data', async () => {
    await db.prepare(`
      INSERT INTO teams (id, registration_ref, name, university, country,
        coach_name, manager_name, manager_email, manager_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
    `).run(TEAM_ID, TEAM_REF, 'Persistence FC', 'Marwadi University', 'LBR',
           'Coach P', 'Manager P', uniqueEmail('persist'), '0100000000');

    await db.prepare(`
      INSERT INTO players (id, player_id, team_id, full_name, dob, nationality,
        student_id, university, position, jersey_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
    `).run(PLAYER_ID, 'MULSU-PLY-9001', TEAM_ID, 'Persistent Player', '2003-05-05',
           'Liberia', 'STU-9001', 'Marwadi University', 'Forward', 7);

    await db.prepare(`
      INSERT INTO matches (id, match_code, match_day_id, stage, team_a_id, team_b_id,
        date, time, venue, status, score_a, score_b)
      VALUES (?, ?, ?, 'GROUP', ?, ?, ?, ?, ?, 'FULL_TIME', 2, 1)
    `).run(MATCH_ID, 'MATCH-PERSIST-01', 'md-1', TEAM_ID, TEAM_ID,
           '2026-09-26', '18:00', 'Main Stadium');

    await db.prepare('INSERT INTO sponsors (id, name, logo_url, tier) VALUES (?, ?, ?, ?)')
      .run(SPONSOR_ID, 'Persistent Sponsor Ltd', 'https://example.test/sponsor.png', 'GOLD');

    await db.prepare('INSERT INTO standings (id, group_id, team_id, played, won, points) VALUES (?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), 'grp-a', TEAM_ID, 1, 1, 3);

    // Admin edits that a restart must not revert
    await db.prepare("UPDATE tournament_settings SET name = ?, start_date = ? WHERE id = ?")
      .run('ADMIN EDITED NAME', '2027-01-01', 'mulsu-icc-2026-config');
    await db.prepare("UPDATE match_days SET date = ? WHERE id = ?").run('2027-02-02', 'md-1');

    const teams = await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any;
    expect(teams.count).toBe(1);
  });

  it('3+4. survives a full stop and restart of the backend', async () => {
    await restartBackend();
    const health = await db.prepare('SELECT 1 as ok').get() as any;
    expect(health.ok).toBe(1);
  });

  it('5. still has every record after the restart', async () => {
    const team = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?').get(TEAM_REF) as any;
    expect(team).toBeDefined();
    expect(team.name).toBe('Persistence FC');
    expect(team.status).toBe('APPROVED');

    const player = await db.prepare('SELECT * FROM players WHERE id = ?').get(PLAYER_ID) as any;
    expect(player).toBeDefined();
    expect(player.player_id).toBe('MULSU-PLY-9001');

    const match = await db.prepare('SELECT * FROM matches WHERE id = ?').get(MATCH_ID) as any;
    expect(match).toBeDefined();
    expect(match.score_a).toBe(2);

    const standing = await db.prepare('SELECT * FROM standings WHERE team_id = ?').get(TEAM_ID) as any;
    expect(standing).toBeDefined();
    expect(standing.points).toBe(3);
  });

  it('6a. startup does NOT delete sponsors', async () => {
    // The old seed ran an unconditional `DELETE FROM sponsors` on every boot.
    const sponsor = await db.prepare('SELECT * FROM sponsors WHERE id = ?').get(SPONSOR_ID) as any;
    expect(sponsor).toBeDefined();
    expect(sponsor.name).toBe('Persistent Sponsor Ltd');
  });

  it('6b. startup does NOT reset tournament settings', async () => {
    const settings = await db.prepare('SELECT * FROM tournament_settings LIMIT 1') .get() as any;
    expect(settings.name).toBe('ADMIN EDITED NAME');
    expect(settings.start_date).toBe('2027-01-01');
  });

  it('6c. startup does NOT reset match-day dates', async () => {
    const day = await db.prepare('SELECT * FROM match_days WHERE id = ?').get('md-1') as any;
    expect(day.date).toBe('2027-02-02');
  });

  it('6d. startup does NOT duplicate reference data', async () => {
    const nations = await db.prepare('SELECT COUNT(*) as count FROM participating_nations').get() as any;
    expect(nations.count).toBe(10);
    const days = await db.prepare('SELECT COUNT(*) as count FROM match_days').get() as any;
    expect(days.count).toBe(6);
    const groups = await db.prepare('SELECT COUNT(*) as count FROM groups').get() as any;
    expect(groups.count).toBe(3);
  });

  it('survives repeated restarts without drift', async () => {
    for (let i = 0; i < 3; i++) await restartBackend();

    const counts = {
      teams: (await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any).count,
      players: (await db.prepare('SELECT COUNT(*) as count FROM players').get() as any).count,
      matches: (await db.prepare('SELECT COUNT(*) as count FROM matches').get() as any).count,
      sponsors: (await db.prepare('SELECT COUNT(*) as count FROM sponsors').get() as any).count,
      nations: (await db.prepare('SELECT COUNT(*) as count FROM participating_nations').get() as any).count
    };
    expect(counts).toEqual({ teams: 1, players: 1, matches: 1, sponsors: 1, nations: 10 });

    const settings = await db.prepare('SELECT * FROM tournament_settings LIMIT 1').get() as any;
    expect(settings.name).toBe('ADMIN EDITED NAME');
  });

  it('keeps the admin account available after restarts', async () => {
    const admin = await db.prepare('SELECT * FROM admins WHERE email = ?')
      .get('admin@miucc2026.org') as any;
    expect(admin).toBeDefined();
    expect(admin.password_hash).toBeTruthy();
  });
});
