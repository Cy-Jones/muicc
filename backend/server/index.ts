import dotenv from 'dotenv';
import app from './app.js';
import { initDatabase } from './db.js';
import { assertProductionConfig } from './config.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  assertProductionConfig();
  await initDatabase();
  // 0.0.0.0 so the service is reachable inside Render's container network.
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('=================================================');
    console.log('🏆 MULSU_ICC 2026 Champions Cup Backend API');
    console.log(`   env:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`   port:     ${PORT}`);
    console.log(`   frontend: ${process.env.FRONTEND_URL || '(unrestricted CORS — development)'}`);
    console.log('=================================================');
  });
}

startServer().catch(err => {
  console.error('Fatal error starting MULSU_ICC backend server:', err?.message ?? err);
  process.exit(1);
});
