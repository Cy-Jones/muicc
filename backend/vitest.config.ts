import { defineConfig } from 'vitest/config';

// Pinning root here stops Vitest walking up the repo looking for a config.
export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false, // tests share one database file
    hookTimeout: 30000,
    testTimeout: 30000
  }
});
