/**
 * Central configuration and production safety checks.
 *
 * The committed .env.example values are public. In development they are a
 * convenience; in production they would ship a publicly-known admin password
 * and JWT signing key. `assertProductionConfig()` refuses to start rather
 * than booting quietly with them.
 */

/** Values that appear in committed templates and must never reach production. */
const KNOWN_PUBLIC_DEFAULTS = [
  'miucc_2026_champions_cup_secret_jwt_key_987654321',
  'change_me_in_production',
  'AdminPassword2026!'
];

export const DEV_JWT_SECRET = 'miucc_2026_champions_cup_secret_jwt_key_987654321';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEV_JWT_SECRET;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function assertProductionConfig() {
  if (!isProduction()) return;

  const problems: string[] = [];
  const required = ['TURSO_DATABASE_URL', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'FRONTEND_URL'];

  for (const key of required) {
    if (!process.env[key] || process.env[key]!.trim() === '') {
      problems.push(`${key} is required in production but is not set.`);
    }
  }

  for (const key of ['JWT_SECRET', 'ADMIN_PASSWORD']) {
    const value = process.env[key];
    if (value && KNOWN_PUBLIC_DEFAULTS.includes(value.trim())) {
      problems.push(`${key} is set to a value published in .env.example. Generate a new one.`);
    }
  }

  const jwt = process.env.JWT_SECRET;
  if (jwt && jwt.trim().length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production.');
  }

  const url = process.env.TURSO_DATABASE_URL;
  if (url && url.startsWith('file:')) {
    problems.push(
      'TURSO_DATABASE_URL points at a local file in production. A container filesystem ' +
      'is ephemeral, so all tournament data would be lost on restart. Use a libsql:// URL.'
    );
  }
  if (url && url.startsWith('libsql://') && !process.env.TURSO_AUTH_TOKEN) {
    problems.push('TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is a remote libsql:// URL.');
  }

  if (problems.length > 0) {
    throw new Error(
      'Refusing to start in production with unsafe configuration:\n  - ' +
      problems.join('\n  - ')
    );
  }
}
