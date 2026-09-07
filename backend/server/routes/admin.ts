import {Response} from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = asyncRouter();

router.get('/dashboard-stats', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const totalTeams = (await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any)?.count || 0;
  const approvedTeams = (await db.prepare("SELECT COUNT(*) as count FROM teams WHERE status = 'APPROVED'").get() as any)?.count || 0;
  const pendingTeams = (await db.prepare("SELECT COUNT(*) as count FROM teams WHERE status = 'PENDING'").get() as any)?.count || 0;

  const totalPlayers = (await db.prepare('SELECT COUNT(*) as count FROM players').get() as any)?.count || 0;
  const approvedPlayers = (await db.prepare("SELECT COUNT(*) as count FROM players WHERE status = 'APPROVED'").get() as any)?.count || 0;
  const pendingPlayers = (await db.prepare("SELECT COUNT(*) as count FROM players WHERE status = 'SUBMITTED' OR status = 'UNDER_REVIEW'").get() as any)?.count || 0;

  const totalMatches = (await db.prepare('SELECT COUNT(*) as count FROM matches').get() as any)?.count || 0;
  const completedMatches = (await db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'FULL_TIME'").get() as any)?.count || 0;
  const liveMatches = (await db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'LIVE' OR status = 'HALF_TIME'").get() as any)?.count || 0;
  const upcomingMatches = (await db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'SCHEDULED'").get() as any)?.count || 0;

  const totalGoals = (await db.prepare("SELECT SUM(score_a + score_b) as total FROM matches WHERE status = 'FULL_TIME'").get() as any)?.total || 0;
  const totalPredictions = (await db.prepare('SELECT COUNT(*) as count FROM predictions').get() as any)?.count || 0;

  const recentPendingPlayers = await db.prepare(`
    SELECT p.id, p.full_name, p.nationality, p.position, p.status, p.created_at, t.name as team_name
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.status IN ('SUBMITTED', 'UNDER_REVIEW')
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all();

  const recentPendingTeams = await db.prepare(`
    SELECT id, registration_ref, name, university, country, manager_name, manager_email, status, created_at
    FROM teams
    WHERE status = 'PENDING'
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  return res.json({
    metrics: {
      teams: { total: totalTeams, approved: approvedTeams, pending: pendingTeams },
      players: { total: totalPlayers, approved: approvedPlayers, pending: pendingPlayers },
      matches: { total: totalMatches, completed: completedMatches, live: liveMatches, upcoming: upcomingMatches },
      goals: totalGoals,
      predictions: totalPredictions
    },
    recentPendingPlayers,
    recentPendingTeams
  });
});

router.get('/audit-logs', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const logs = await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  return res.json(logs);
});

router.get('/export-pdf/:type', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const type = req.params.type;
  // All data is fetched before streaming begins. Once doc.pipe(res) sends
  // headers, a database error can no longer produce a clean error response.
  let rows: any[] = [];
  const playersByTeam = new Map<string, any[]>();

  if (type === 'teams') {
    rows = await db.prepare(`
      SELECT t.*, g.name as group_name
      FROM teams t
      LEFT JOIN group_teams gt ON gt.team_id = t.id
      LEFT JOIN groups g ON g.id = gt.group_id
      ORDER BY t.name ASC
    `).all() as any[];
    for (const t of rows) {
      playersByTeam.set(t.id, await db.prepare(
        'SELECT * FROM players WHERE team_id = ? ORDER BY jersey_number ASC'
      ).all(t.id) as any[]);
    }
  } else if (type === 'players') {
    rows = await db.prepare(`
      SELECT p.*, t.name as team_name, t.country as team_country
      FROM players p
      JOIN teams t ON p.team_id = t.id
      ORDER BY p.full_name ASC
    `).all() as any[];
  } else if (type === 'predictions') {
    rows = await db.prepare(`
      SELECT p.*, md.name as match_day_name
      FROM predictions p
      JOIN match_days md ON p.match_day_id = md.id
      ORDER BY p.created_at DESC
    `).all() as any[];
  } else if (type === 'matches') {
    rows = await db.prepare(`
      SELECT m.*, md.name as match_day_name, ta.name as team_a_name, tb.name as team_b_name
      FROM matches m
      JOIN match_days md ON m.match_day_id = md.id
      JOIN teams ta ON m.team_a_id = ta.id
      JOIN teams tb ON m.team_b_id = tb.id
      ORDER BY m.date ASC, m.time ASC
    `).all() as any[];
  }

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="miucc_${type}_official_report.pdf"`);

  doc.pipe(res);

  // Document Header
  doc.rect(0, 0, doc.page.width, 70).fill('#0F1115');
  doc.fillColor('#FACC15').fontSize(16).font('Helvetica-Bold').text('MIUCC 2026 CHAMPIONS CUP', 30, 15);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text(`OFFICIAL ADMINISTRATIVE REPORT — ${type.toUpperCase()}`, 30, 36);
  doc.fillColor('#9CA3AF').fontSize(8).text(`Generated on ${new Date().toLocaleString()} | Marwadi University Campus`, 30, 50);

  let y = 90;

  if (type === 'teams') {
    const teams = rows;

    if (teams.length === 0) {
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Oblique').text('No registered teams in system.', 30, y);
    } else {
      for (const [idx, t] of teams.entries()) {
        const players = playersByTeam.get(t.id) || [];

        if (y > 700) { doc.addPage(); y = 40; }

        doc.rect(30, y, doc.page.width - 60, 30).fill('#1A1D24');
        doc.fillColor('#FACC15').fontSize(11).font('Helvetica-Bold').text(`${idx + 1}. ${t.name} (${t.country})`, 40, y + 8);
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica').text(`Ref: ${t.registration_ref} | Status: ${t.status} | Players: ${players.length}`, 280, y + 10, { align: 'right', width: 270 });

        y += 35;

        if (players.length > 0) {
          doc.rect(30, y, doc.page.width - 60, 16).fill('#2D3748');
          doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
          doc.text('#', 40, y + 3, { width: 30 });
          doc.text('PLAYER ID', 70, y + 3, { width: 100 });
          doc.text('ATHLETE NAME', 170, y + 3, { width: 160 });
          doc.text('POSITION', 330, y + 3, { width: 80 });
          doc.text('GR#', 410, y + 3, { width: 70 });
          doc.text('STATUS', 480, y + 3, { width: 70 });

          y += 18;

          players.forEach((p, pIdx) => {
            if (y > 750) { doc.addPage(); y = 40; }
            doc.rect(30, y - 2, doc.page.width - 60, 15).fill(pIdx % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
            doc.fillColor('#111827').fontSize(8).font('Helvetica');
            doc.text(`#${p.jersey_number}`, 40, y, { width: 30 });
            doc.fillColor('#D97706').font('Helvetica-Bold').text(p.player_id || 'PENDING', 70, y, { width: 100 });
            doc.fillColor('#111827').font('Helvetica-Bold').text(p.full_name, 170, y, { width: 160 });
            doc.font('Helvetica').text(p.position, 330, y, { width: 80 });
            doc.text(p.student_id || 'N/A', 410, y, { width: 70 });
            doc.fillColor(p.status === 'APPROVED' ? '#059669' : '#D97706').font('Helvetica-Bold').text(p.status, 480, y, { width: 70 });
            y += 16;
          });
        }
        y += 15;
      }
    }
  } else if (type === 'players') {
    const players = rows;

    if (players.length === 0) {
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Oblique').text('No players registered in system.', 30, y);
    } else {
      doc.rect(30, y, doc.page.width - 60, 20).fill('#1A1D24');
      doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
      doc.text('#', 35, y + 5, { width: 25 });
      doc.text('PLAYER ID', 60, y + 5, { width: 95 });
      doc.text('FULL NAME', 155, y + 5, { width: 135 });
      doc.text('TEAM', 290, y + 5, { width: 110 });
      doc.text('POSITION', 400, y + 5, { width: 75 });
      doc.text('STATUS', 475, y + 5, { width: 75 });

      y += 24;

      players.forEach((p, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(30, y - 2, doc.page.width - 60, 16).fill(idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        doc.fillColor('#111827').fontSize(8).font('Helvetica');
        doc.text(`#${p.jersey_number}`, 35, y, { width: 25 });
        doc.fillColor('#D97706').font('Helvetica-Bold').text(p.player_id || 'PENDING', 60, y, { width: 95 });
        doc.fillColor('#111827').font('Helvetica-Bold').text(p.full_name, 155, y, { width: 135 });
        doc.font('Helvetica').text(p.team_name, 290, y, { width: 110 });
        doc.text(p.position, 400, y, { width: 75 });
        doc.fillColor(p.status === 'APPROVED' ? '#059669' : '#D97706').font('Helvetica-Bold').text(p.status, 475, y, { width: 75 });
        y += 18;
      });
    }
  } else if (type === 'predictions') {
    const predictions = rows;

    if (predictions.length === 0) {
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Oblique').text('No public predictions recorded yet.', 30, y);
    } else {
      doc.rect(30, y, doc.page.width - 60, 20).fill('#1A1D24');
      doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
      doc.text('REF', 35, y + 5, { width: 110 });
      doc.text('MATCH DAY', 145, y + 5, { width: 130 });
      doc.text('NAME', 275, y + 5, { width: 130 });
      doc.text('EMAIL', 405, y + 5, { width: 145 });

      y += 24;

      predictions.forEach((p, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(30, y - 2, doc.page.width - 60, 16).fill(idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        doc.fillColor('#D97706').fontSize(8).font('Helvetica-Bold').text(p.prediction_ref, 35, y, { width: 110 });
        doc.fillColor('#111827').font('Helvetica').text(p.match_day_name, 145, y, { width: 130 });
        doc.font('Helvetica-Bold').text(p.full_name, 275, y, { width: 130 });
        doc.font('Helvetica').text(p.email, 405, y, { width: 145 });
        y += 18;
      });
    }
  } else if (type === 'matches') {
    const matches = rows;

    if (matches.length === 0) {
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Oblique').text('No scheduled matches in system.', 30, y);
    } else {
      doc.rect(30, y, doc.page.width - 60, 20).fill('#1A1D24');
      doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
      doc.text('CODE', 35, y + 5, { width: 95 });
      doc.text('DATE & TIME', 130, y + 5, { width: 100 });
      doc.text('MATCH FIXTURE', 230, y + 5, { width: 180 });
      doc.text('SCORE / STATUS', 410, y + 5, { width: 140 });

      y += 24;

      matches.forEach((m, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(30, y - 2, doc.page.width - 60, 18).fill(idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF');
        doc.fillColor('#D97706').fontSize(8).font('Helvetica-Bold').text(m.match_code, 35, y, { width: 95 });
        doc.fillColor('#111827').font('Helvetica').text(`${m.date} ${m.time}`, 130, y, { width: 100 });
        doc.font('Helvetica-Bold').text(`${m.team_a_name} vs ${m.team_b_name}`, 230, y, { width: 180 });
        doc.font('Helvetica-Bold').text(m.status === 'FULL_TIME' ? `${m.score_a} - ${m.score_b} (FT)` : m.status, 410, y, { width: 140 });
        y += 20;
      });
    }
  }

  doc.end();
});

// Get all managers
router.get('/managers', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const managers = await db.prepare(`
    SELECT m.id, m.email, m.plain_password, m.created_at, n.name as nation_name, n.id as nation_id
    FROM team_managers m
    JOIN participating_nations n ON m.nation_id = n.id
  `).all();
  return res.json(managers);
});

// Create or reset manager credentials
router.post('/managers', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { nation_id, email, password } = req.body;
  if (!nation_id || !email || !password) {
    return res.status(400).json({ error: 'nation_id, email, and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const hash = bcrypt.hashSync(password, 10);
  const id = crypto.randomUUID();

  // Check if manager exists for this nation
  const existing = await db.prepare('SELECT * FROM team_managers WHERE nation_id = ?').get(nation_id) as any;

  if (existing) {
    await db.prepare('UPDATE team_managers SET email = ?, password_hash = ?, plain_password = ? WHERE id = ?').run(normalizedEmail, hash, password, existing.id);
  } else {
    // Also check if email is taken by another manager
    const emailCheck = await db.prepare('SELECT * FROM team_managers WHERE email = ?').get(normalizedEmail);
    if (emailCheck) {
      return res.status(400).json({ error: 'Email already in use by another manager' });
    }
    await db.prepare('INSERT INTO team_managers (id, nation_id, email, password_hash, plain_password) VALUES (?, ?, ?, ?, ?)').run(id, nation_id, normalizedEmail, hash, password);
  }

  return res.json({ success: true, message: 'Manager credentials updated' });
});

export default router;
