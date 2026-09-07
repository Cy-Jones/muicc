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

router.put('/players/:id', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const { id } = req.params;
  const { full_name, position, jersey_number, student_id, dob } = req.body;

  try {
    const nation = await db.prepare('SELECT * FROM participating_nations WHERE id = ?').get(manager.nation_id) as any;
    const team = await db.prepare('SELECT * FROM teams WHERE country = ? COLLATE NOCASE').get(nation.name) as any;

    if (!team) return res.status(403).json({ error: 'Team not found' });

    const player = await db.prepare('SELECT * FROM players WHERE id = ? AND team_id = ?').get(id, team.id);
    if (!player) return res.status(404).json({ error: 'Player not found in your team' });

    await db.prepare(`
      UPDATE players 
      SET full_name = ?, position = ?, jersey_number = ?, student_id = ?, dob = ?
      WHERE id = ?
    `).run(full_name, position, jersey_number, student_id || '', dob || '', id);

    return res.json({ success: true, message: 'Player updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update player' });
  }
});

router.post('/players', authenticateManager, async (req: AuthenticatedRequest, res: Response) => {
  const manager = req.manager!;
  const { full_name, position, jersey_number, student_id, dob, nationality, photo_url, preferred_foot, emergency_contact } = req.body;

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
        position, jersey_number, preferred_foot, emergency_contact, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `).run(
      id, team.id, full_name, photo_url || '', dob || '', playerNationality, 
      student_id || '', playerUniversity, position, jersey_number, 
      preferred_foot || 'Right', emergency_contact || ''
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

export default router;
