import fs from 'fs';
import path from 'path';

/**
 * Every test file gets its own database file so suites cannot interfere.
 * Must run before any import of ../server/db.js, because the client reads
 * TURSO_DATABASE_URL when it is first constructed.
 */
export function useTestDatabase(name: string) {
  const file = path.resolve(process.cwd(), `test-${name}.db`);
  removeDbFiles(file);
  process.env.TURSO_DATABASE_URL = `file:${file}`;
  delete process.env.TURSO_AUTH_TOKEN;
  process.env.ADMIN_EMAIL = 'admin@miucc2026.org';
  process.env.ADMIN_PASSWORD = 'AdminPassword2026!';
  process.env.JWT_SECRET = 'test_secret_key';
  return file;
}

export function removeDbFiles(file: string) {
  for (const suffix of ['', '-shm', '-wal']) {
    const p = file + suffix;
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch { /* held briefly on Windows */ }
    }
  }
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}@test.example`;
}

/** Minimal valid team registration payload. */
export function teamPayload(overrides: Record<string, any> = {}) {
  return {
    name: `Test Team ${Math.random().toString(36).slice(2, 7)}`,
    university: 'Marwadi University',
    country: 'LBR',
    coach_name: 'Test Coach',
    manager_name: 'Test Manager',
    manager_email: uniqueEmail('manager'),
    manager_phone: '0123456789',
    ...overrides
  };
}
