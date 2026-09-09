import {Response} from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

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

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Register Fonts
  const robotoRegular = path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
  const robotoBold = path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf');
  
  // Register if files exist to prevent crashes
  if (fs.existsSync(robotoRegular) && fs.existsSync(robotoBold)) {
    doc.registerFont('Roboto', robotoRegular);
    doc.registerFont('Roboto-Bold', robotoBold);
  } else {
    // Fallback if fonts somehow missing
    doc.registerFont('Roboto', 'Helvetica');
    doc.registerFont('Roboto-Bold', 'Helvetica-Bold');
  }

  const logoPath = path.join(process.cwd(), '../frontend/public/logo.png');

  const addWatermark = () => {
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.1);
      const logoSize = 350;
      doc.image(logoPath, (doc.page.width - logoSize) / 2, (doc.page.height - logoSize) / 2, { width: logoSize });
      doc.restore();
    }
  };

  doc.on('pageAdded', addWatermark);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="miucc_${type}_official_report.pdf"`);

  doc.pipe(res);
  
  // Draw watermark on first page
  addWatermark();

  // Document Header - Official Memorandum Style
  doc.fillColor('#000000').fontSize(16).font('Roboto-Bold').text('OFFICIAL MEMORANDUM', 40, 50);
  doc.fontSize(11).font('Roboto-Bold').text(`Subject: MULSU ICC '26 Operations Portal - ${type.toUpperCase()} EXPORT`, 40, 80);
  doc.fontSize(10).font('Roboto-Bold').text('Date: ', 40, 100).font('Roboto').text(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 75, 100);
  
  doc.moveTo(40, 120).lineTo(doc.page.width - 40, 120).lineWidth(0.5).strokeColor('#E5E7EB').stroke();

  let y = 140;

  if (type === 'teams') {
    const teams = rows;

    if (teams.length === 0) {
      doc.fillColor('#000000').fontSize(10).font('Roboto').text('No registered teams in system.', 40, y);
    } else {
      for (const [idx, t] of teams.entries()) {
        const players = playersByTeam.get(t.id) || [];

        if (y > 700) { doc.addPage(); y = 40; }

        // Team Header
        doc.rect(40, y, doc.page.width - 80, 24).fill('#F3F4F6');
        doc.fillColor('#000000').fontSize(11).font('Roboto-Bold').text(`${idx + 1}. ${t.name} (${t.country})`, 48, y + 6);
        doc.fillColor('#4B5563').fontSize(8).font('Roboto').text(`Ref: ${t.registration_ref} | Status: ${t.status} | Players: ${players.length}`, 280, y + 8, { align: 'right', width: 270 });

        y += 28;

        if (players.length > 0) {
          doc.rect(40, y, doc.page.width - 80, 16).fill('#E5E7EB');
          doc.fillColor('#000000').fontSize(8).font('Roboto-Bold');
          doc.text('#', 48, y + 4, { width: 30 });
          doc.text('PLAYER ID', 78, y + 4, { width: 100 });
          doc.text('ATHLETE NAME', 178, y + 4, { width: 150 });
          doc.text('POSITION', 328, y + 4, { width: 80 });
          doc.text('GR#', 408, y + 4, { width: 70 });
          doc.text('STATUS', 478, y + 4, { width: 70 });

          y += 18;

          players.forEach((p, pIdx) => {
            if (y > 750) { doc.addPage(); y = 40; }
            doc.rect(40, y, doc.page.width - 80, 16).fill(pIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
            doc.fillColor('#000000').fontSize(8).font('Roboto');
            doc.text(`#${p.jersey_number}`, 48, y + 4, { width: 30 });
            doc.font('Roboto-Bold').text(p.player_id || 'PENDING', 78, y + 4, { width: 100 });
            doc.text(p.full_name, 178, y + 4, { width: 150 });
            doc.font('Roboto').text(p.position, 328, y + 4, { width: 80 });
            doc.text(p.student_id || 'N/A', 408, y + 4, { width: 70 });
            doc.fillColor(p.status === 'APPROVED' ? '#059669' : '#D97706').font('Roboto-Bold').text(p.status, 478, y + 4, { width: 70 });
            y += 16;
          });
          
          doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
        }
        y += 15;
      }
    }
  } else if (type === 'players') {
    const players = rows;

    if (players.length === 0) {
      doc.fillColor('#000000').fontSize(10).font('Roboto').text('No players registered in system.', 40, y);
    } else {
      doc.rect(40, y, doc.page.width - 80, 20).fill('#E5E7EB');
      doc.fillColor('#000000').fontSize(8).font('Roboto-Bold');
      doc.text('#', 48, y + 6, { width: 25 });
      doc.text('PLAYER ID', 73, y + 6, { width: 90 });
      doc.text('FULL NAME', 163, y + 6, { width: 130 });
      doc.text('TEAM', 293, y + 6, { width: 110 });
      doc.text('POSITION', 403, y + 6, { width: 70 });
      doc.text('STATUS', 473, y + 6, { width: 75 });

      y += 20;

      players.forEach((p, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(40, y, doc.page.width - 80, 18).fill(idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
        doc.fillColor('#000000').fontSize(8).font('Roboto');
        doc.text(`#${p.jersey_number}`, 48, y + 5, { width: 25 });
        doc.font('Roboto-Bold').text(p.player_id || 'PENDING', 73, y + 5, { width: 90 });
        doc.text(p.full_name, 163, y + 5, { width: 130 });
        doc.font('Roboto').text(p.team_name, 293, y + 5, { width: 110 });
        doc.text(p.position, 403, y + 5, { width: 70 });
        doc.fillColor(p.status === 'APPROVED' ? '#059669' : '#D97706').font('Roboto-Bold').text(p.status, 473, y + 5, { width: 75 });
        y += 18;
      });
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    }
  } else if (type === 'predictions') {
    const predictions = rows;

    if (predictions.length === 0) {
      doc.fillColor('#000000').fontSize(10).font('Roboto').text('No public predictions recorded yet.', 40, y);
    } else {
      doc.rect(40, y, doc.page.width - 80, 20).fill('#E5E7EB');
      doc.fillColor('#000000').fontSize(8).font('Roboto-Bold');
      doc.text('REF', 48, y + 6, { width: 100 });
      doc.text('MATCH DAY', 148, y + 6, { width: 130 });
      doc.text('NAME', 278, y + 6, { width: 130 });
      doc.text('EMAIL', 408, y + 6, { width: 145 });

      y += 20;

      predictions.forEach((p, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(40, y, doc.page.width - 80, 18).fill(idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
        doc.fillColor('#000000').fontSize(8).font('Roboto-Bold').text(p.prediction_ref, 48, y + 5, { width: 100 });
        doc.font('Roboto').text(p.match_day_name, 148, y + 5, { width: 130 });
        doc.font('Roboto-Bold').text(p.full_name, 278, y + 5, { width: 130 });
        doc.font('Roboto').text(p.email, 408, y + 5, { width: 145 });
        y += 18;
      });
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    }
  } else if (type === 'matches') {
    const matches = rows;

    if (matches.length === 0) {
      doc.fillColor('#000000').fontSize(10).font('Roboto').text('No scheduled matches in system.', 40, y);
    } else {
      doc.rect(40, y, doc.page.width - 80, 20).fill('#E5E7EB');
      doc.fillColor('#000000').fontSize(8).font('Roboto-Bold');
      doc.text('CODE', 48, y + 6, { width: 90 });
      doc.text('DATE & TIME', 138, y + 6, { width: 100 });
      doc.text('MATCH FIXTURE', 238, y + 6, { width: 170 });
      doc.text('SCORE / STATUS', 408, y + 6, { width: 140 });

      y += 20;

      matches.forEach((m, idx) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.rect(40, y, doc.page.width - 80, 20).fill(idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB');
        doc.fillColor('#000000').fontSize(8).font('Roboto-Bold').text(m.match_code, 48, y + 6, { width: 90 });
        doc.font('Roboto').text(`${m.date} ${m.time}`, 138, y + 6, { width: 100 });
        doc.font('Roboto-Bold').text(`${m.team_a_name} vs ${m.team_b_name}`, 238, y + 6, { width: 170 });
        doc.font('Roboto-Bold').text(m.status === 'FULL_TIME' ? `${m.score_a} - ${m.score_b} (FT)` : m.status, 408, y + 6, { width: 140 });
        y += 20;
      });
      doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
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
