import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateManager, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';
import { getJwtSecret } from '../config.js';

const router = asyncRouter();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const manager = await db.prepare('SELECT * FROM team_managers WHERE email = ?').get(email.trim().toLowerCase()) as any;
  if (!manager || !bcrypt.compareSync(password, manager.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (manager.is_blocked === 1) {
    return res.status(403).json({ error: 'Your access has been temporarily blocked. Please contact the administrator.' });
  }

  // Get nation info
  const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;

  const token = jwt.sign(
    { id: manager.id, email: manager.email, nation_id: manager.nation_id, role: 'manager' },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    manager: {
      id: manager.id,
      email: manager.email,
      nation_id: manager.nation_id,
      nation
    }
  });
});

router.get('/me', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
  return res.json({ manager: { ...manager, nation } });
});

router.get('/my-team', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
  
  if (!nation) {
    return res.status(404).json({ error: 'Manager nation not found.' });
  }

  // Look for a team matching this manager's nation
  const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;
  
  if (!team) {
    return res.json({ team: null, players: [] });
  }

  const players = await db.prepare('SELECT * FROM players WHERE team_id = ?').all(team.id);

  return res.json({ team, players });
});

router.put('/my-team', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const manager = req.manager!;
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    if (!nation) return res.status(404).json({ error: 'Manager nation not found.' });

    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const { name, university, coach_name, manager_name, manager_email, manager_phone, logo_url } = req.body;

    await db.prepare(`
      UPDATE teams 
      SET name = ?, university = ?, coach_name = ?, manager_name = ?, manager_email = ?, manager_phone = ?, logo_url = ?
      WHERE id = ?
    `).run(
      name || team.name, 
      university || team.university, 
      coach_name || team.coach_name, 
      manager_name || team.manager_name, 
      manager_email || team.manager_email, 
      manager_phone || team.manager_phone, 
      logo_url || team.logo_url, 
      team.id
    );

    res.json({ success: true, message: 'Team details updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update team details' });
  }
});

router.put('/players/:id', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const { id } = req.params;
  const { full_name, position, jersey_number, student_id, dob, photo_url, course, medical_conditions, emergency_contact_name, emergency_contact_phone } = req.body;

  try {
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;

    if (!team) return res.status(403).json({ error: 'Team not found' });

    const player = await db.prepare('SELECT * FROM players WHERE id = ? AND team_id = ?').get(id, team.id);
    if (!player) return res.status(404).json({ error: 'Player not found in your team' });

    await db.prepare(`
      UPDATE players 
      SET full_name = ?, position = ?, jersey_number = ?, student_id = ?, dob = ?,
          photo_url = ?, course = ?, medical_conditions = ?, emergency_contact_name = ?, emergency_contact_phone = ?
      WHERE id = ?
    `).run(
      full_name, position, jersey_number, student_id || '', dob || '',
      photo_url || '', course || '', medical_conditions || '', emergency_contact_name || '', emergency_contact_phone || '',
      id
    );

    return res.json({ success: true, message: 'Player updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update player' });
  }
});

router.post('/players', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const { full_name, position, jersey_number, student_id, dob, nationality, photo_url, preferred_foot, course, medical_conditions, emergency_contact_name, emergency_contact_phone } = req.body;

  try {
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;

    if (!team) return res.status(403).json({ error: 'Team not found' });

    const id = crypto.randomUUID();
    const playerNationality = nationality || team.country;
    const playerUniversity = team.university;

    await db.prepare(`
      INSERT INTO players (
        id, team_id, full_name, photo_url, dob, nationality, student_id, university, 
        position, jersey_number, preferred_foot, course, medical_conditions, 
        emergency_contact_name, emergency_contact_phone, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `).run(
      id, team.id, full_name, photo_url || '', dob || '', playerNationality, 
      student_id || '', playerUniversity, position, jersey_number, 
      preferred_foot || 'Right', course || '', medical_conditions || '', 
      emergency_contact_name || '', emergency_contact_phone || ''
    );

    return res.json({ success: true, message: 'Player added successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to add player' });
  }
});

router.delete('/players/:id', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const { id } = req.params;

  try {
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;

    if (!team) return res.status(403).json({ error: 'Team not found' });

    const result = await db.prepare('DELETE FROM players WHERE id = ? AND team_id = ?').run(id, team.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Player not found or not in your team' });
    }

    return res.json({ success: true, message: 'Player deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete player' });
  }
});

// ── Manager Lineup Endpoints ──

// GET upcoming matches for the manager's team
router.get('/matches', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const manager = req.manager!;
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    if (!nation) return res.status(404).json({ error: 'Nation not found.' });

    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;
    if (!team) return res.json([]);

    const matches = await db.prepare(`
      SELECT m.*, md.name as match_day_name,
             ta.name as team_a_name, ta.logo_url as team_a_logo, ta.country as team_a_country,
             tb.name as team_b_name, tb.logo_url as team_b_logo, tb.country as team_b_country
      FROM matches m
      JOIN match_days md ON m.match_day_id = md.id
      JOIN teams ta ON m.team_a_id = ta.id
      JOIN teams tb ON m.team_b_id = tb.id
      WHERE (m.team_a_id = ? OR m.team_b_id = ?)
        AND m.status IN ('SCHEDULED', 'LIVE', 'HALF_TIME', 'POSTPONED')
      ORDER BY m.date ASC, m.time ASC
    `).all(team.id, team.id);

    // Attach lineup status for each match
    for (const m of matches as any[]) {
      const lineup = await db.prepare(
        'SELECT id, formation, approval_status, submitted_at FROM match_lineups WHERE match_id = ? AND team_id = ?'
      ).get(m.id, team.id) as any;
      m.lineup_status = lineup ? lineup.approval_status : null;
      m.lineup_id = lineup?.id || null;
    }

    return res.json(matches);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch matches' });
  }
});

// GET lineup for a specific match
router.get('/matches/:matchId/lineup', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const manager = req.manager!;
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation?.name) as any;
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const lineup = await db.prepare(
      'SELECT * FROM match_lineups WHERE match_id = ? AND team_id = ?'
    ).get(req.params.matchId, team.id) as any;

    if (!lineup) return res.json({ lineup: null, players: [] });

    const players = await db.prepare(`
      SELECT mlp.*, p.full_name, p.jersey_number, p.photo_url, p.position as registered_position
      FROM match_lineup_players mlp
      JOIN players p ON mlp.player_id = p.id
      WHERE mlp.lineup_id = ?
      ORDER BY mlp.is_starting DESC, mlp.display_order ASC
    `).all(lineup.id);

    return res.json({ lineup, players });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch lineup' });
  }
});

// POST/PUT lineup submission
router.post('/matches/:matchId/lineup', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const manager = req.manager!;
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation?.name) as any;
    if (!team) return res.status(403).json({ error: 'Team not found.' });

    const { formation, players } = req.body;
    // players = [{ player_id, is_starting, position, display_order }]

    if (!formation || !players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'Formation and at least one player are required.' });
    }

    const starters = players.filter((p: any) => p.is_starting);
    if (starters.length !== 11) {
      return res.status(400).json({ error: 'Exactly 11 starting players are required.' });
    }

    // Verify all players belong to this team
    for (const p of players) {
      const player = await db.prepare('SELECT id FROM players WHERE id = ? AND team_id = ?').get(p.player_id, team.id);
      if (!player) return res.status(400).json({ error: `Player ${p.player_id} does not belong to your team.` });
    }

    // Check if lineup already exists
    const existing = await db.prepare(
      'SELECT id FROM match_lineups WHERE match_id = ? AND team_id = ?'
    ).get(req.params.matchId, team.id) as any;

    let lineupId: string;

    if (existing) {
      lineupId = existing.id;
      // Update existing lineup - reset to PENDING
      await db.prepare(
        'UPDATE match_lineups SET formation = ?, approval_status = ?, submitted_at = CURRENT_TIMESTAMP, reviewed_at = NULL WHERE id = ?'
      ).run(formation, 'PENDING', lineupId);
      // Remove old players
      await db.prepare('DELETE FROM match_lineup_players WHERE lineup_id = ?').run(lineupId);
    } else {
      lineupId = crypto.randomUUID();
      await db.prepare(
        'INSERT INTO match_lineups (id, match_id, team_id, formation, approval_status) VALUES (?, ?, ?, ?, ?)'
      ).run(lineupId, req.params.matchId, team.id, formation, 'PENDING');
    }

    // Insert players
    const insertStmt = db.prepare(
      'INSERT INTO match_lineup_players (id, lineup_id, player_id, is_starting, position, display_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const p of players) {
      await insertStmt.run(
        crypto.randomUUID(), lineupId, p.player_id,
        p.is_starting ? 1 : 0, p.position || 'MID', p.display_order || 0
      );
    }

    return res.json({ success: true, message: 'Lineup submitted for approval.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit lineup' });
  }
});

export default router;
