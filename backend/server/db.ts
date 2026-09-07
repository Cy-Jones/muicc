import { createClient, Client, Transaction, InValue } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database layer backed by libSQL (Turso).
 *
 * The same client and the same code path serve both environments; only the URL
 * differs. Local development points TURSO_DATABASE_URL at a file (file:./local.db)
 * and needs no auth token. Production points it at a Turso instance.
 */

let client: Client | null = null;

function resolveUrl(): string {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Use file:./local.db for local development, ' +
      'or a libsql:// URL for Turso. See backend/.env.example.'
    );
  }
  return url;
}

export function getClient(): Client {
  if (!client) {
    client = createClient({
      url: resolveUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
      // Return SQLite INTEGER as JS number rather than BigInt, so existing
      // arithmetic and comparisons throughout the routes keep working.
      intMode: 'number'
    });
  }
  return client;
}

export function closeDatabase() {
  if (client) {
    client.close();
    client = null;
  }
}

/** libSQL rejects `undefined`; the previous sql.js wrapper tolerated it. */
function normalizeArgs(args: any[]): InValue[] {
  return args.map(a => (a === undefined ? null : a)) as InValue[];
}

/** libSQL rows are array-like. Convert to the plain objects routes expect. */
function toObject(row: any, columns: string[]): any {
  const out: Record<string, any> = {};
  for (let i = 0; i < columns.length; i++) out[columns[i]] = row[i];
  return out;
}

function statement(runner: Client | Transaction, sql: string) {
  return {
    async get(...args: any[]) {
      const rs = await runner.execute({ sql, args: normalizeArgs(args) });
      if (rs.rows.length === 0) return undefined;
      return toObject(rs.rows[0], rs.columns);
    },
    async all(...args: any[]) {
      const rs = await runner.execute({ sql, args: normalizeArgs(args) });
      return rs.rows.map(r => toObject(r, rs.columns));
    },
    async run(...args: any[]) {
      const rs = await runner.execute({ sql, args: normalizeArgs(args) });
      return { changes: rs.rowsAffected };
    }
  };
}

export type DbRunner = {
  prepare: (sql: string) => ReturnType<typeof statement>;
  exec: (sql: string) => Promise<void>;
};

export const db = {
  prepare: (sql: string) => statement(getClient(), sql),

  async exec(sql: string): Promise<void> {
    await getClient().executeMultiple(sql);
  },

  /**
   * Interactive write transaction. Statements MUST be issued through the `tx`
   * argument — anything sent to the global `db` inside the callback runs
   * outside the transaction and silently loses atomicity.
   *
   * Throwing inside the callback rolls back, matching the previous behaviour
   * that the prediction limit and draw generation both rely on.
   */
  async transaction<T>(fn: (tx: DbRunner) => Promise<T>): Promise<T> {
    const tx = await getClient().transaction('write');
    try {
      const runner: DbRunner = {
        prepare: (sql: string) => statement(tx, sql),
        exec: async (sql: string) => { await tx.execute(sql); }
      };
      const result = await fn(runner);
      await tx.commit();
      return result;
    } catch (err) {
      try { await tx.rollback(); } catch { /* rollback on a closed tx is not fatal */ }
      throw err;
    }
  }
};

/** Fails fast with a clear message rather than surfacing as a confusing 500 later. */
async function assertConnectivity() {
  try {
    await getClient().execute('SELECT 1');
  } catch (err: any) {
    throw new Error(
      `Cannot reach the database at ${process.env.TURSO_DATABASE_URL}. ` +
      `Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Original error: ${err?.message ?? err}`
    );
  }
}

export async function initDatabase() {
  console.log('Initializing MULSU_ICC database (libSQL)...');
  await assertConnectivity();

  const schemaPath = path.resolve(process.cwd(), 'server', 'schema.sql');
  const altPath = path.resolve(process.cwd(), 'backend', 'server', 'schema.sql');
  const resolved = fs.existsSync(schemaPath) ? schemaPath : altPath;
  await db.exec(fs.readFileSync(resolved, 'utf8'));

  // Bookkeeping table for seed state. Kept out of schema.sql so that file stays
  // the untouched tournament schema.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Idempotent column additions for databases created before these were added.
  const additions = [
    "ALTER TABLE gallery ADD COLUMN media_type TEXT DEFAULT 'IMAGE';",
    // minute_text is written by matches.ts but was never in schema.sql nor in
    // the previous migration list, so match creation failed on any fresh
    // database. Added here to keep schema.sql unchanged.
    "ALTER TABLE matches ADD COLUMN minute_text TEXT DEFAULT '';",
    "ALTER TABLE matches ADD COLUMN live_period TEXT DEFAULT '1ST_HALF';",
    'ALTER TABLE matches ADD COLUMN live_start_timestamp INTEGER;',
    'ALTER TABLE matches ADD COLUMN live_pause_elapsed_seconds INTEGER DEFAULT 0;',
    'ALTER TABLE matches ADD COLUMN stoppage_time_1st INTEGER DEFAULT 0;',
    'ALTER TABLE matches ADD COLUMN stoppage_time_2nd INTEGER DEFAULT 0;'
  ];
  for (const sql of additions) {
    try { await getClient().execute(sql); } catch { /* column already exists */ }
  }

  await seedDatabase();
}

async function isSeeded(): Promise<boolean> {
  const row = await db.prepare("SELECT value FROM system_meta WHERE key = 'seeded_at'").get();
  return !!row;
}

async function markSeeded() {
  await db.prepare('INSERT OR REPLACE INTO system_meta (key, value) VALUES (?, ?)')
    .run('seeded_at', new Date().toISOString());
}

/**
 * Seeding is one-time and strictly additive.
 *
 * Reference data is written only on the very first initialization of an empty
 * database, recorded by the `seeded_at` marker. On every later boot this
 * function only guarantees an admin account exists. It never issues DELETE or
 * UPDATE against tournament data, so restarting the backend cannot reset
 * settings, match-day dates, sponsors, teams, players or matches.
 */
export async function seedDatabase() {
  await ensureAdminAccount();

  if (await isSeeded()) {
    console.log('Database already seeded; skipping reference data (existing data preserved).');
    await runDestructiveLegacyPurge();
    return;
  }

  console.log('First initialization detected. Seeding reference data...');
  await seedTournamentSettings();
  await seedNations();
  await seedMatchDays();
  await seedGroups();
  await seedIntroContent();
  await markSeeded();
  console.log('Reference data seeded.');
}

/**
 * The application has no in-app password change, so ADMIN_PASSWORD is the only
 * source of truth for the admin credential. The account is created if missing
 * and its hash is re-synced when the configured password no longer matches.
 *
 * Without the re-sync, an account seeded once with a weak or default password
 * could never be rotated: setting a new ADMIN_PASSWORD in the host environment
 * would be silently ignored because the row already exists.
 */
async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL || 'admin@miucc2026.org';
  const password = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
  const existing = await db.prepare('SELECT id, password_hash FROM admins WHERE email = ?').get(email) as any;

  if (!existing) {
    console.log(`Creating admin account (${email})...`);
    await db.prepare('INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)')
      .run(crypto.randomUUID(), email, bcrypt.hashSync(password, 10));
    return;
  }

  if (!bcrypt.compareSync(password, existing.password_hash)) {
    console.log(`Admin password for ${email} differs from ADMIN_PASSWORD; re-syncing from environment.`);
    await db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
      .run(bcrypt.hashSync(password, 10), existing.id);
  }
}

async function seedTournamentSettings() {
  const existing = await db.prepare('SELECT id FROM tournament_settings LIMIT 1').get();
  if (existing) return; // never overwrite an admin's edits
  await db.prepare(`
    INSERT INTO tournament_settings (
      id, name, full_name, host, start_date, end_date, status,
      tagline, secondary_tagline, max_predictions_per_match_day
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'mulsu-icc-2026-config',
    'MULSU_ICC 2026 Champions Cup',
    'MULSU Inter-Campus Champions Cup',
    'Marwadi University Campus',
    '2026-09-26',
    '2026-10-10',
    'UPCOMING',
    'BEYOND BORDERS, UNITED BY FOOTBALL.',
    'ONE CAMPUS. MANY NATIONS. ONE CHAMPION.',
    20
  );
}

async function seedNations() {
  const nations = [
    { name: 'Liberia', code: 'LBR', flag: '🇱🇷', order: 1 },
    { name: 'Eswatini', code: 'SWZ', flag: '🇸🇿', order: 2 },
    { name: 'Tanzania', code: 'TZA', flag: '🇹🇿', order: 3 },
    { name: 'South Sudan', code: 'SSD', flag: '🇸🇸', order: 4 },
    { name: 'Zimbabwe', code: 'ZWE', flag: '🇿🇼', order: 5 },
    { name: 'India', code: 'IND', flag: '🇮🇳', order: 6 },
    { name: 'Mozambique', code: 'MOZ', flag: '🇲🇿', order: 7 },
    { name: 'Nigeria', code: 'NGA', flag: '🇳🇬', order: 8 },
    { name: 'Uganda', code: 'UGA', flag: '🇺🇬', order: 9 },
    { name: 'Zambia', code: 'ZMB', flag: '🇿🇲', order: 10 }
  ];
  // Additive: insert only nations that are missing. Never clears the table.
  for (const nation of nations) {
    const existing = await db.prepare('SELECT id FROM participating_nations WHERE code = ?').get(nation.code);
    if (!existing) {
      await db.prepare(
        'INSERT INTO participating_nations (id, name, code, flag_emoji, display_order) VALUES (?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), nation.name, nation.code, nation.flag, nation.order);
    }
  }
}

async function seedMatchDays() {
  const days = [
    ['md-1', 1, 'MATCH DAY 1', '2026-09-26', 'OPEN'],
    ['md-2', 2, 'MATCH DAY 2', '2026-09-27', 'NOT_OPEN'],
    ['md-3', 3, 'MATCH DAY 3', '2026-09-28', 'NOT_OPEN'],
    ['md-4', 4, 'MATCH DAY 4 (QUARTER-FINALS)', '2026-09-30', 'NOT_OPEN'],
    ['md-5', 5, 'MATCH DAY 5 (SEMI-FINALS)', '2026-10-01', 'NOT_OPEN'],
    ['md-6', 6, 'MATCH DAY 6 (FINALS)', '2026-10-10', 'NOT_OPEN']
  ] as const;
  // Insert-if-absent only. Dates an admin changes later are never reset.
  for (const [id, number, name, date, status] of days) {
    const existing = await db.prepare('SELECT id FROM match_days WHERE id = ?').get(id);
    if (!existing) {
      await db.prepare(
        'INSERT INTO match_days (id, number, name, date, prediction_status) VALUES (?, ?, ?, ?, ?)'
      ).run(id, number, name, date, status);
    }
  }
}

async function seedGroups() {
  for (const [id, name] of [['grp-a', 'Group A'], ['grp-b', 'Group B'], ['grp-c', 'Group C']]) {
    const existing = await db.prepare('SELECT id FROM groups WHERE id = ?').get(id);
    if (!existing) {
      await db.prepare('INSERT INTO groups (id, name) VALUES (?, ?)').run(id, name);
    }
  }
}

async function seedIntroContent() {
  await db.prepare(`
    INSERT INTO news (id, title, slug, category, content, image_url, publish_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'news-1',
    'MULSU_ICC 2026 Champions Cup Officially Unveiled',
    'mulsu-icc-2026-champions-cup-officially-unveiled',
    'ANNOUNCEMENT',
    'Marwadi University Campus is proud to host 10 participating nations for the historic 2026 Champions Cup tournament under the slogan: Beyond Borders, United by Football.',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop',
    '2026-07-01'
  );
}

/**
 * Legacy sample-data purge from the pre-persistence era. Deletes hardcoded
 * demo IDs that never occur in real tournament data, but since it is the only
 * destructive statement left it stays behind an explicit opt-in that is absent
 * in production.
 */
async function runDestructiveLegacyPurge() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') return;
  console.warn('ALLOW_DESTRUCTIVE_SEED=true — purging legacy sample records.');
  const statements = [
    "DELETE FROM match_events WHERE match_id IN ('match-1', 'match-2');",
    "DELETE FROM matches WHERE id IN ('match-1', 'match-2');",
    "DELETE FROM player_cards WHERE player_id IN ('MIUCC-PLY-0001', 'MIUCC-PLY-0002', 'MIUCC-PLY-0003');",
    "DELETE FROM players WHERE id IN ('ply-1', 'ply-2', 'ply-3');",
    "DELETE FROM standings WHERE team_id IN ('team-lbr', 'team-nga', 'team-ssd', 'team-zwe');",
    "DELETE FROM group_teams WHERE team_id IN ('team-lbr', 'team-nga', 'team-ssd', 'team-zwe');",
    "DELETE FROM teams WHERE id IN ('team-lbr', 'team-nga', 'team-ssd', 'team-zwe');"
  ];
  for (const sql of statements) await getClient().execute(sql);
}
