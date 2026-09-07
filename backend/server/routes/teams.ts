import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/', async (req, res) => {
  const teams = await db.prepare(`
    SELECT t.*, g.name as group_name,
    (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id AND p.status = 'APPROVED') as player_count
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    WHERE t.status = 'APPROVED'
    ORDER BY t.name ASC
  `).all();

  return res.json(teams);
});

router.get('/status/:ref', async (req, res) => {
  const ref = req.params.ref.trim().toUpperCase();
  const team = await db.prepare(`
    SELECT registration_ref, name, university, country, status, created_at
    FROM teams
    WHERE registration_ref = ?
  `).get(ref) as any;

  if (team) {
    return res.json({ type: 'team', data: team });
  }

  const player = await db.prepare(`
    SELECT p.player_id, p.full_name, p.position, p.status, t.name as team_name, t.country as team_country
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.player_id = ?
  `).get(ref) as any;

  if (player) {
    return res.json({ type: 'player', data: player });
  }

  return res.status(404).json({ error: 'Registration reference not found.' });
});

router.get('/:id', async (req, res) => {
  const team = await db.prepare(`
    SELECT t.*, g.name as group_name
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    WHERE t.id = ? AND t.status = 'APPROVED'
  `).get(req.params.id) as any;

  if (!team) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const players = await db.prepare(`
    SELECT id, player_id, full_name, photo_url, position, jersey_number, nationality
    FROM players
    WHERE team_id = ? AND status = 'APPROVED'
    ORDER BY jersey_number ASC
  `).all(req.params.id);

  return res.json({ team, players });
});

router.get('/export-csv', async (req, res) => {
  const rows = await db.prepare(`
    SELECT 
      t.registration_ref as "Team Registration Ref",
      t.name as "Team Name",
      t.university as "University",
      t.country as "Country",
      COALESCE(g.name, 'Unassigned') as "Group",
      t.coach_name as "Head Coach",
      t.manager_name as "Manager Name",
      p.player_id as "Verified Player ID",
      p.full_name as "Player Full Name",
      p.position as "Position",
      p.jersey_number as "Jersey Number",
      p.student_id as "GR#",
      p.nationality as "Player Nationality",
      p.status as "Verification Status"
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    LEFT JOIN players p ON p.team_id = t.id AND p.status = 'APPROVED'
    WHERE t.status = 'APPROVED'
    ORDER BY t.name ASC, p.jersey_number ASC
  `).all();

  if (rows.length === 0) {
    return res.status(200).send('No registered teams or verified players available');
  }

  const headers = Object.keys(rows[0]).join(',');
  const csvContent = [
    headers,
    ...rows.map(row => Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="miucc_registered_verified_players_listing.csv"');
  return res.status(200).send(csvContent);
});

router.get('/export-pdf', async (req, res) => {
  const teams = await db.prepare(`
    SELECT t.*, g.name as group_name
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    WHERE t.status = 'APPROVED'
    ORDER BY t.name ASC
  `).all() as any[];

  if (teams.length === 0) {
    return res.status(200).send('No registered teams available');
  }

  // Fetch squads before streaming begins: after doc.pipe(res) the response
  // headers are already sent and a database error cannot be reported cleanly.
  const playersByTeam = new Map<string, any[]>();
  for (const t of teams) {
    playersByTeam.set(t.id, await db.prepare(`
      SELECT * FROM players
      WHERE team_id = ? AND status = 'APPROVED'
      ORDER BY jersey_number ASC
    `).all(t.id) as any[]);
  }

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="miucc_official_team_and_player_listing.pdf"');

  doc.pipe(res);

  // Document Header
  doc.rect(0, 0, doc.page.width, 70).fill('#0F1115');
  doc.fillColor('#FACC15').fontSize(16).font('Helvetica-Bold').text('MIUCC 2026 CHAMPIONS CUP', 30, 15);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text('OFFICIAL TEAM & VERIFIED ATHLETE SQUAD LISTING', 30, 36);
  doc.fillColor('#9CA3AF').fontSize(8).text('Marwadi University Campus | 26 September – 10 October 2026', 30, 50);

  let y = 85;

  for (const [tIdx, t] of teams.entries()) {
    const players = playersByTeam.get(t.id) || [];

    if (y > 700) {
      doc.addPage();
      y = 40;
    }

    // Team Header Box
    doc.rect(30, y, doc.page.width - 60, 32).fill('#1A1D24');
    doc.fillColor('#FACC15').fontSize(12).font('Helvetica-Bold').text(`${tIdx + 1}. ${t.name} (${t.country})`, 40, y + 8);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica').text(`Ref: ${t.registration_ref} | Group: ${t.group_name || 'Group Phase'} | Players: ${players.length}`, 300, y + 10, { align: 'right', width: 250 });

    y += 38;

    // Table Header
    doc.rect(30, y, doc.page.width - 60, 18).fill('#2D3748');
    doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
    doc.text('#', 40, y + 4, { width: 30 });
    doc.text('PLAYER ID', 70, y + 4, { width: 100 });
    doc.text('FULL ATHLETE NAME', 170, y + 4, { width: 160 });
    doc.text('POSITION', 330, y + 4, { width: 80 });
    doc.text('GR#', 410, y + 4, { width: 70 });
    doc.text('STATUS', 480, y + 4, { width: 70 });

    y += 22;

    if (players.length === 0) {
      doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica-Oblique').text('No verified players registered for this team yet.', 40, y);
      y += 20;
    } else {
      players.forEach((p, pIdx) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }

        const bg = pIdx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.rect(30, y - 2, doc.page.width - 60, 16).fill(bg);

        doc.fillColor('#111827').fontSize(8).font('Helvetica');
        doc.text(`#${p.jersey_number}`, 40, y, { width: 30 });
        doc.fillColor('#D97706').font('Helvetica-Bold').text(p.player_id || 'PENDING', 70, y, { width: 100 });
        doc.fillColor('#111827').font('Helvetica-Bold').text(p.full_name, 170, y, { width: 160 });
        doc.font('Helvetica').text(p.position, 330, y, { width: 80 });
        doc.text(p.student_id || 'N/A', 410, y, { width: 70 });
        doc.fillColor('#059669').font('Helvetica-Bold').text('VERIFIED', 480, y, { width: 70 });

        y += 18;
      });
    }

    y += 15;
  }

  doc.end();
});

router.get('/:id/export-pdf', async (req, res) => {
  const team = await db.prepare(`
    SELECT t.*, g.name as group_name
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    WHERE t.id = ? OR t.registration_ref = ?
  `).get(req.params.id, req.params.id) as any;

  if (!team) {
    return res.status(404).send('Team record not found.');
  }

  const players = await db.prepare(`
    SELECT * FROM players
    WHERE team_id = ?
    ORDER BY jersey_number ASC
  `).all(team.id) as any[];

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  const safeFilename = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_squad_roster.pdf"`);

  doc.pipe(res);

  // Document Header
  doc.rect(0, 0, doc.page.width, 75).fill('#0F1115');
  doc.fillColor('#FACC15').fontSize(16).font('Helvetica-Bold').text('MIUCC 2026 CHAMPIONS CUP', 30, 15);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica').text(`OFFICIAL SQUAD ROSTER — ${team.name.toUpperCase()}`, 30, 36);
  doc.fillColor('#9CA3AF').fontSize(8).text(`Registration Ref: ${team.registration_ref} | Country: ${team.country} | Group: ${team.group_name || 'Group Phase'}`, 30, 52);

  // Team Details Section
  let y = 90;
  doc.rect(30, y, doc.page.width - 60, 45).fill('#1A1D24');
  doc.fillColor('#FACC15').fontSize(9).font('Helvetica-Bold').text('UNIVERSITY:', 40, y + 8);
  doc.fillColor('#FFFFFF').font('Helvetica').text(team.university, 115, y + 8);

  doc.fillColor('#FACC15').font('Helvetica-Bold').text('HEAD COACH:', 40, y + 24);
  doc.fillColor('#FFFFFF').font('Helvetica').text(team.coach_name || 'N/A', 115, y + 24);

  doc.fillColor('#FACC15').font('Helvetica-Bold').text('MANAGER:', 320, y + 8);
  doc.fillColor('#FFFFFF').font('Helvetica').text(`${team.manager_name || 'N/A'} (${team.manager_phone || ''})`, 380, y + 8);

  doc.fillColor('#FACC15').font('Helvetica-Bold').text('EMAIL:', 320, y + 24);
  doc.fillColor('#FFFFFF').font('Helvetica').text(team.manager_email || 'N/A', 380, y + 24);

  y += 55;

  // Roster Table Header
  doc.rect(30, y, doc.page.width - 60, 18).fill('#2D3748');
  doc.fillColor('#FACC15').fontSize(8).font('Helvetica-Bold');
  doc.text('#', 40, y + 4, { width: 30 });
  doc.text('PLAYER ID', 70, y + 4, { width: 100 });
  doc.text('FULL ATHLETE NAME', 170, y + 4, { width: 160 });
  doc.text('POSITION', 330, y + 4, { width: 80 });
  doc.text('GR#', 410, y + 4, { width: 70 });
  doc.text('STATUS', 480, y + 4, { width: 70 });

  y += 22;

  if (players.length === 0) {
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica-Oblique').text('No players registered for this team yet.', 40, y);
  } else {
    players.forEach((p, pIdx) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }

      const bg = pIdx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
      doc.rect(30, y - 2, doc.page.width - 60, 16).fill(bg);

      doc.fillColor('#111827').fontSize(8).font('Helvetica');
      doc.text(`#${p.jersey_number}`, 40, y, { width: 30 });
      doc.fillColor('#D97706').font('Helvetica-Bold').text(p.player_id || 'PENDING', 70, y, { width: 100 });
      doc.fillColor('#111827').font('Helvetica-Bold').text(p.full_name, 170, y, { width: 160 });
      doc.font('Helvetica').text(p.position, 330, y, { width: 80 });
      doc.text(p.student_id || 'N/A', 410, y, { width: 70 });
      doc.fillColor(p.status === 'APPROVED' ? '#059669' : '#D97706').font('Helvetica-Bold').text(p.status, 480, y, { width: 70 });

      y += 18;
    });
  }

  doc.end();
});

router.post('/register', async (req, res) => {
  const { name, university, country, coach_name, manager_name, manager_email, manager_phone, description, logo_url, players } = req.body;

  if (!name || !university || !country || !coach_name || !manager_name || !manager_email || !manager_phone) {
    return res.status(400).json({ error: 'All required team registration fields must be provided.' });
  }

  const countryClean = (country || 'TEAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const count = (await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any)?.count || 0;
  const nextSeq = 2601 + count;
  const registrationRef = `MULSU-${countryClean}-${nextSeq}`;
  const teamId = crypto.randomUUID();

  let registeredPlayersCount = 0;

  await db.transaction(async (tx) => {
    await tx.prepare(`
      INSERT INTO teams (id, registration_ref, name, university, country, logo_url, coach_name, manager_name, manager_email, manager_phone, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(teamId, registrationRef, name, university, country, logo_url || null, coach_name, manager_name, manager_email, manager_phone, description || '');

    if (Array.isArray(players) && players.length > 0) {
      const stmt = tx.prepare(`
        INSERT INTO players (id, player_id, team_id, full_name, photo_url, dob, nationality, student_id, university, position, jersey_number, preferred_foot, course, medical_conditions, emergency_contact_name, emergency_contact_phone, status)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
      `);

      for (const p of players) {
        if (p.full_name && p.position && p.jersey_number) {
          await stmt.run(
            crypto.randomUUID(),
            teamId,
            p.full_name.trim(),
            p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',
            p.dob || '2003-01-01',
            p.nationality || country,
            p.student_id || 'PENDING',
            university,
            p.position,
            parseInt(p.jersey_number, 10) || 1,
            p.preferred_foot || 'Right',
            p.course || '',
            p.medical_conditions || '',
            p.emergency_contact_name || '',
            p.emergency_contact_phone || ''
          );
          registeredPlayersCount++;
        }
      }
    }
  });

  return res.status(201).json({
    success: true,
    registrationRef,
    status: 'PENDING',
    playersCount: registeredPlayersCount,
    message: `Team registration submitted successfully with ${registeredPlayersCount} players. Please save your reference ID to check review status.`
  });
});

router.get('/admin/all', authenticateAdmin, async (req, res) => {
  const teams = await db.prepare(`
    SELECT t.*, g.name as group_name,
    (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) as total_players,
    (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id AND p.status = 'APPROVED') as approved_players
    FROM teams t
    LEFT JOIN group_teams gt ON gt.team_id = t.id
    LEFT JOIN groups g ON g.id = gt.group_id
    ORDER BY t.created_at DESC
  `).all();

  return res.json(teams);
});

router.put('/admin/:id/status', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['PENDING', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  await db.prepare('UPDATE teams SET status = ? WHERE id = ?').run(status, req.params.id);

  if (status === 'APPROVED') {
    const existingStandings = await db.prepare('SELECT * FROM standings WHERE team_id = ?').get(req.params.id);
    if (!existingStandings) {
      const defaultGroup = await db.prepare('SELECT id FROM groups LIMIT 1').get() as any;
      if (defaultGroup) {
        await db.prepare('INSERT OR IGNORE INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), defaultGroup.id, req.params.id);
        await db.prepare('INSERT OR IGNORE INTO standings (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), defaultGroup.id, req.params.id);
      }
    }
  }

  return res.json({ success: true, message: `Team status updated to ${status}.` });
});

router.post('/admin/save', authenticateAdmin, async (req, res) => {
  const { id, name, university, country, logo_url, coach_name, manager_name, manager_email, manager_phone, description, status } = req.body;

  if (id) {
    await db.prepare(`
      UPDATE teams
      SET name = ?, university = ?, country = ?, logo_url = ?, coach_name = ?, manager_name = ?, manager_email = ?, manager_phone = ?, description = ?, status = ?
      WHERE id = ?
    `).run(name, university, country, logo_url, coach_name, manager_name, manager_email, manager_phone, description, status || 'APPROVED', id);
    return res.json({ success: true, message: 'Team updated successfully.' });
  } else {
    const countryClean = (country || 'TEAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const count = (await db.prepare('SELECT COUNT(*) as count FROM teams').get() as any)?.count || 0;
    const nextSeq = 2601 + count;
    const registrationRef = `MIUCC-${countryClean}-${nextSeq}`;
    const newId = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO teams (id, registration_ref, name, university, country, logo_url, coach_name, manager_name, manager_email, manager_phone, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, registrationRef, name, university, country, logo_url, coach_name, manager_name, manager_email, manager_phone, description, status || 'APPROVED');
    return res.json({ success: true, message: 'Team created successfully.' });
  }
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Team deleted successfully.' });
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Team deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
