import dotenv from 'dotenv';
import app from './app.js';
import { initDatabase } from './db.js';
import { assertProductionConfig } from './config.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  assertProductionConfig();
  
  // Bind Express first so Render detects the service port and does not enter a crash loop.
  const server = app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log('=================================================');
    console.log('🏆 MULSU_ICC 2026 Champions Cup Backend API');
    console.log(`   env:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`   port:     ${PORT}`);
    console.log(`   frontend: ${process.env.FRONTEND_URL || '(unrestricted CORS — development)'}`);
    console.log('=================================================');

    try {
      await initDatabase();
      console.log('✅ Database initialization complete.');
    } catch (err: any) {
      console.error('⚠️ Database initialization failed or database is currently blocked:', err?.message ?? err);
      console.error('The server remains online to respond to /api/health with degraded status.');
    }
  });

  server.on('error', (err: any) => {
    console.error('Fatal server network error:', err?.message ?? err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Fatal error in server configuration:', err?.message ?? err);
  process.exit(1);
});
