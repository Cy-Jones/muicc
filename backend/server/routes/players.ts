import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

async function generatePlayerId(): Promise<string> {
  const countRow = (await db.prepare("SELECT COUNT(*) as count FROM players WHERE player_id IS NOT NULL").get() as any)?.count || 0;
  const seq = (countRow + 1).toString().padStart(4, '0');
  let candidate = `MULSU-PLY-${seq}`;
  
  let existing = await db.prepare('SELECT id FROM players WHERE player_id = ?').get(candidate);
  let offset = 1;
  while (existing) {
    candidate = `MULSU-PLY-${(countRow + 1 + offset).toString().padStart(4, '0')}`;
    existing = await db.prepare('SELECT id FROM players WHERE player_id = ?').get(candidate);
    offset++;
  }
  return candidate;
}

router.get('/', async (req, res) => {
  const { team_id, country, position, search } = req.query;

  let sql = `
    SELECT p.id, p.player_id, p.full_name, p.photo_url, p.nationality, p.university, p.position, p.jersey_number, p.preferred_foot,
           t.name as team_name, t.logo_url as team_logo, t.country as team_country
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.status = 'APPROVED'
  `;

  const params: any[] = [];

  if (team_id) {
    sql += ` AND p.team_id = ?`;
    params.push(team_id);
  }
  if (country) {
    sql += ` AND p.nationality = ?`;
    params.push(country);
  }
  if (position) {
    sql += ` AND p.position = ?`;
    params.push(position);
  }
  if (search) {
    sql += ` AND (p.full_name LIKE ? OR p.player_id LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY p.full_name ASC`;

  const players = await db.prepare(sql).all(...params);
  return res.json(players);
});

router.get('/verify/:playerId', async (req, res) => {
  const playerId = req.params.playerId.trim().toUpperCase();

  const player = await db.prepare(`
    SELECT p.id, p.player_id, p.full_name, p.photo_url, p.nationality, p.university, p.position, p.jersey_number, p.preferred_foot, p.status,
           t.name as team_name, t.logo_url as team_logo, t.country as team_country,
           pc.qr_code_url, pc.created_at as verified_at
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN player_cards pc ON pc.player_id = p.player_id
    WHERE p.player_id = ? AND p.status = 'APPROVED'
  `).get(playerId) as any;

  if (!player) {
    return res.status(404).json({ error: 'Player verification failed. Player ID not found or not approved.' });
  }

  const stats = await db.prepare(`
    SELECT 
      COUNT(DISTINCT me.match_id) as appearances,
      SUM(CASE WHEN me.event_type = 'GOAL' THEN 1 ELSE 0 END) as goals,
      SUM(CASE WHEN me.event_type = 'ASSIST' THEN 1 ELSE 0 END) as assists,
      SUM(CASE WHEN me.event_type = 'YELLOW_CARD' THEN 1 ELSE 0 END) as yellow_cards,
      SUM(CASE WHEN me.event_type = 'RED_CARD' THEN 1 ELSE 0 END) as red_cards
    FROM match_events me
    WHERE me.player_id = ?
  `).get(player.id) as any;

  const potmCount = (await db.prepare('SELECT COUNT(*) as count FROM matches WHERE potm_player_id = ?').get(player.id) as any)?.count || 0;

  return res.json({
    verified: true,
    badge: 'VERIFIED PLAYER',
    player: {
      ...player,
      stats: {
        appearances: stats?.appearances || 0,
        goals: stats?.goals || 0,
        assists: stats?.assists || 0,
        yellow_cards: stats?.yellow_cards || 0,
        red_cards: stats?.red_cards || 0,
        potm: potmCount
      }
    }
  });
});

router.get('/admin/all', authenticateAdmin, async (req, res) => {
  const players = await db.prepare(`
    SELECT p.*, t.name as team_name, t.country as team_country
    FROM players p
    JOIN teams t ON p.team_id = t.id
    ORDER BY p.created_at DESC
  `).all();
  return res.json(players);
});

router.post('/admin/save', authenticateAdmin, async (req, res) => {
  const { id, team_id, full_name, photo_url, dob, nationality, student_id, university, position, jersey_number, preferred_foot, emergency_contact, status } = req.body;

  if (!team_id || !full_name || !dob || !nationality || !student_id || !university || !position || !jersey_number) {
    return res.status(400).json({ error: 'Missing required player information.' });
  }

  if (id) {
    const existing = await db.prepare('SELECT * FROM players WHERE id = ?').get(id) as any;
    let playerId = existing.player_id;
    const targetStatus = status || existing.status;

    if (targetStatus === 'APPROVED' && !playerId) {
      playerId = await generatePlayerId();
    }

    await db.prepare(`
      UPDATE players
      SET team_id = ?, full_name = ?, photo_url = ?, dob = ?, nationality = ?, student_id = ?, university = ?, position = ?, jersey_number = ?, preferred_foot = ?, emergency_contact = ?, status = ?, player_id = ?
      WHERE id = ?
    `).run(team_id, full_name, photo_url, dob, nationality, student_id, university, position, jersey_number, preferred_foot || 'Right', emergency_contact, targetStatus, playerId, id);

    if (targetStatus === 'APPROVED' && playerId) {
      const qrDataUrl = await QRCode.toDataURL(`https://miucc2026.org/player/${playerId}`);
      await db.prepare(`
        INSERT OR REPLACE INTO player_cards (id, player_id, qr_code_url, card_data)
        VALUES (?, ?, ?, ?)
      `).run(crypto.randomUUID(), playerId, qrDataUrl, JSON.stringify({ verified: true, player_id: playerId }));
    }

    return res.json({ success: true, message: 'Player updated successfully.', player_id: playerId });
  } else {
    const targetStatus = status || 'APPROVED';
    const newId = crypto.randomUUID();
    const playerId = targetStatus === 'APPROVED' ? await generatePlayerId() : null;

    await db.prepare(`
      INSERT INTO players (id, player_id, team_id, full_name, photo_url, dob, nationality, student_id, university, position, jersey_number, preferred_foot, emergency_contact, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, playerId, team_id, full_name, photo_url, dob, nationality, student_id, university, position, jersey_number, preferred_foot || 'Right', emergency_contact, targetStatus);

    if (targetStatus === 'APPROVED' && playerId) {
      const qrDataUrl = await QRCode.toDataURL(`https://miucc2026.org/player/${playerId}`);
      await db.prepare(`
        INSERT INTO player_cards (id, player_id, qr_code_url, card_data)
        VALUES (?, ?, ?, ?)
      `).run(crypto.randomUUID(), playerId, qrDataUrl, JSON.stringify({ verified: true, player_id: playerId }));
    }

    return res.status(201).json({ success: true, message: 'Player created successfully.', player_id: playerId });
  }
});

router.put('/admin/:id/status', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'CHANGES_REQUIRED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const player = await db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id) as any;
  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }

  let playerId = player.player_id;
  if (status === 'APPROVED' && !playerId) {
    playerId = await generatePlayerId();
  }

  await db.prepare('UPDATE players SET status = ?, player_id = ? WHERE id = ?').run(status, playerId, req.params.id);

  if (status === 'APPROVED' && playerId) {
    const qrDataUrl = await QRCode.toDataURL(`https://miucc2026.org/player/${playerId}`);
    await db.prepare(`
      INSERT OR REPLACE INTO player_cards (id, player_id, qr_code_url, card_data)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), playerId, qrDataUrl, JSON.stringify({ verified: true, player_id: playerId }));
  }

  return res.json({ success: true, message: `Player status updated to ${status}.`, player_id: playerId });
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Player deleted successfully.' });
});

export default router;
