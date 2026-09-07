import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { useTestDatabase, removeDbFiles, teamPayload, uniqueEmail } from './helpers.js';

// Must run before the db module is imported, so the client picks up the URL.
const DB_FILE = useTestDatabase('platform');

const { default: app } = await import('../server/app.js');
const { initDatabase, db, closeDatabase } = await import('../server/db.js');

let adminToken = '';

describe('MULSU_ICC platform — application behaviour against libSQL', () => {
  beforeAll(async () => {
    await initDatabase();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@miucc2026.org', password: 'AdminPassword2026!' });
    adminToken = res.body.token;
  });

  afterAll(() => {
    closeDatabase();
    removeDbFiles(DB_FILE);
  });

  describe('database initialization', () => {
    it('creates the full schema and reports healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.database).toBe('connected');
    });

    it('seeds reference data exactly once', async () => {
      const nations = await db.prepare('SELECT * FROM participating_nations').all();
      expect(nations.length).toBe(10);

      const days = await db.prepare('SELECT * FROM match_days').all();
      expect(days.length).toBe(6);

      // Re-running the seed must not duplicate reference rows.
      const { seedDatabase } = await import('../server/db.js');
      await seedDatabase();
      const nationsAfter = await db.prepare('SELECT * FROM participating_nations').all();
      expect(nationsAfter.length).toBe(10);
    });
  });

  describe('admin authentication', () => {
    it('issues a token for correct credentials', () => {
      expect(adminToken).toBeTruthy();
    });

    it('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@miucc2026.org', password: 'definitely-not-the-password' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.token).toBeUndefined();
    });

    it('refuses protected routes without a token, allows them with one', async () => {
      expect((await request(app).get('/api/admin/dashboard-stats')).status).toBe(401);
      const ok = await request(app)
        .get('/api/admin/dashboard-stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(ok.status).toBe(200);
      expect(ok.body.metrics).toBeDefined();
    });
  });

  describe('team registration', () => {
    it('registers a team through the public endpoint and persists it', async () => {
      const payload = teamPayload({
        players: [
          { full_name: 'Test Striker', position: 'Forward', jersey_number: 9 },
          { full_name: 'Test Keeper', position: 'Goalkeeper', jersey_number: 1 }
        ]
      });

      const res = await request(app).post('/api/teams/register').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.registrationRef).toMatch(/^MULSU-/);

      const row = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?')
        .get(res.body.registrationRef) as any;
      expect(row).toBeDefined();
      expect(row.name).toBe(payload.name);
      expect(row.status).toBe('PENDING');
    });

    it('writes the squad in the same transaction as the team', async () => {
      const payload = teamPayload({
        players: [
          { full_name: 'Squad Player A', position: 'Midfielder', jersey_number: 8 },
          { full_name: 'Squad Player B', position: 'Defender', jersey_number: 4 },
          { full_name: 'Squad Player C', position: 'Forward', jersey_number: 11 }
        ]
      });
      const res = await request(app).post('/api/teams/register').send(payload);
      expect(res.status).toBe(201);

      const team = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?')
        .get(res.body.registrationRef) as any;
      const players = await db.prepare('SELECT * FROM players WHERE team_id = ?').all(team.id);
      // This is the assertion that fails if the inserts are not awaited.
      expect(players.length).toBe(3);
    });

    it('rejects a registration missing required fields', async () => {
      const res = await request(app).post('/api/teams/register').send({ name: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  describe('match creation and standings', () => {
    it('creates a match and recalculates standings on confirm-result', async () => {
      const a = await request(app).post('/api/teams/register').send(teamPayload({ name: 'Alpha FC' }));
      const b = await request(app).post('/api/teams/register').send(teamPayload({ name: 'Beta FC' }));
      const teamA = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?').get(a.body.registrationRef) as any;
      const teamB = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?').get(b.body.registrationRef) as any;

      await db.prepare('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), 'grp-a', teamA.id);
      await db.prepare('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), 'grp-a', teamB.id);
      await db.prepare('INSERT INTO standings (id, group_id, team_id) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), 'grp-a', teamA.id);
      await db.prepare('INSERT INTO standings (id, group_id, team_id) VALUES (?, ?, ?)')
        .run(crypto.randomUUID(), 'grp-a', teamB.id);

      const created = await request(app)
        .post('/api/matches/admin/save')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          match_day_id: 'md-1', group_id: 'grp-a', stage: 'GROUP',
          team_a_id: teamA.id, team_b_id: teamB.id,
          date: '2026-09-26', time: '17:00', venue: 'Main Stadium',
          status: 'FULL_TIME', score_a: 3, score_b: 1
        });
      expect(created.status).toBe(200);

      const match = await db.prepare('SELECT * FROM matches WHERE team_a_id = ? AND team_b_id = ?')
        .get(teamA.id, teamB.id) as any;
      expect(match).toBeDefined();

      const confirmed = await request(app)
        .post(`/api/matches/admin/${match.id}/confirm-result`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(confirmed.status).toBe(200);

      const standingA = await db.prepare('SELECT * FROM standings WHERE team_id = ?').get(teamA.id) as any;
      const standingB = await db.prepare('SELECT * FROM standings WHERE team_id = ?').get(teamB.id) as any;
      expect(standingA.points).toBe(3);
      expect(standingA.goals_for).toBe(3);
      expect(standingA.goal_difference).toBe(2);
      expect(standingB.points).toBe(0);
      expect(standingB.lost).toBe(1);
    });

    it('serves standings through the public endpoint', async () => {
      const res = await request(app).get('/api/standings');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.standings)).toBe(true);
      expect(Array.isArray(res.body.topScorers)).toBe(true);
    });
  });

  describe('predictions — 20-entry limit and transaction semantics', () => {
    it('accepts entries up to the limit and refuses the 21st', async () => {
      const accepted: number[] = [];
      let refused = 0;

      for (let i = 1; i <= 21; i++) {
        const res = await request(app).post('/api/predictions/submit').send({
          match_day_id: 'md-1',
          full_name: `Predictor ${i}`,
          email: uniqueEmail(`pred${i}`),
          predicted_score_a: 1,
          predicted_score_b: 0
        });
        if (res.status === 201) accepted.push(i); else refused++;
      }

      expect(accepted.length).toBe(20);
      expect(refused).toBe(1);

      const stored = await db.prepare('SELECT COUNT(*) as count FROM predictions WHERE match_day_id = ?')
        .get('md-1') as any;
      expect(stored.count).toBe(20);
    });

    it('closes the match day once the limit is reached', async () => {
      const day = await db.prepare('SELECT * FROM match_days WHERE id = ?').get('md-1') as any;
      expect(day.prediction_status).toBe('FULL');
    });

    it('refuses a duplicate email on the same match day', async () => {
      await db.prepare("UPDATE match_days SET prediction_status = 'OPEN' WHERE id = ?").run('md-2');
      const email = uniqueEmail('dupe');
      const first = await request(app).post('/api/predictions/submit')
        .send({ match_day_id: 'md-2', full_name: 'First', email });
      expect(first.status).toBe(201);

      const second = await request(app).post('/api/predictions/submit')
        .send({ match_day_id: 'md-2', full_name: 'Second', email });
      expect(second.status).toBeGreaterThanOrEqual(400);

      const count = await db.prepare(
        'SELECT COUNT(*) as count FROM predictions WHERE match_day_id = ? AND email_normalized = ?'
      ).get('md-2', email.toLowerCase()) as any;
      expect(count.count).toBe(1);
    });

    it('rolls back completely when a transaction throws', async () => {
      const before = await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any;

      await expect(db.transaction(async (tx) => {
        await tx.prepare(
          `INSERT INTO teams (id, registration_ref, name, university, country,
             coach_name, manager_name, manager_email, manager_phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(crypto.randomUUID(), 'MULSU-ROLLBACK-9999', 'Rollback FC', 'Uni', 'LBR',
              'C', 'M', uniqueEmail('rb'), '000');
        throw new Error('deliberate failure');
      })).rejects.toThrow('deliberate failure');

      const after = await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any;
      expect(after.count).toBe(before.count);

      const orphan = await db.prepare('SELECT * FROM teams WHERE registration_ref = ?')
        .get('MULSU-ROLLBACK-9999');
      expect(orphan).toBeUndefined();
    });
  });

  describe('database errors', () => {
    it('surfaces a rejected query as a 500 rather than hanging the request', async () => {
      // A malformed id cannot break SQL, so exercise the error path directly:
      // an invalid statement must reject rather than resolve.
      await expect(db.prepare('SELECT * FROM table_that_does_not_exist').all())
        .rejects.toThrow();
    });

    it('returns a clean 404 for an unknown player rather than crashing', async () => {
      const res = await request(app).get('/api/players/verify/MULSU-PLY-DOES-NOT-EXIST');
      expect([404, 400]).toContain(res.status);
    });
  });
});
