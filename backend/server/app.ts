import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { getClient } from './db.js';

import authRoutes from './routes/auth.js';
import tournamentRoutes from './routes/tournament.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';
import matchRoutes from './routes/matches.js';
import standingsRoutes from './routes/standings.js';
import drawRoutes from './routes/draw.js';
import predictionRoutes from './routes/predictions.js';
import newsRoutes from './routes/news.js';
import galleryRoutes from './routes/gallery.js';
import sponsorRoutes from './routes/sponsors.js';
import adminRoutes from './routes/admin.js';
import managerAuthRoutes from './routes/managerAuth.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      fontSrc: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'none'"],
      styleSrc: ["'none'"],
    }
  }
}));
// Allowed browser origins come from FRONTEND_URL (comma-separated for
// multiple, e.g. a custom domain alongside the Render URL). With none set,
// fall back to permissive CORS so local development is unaffected.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Same-origin and non-browser callers (curl, health checks) send no Origin.
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads and public logo assets
const rootPublic = path.resolve(process.cwd(), '..', 'frontend', 'public');
const localPublic = path.resolve(process.cwd(), 'public');

app.use('/uploads', express.static(path.join(rootPublic, 'uploads')));
app.use('/uploads', express.static(path.join(localPublic, 'uploads')));

app.use('/logos', express.static(path.join(rootPublic, 'logos')));
app.use('/logos', express.static(path.join(localPublic, 'logos')));

// Prevent caching for all API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/draw', drawRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerAuthRoutes);
app.use('/api/upload', uploadRoutes);

// Healthcheck & Root Route
app.get('/api/health', async (req, res) => {
  try {
    await getClient().execute('SELECT 1');
    res.json({ status: 'ok', database: 'connected', tournament: 'MIUCC 2026 Champions Cup Backend Server' });
  } catch (err: any) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', error: err?.message ?? String(err) });
  }
});

app.get('/', (req, res) => {
  // The API and the site are separate Render services, so this is an API
  // banner rather than a redirect to a hardcoded address.
  res.json({
    service: 'MULSU_ICC 2026 Champions Cup API',
    health: '/api/health',
    frontend: allowedOrigins[0] || null
  });
});

// Central error handler. asyncRouter forwards rejected promises here, so a
// database failure returns a 500 instead of leaving the request hanging.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err?.message ?? err);
  if (res.headersSent) return next(err);
  
  const status = err?.status || 500;
  let message = err?.message || 'Internal server error.';
  
  // Hide potentially sensitive 500 error details in production
  if (status === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error.';
  }
  
  res.status(status).json({ error: message });
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

export default app;
