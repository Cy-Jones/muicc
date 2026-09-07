import {Response} from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/days', async (req, res) => {
  const days = await db.prepare('SELECT * FROM match_days ORDER BY number ASC').all();
  return res.json(days);
});

router.get('/', async (req, res) => {
  const { match_day_id, status, stage } = req.query;

  let sql = `
    SELECT m.*, md.name as match_day_name,
           ta.name as team_a_name, ta.logo_url as team_a_logo, ta.country as team_a_country,
           tb.name as team_b_name, tb.logo_url as team_b_logo, tb.country as team_b_country,
           potm.full_name as potm_name
    FROM matches m
    JOIN match_days md ON m.match_day_id = md.id
    JOIN teams ta ON m.team_a_id = ta.id
    JOIN teams tb ON m.team_b_id = tb.id
    LEFT JOIN players potm ON m.potm_player_id = potm.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (match_day_id) {
    sql += ` AND m.match_day_id = ?`;
    params.push(match_day_id);
  }
  if (status) {
    sql += ` AND m.status = ?`;
    params.push(status);
  }
  if (stage) {
    sql += ` AND m.stage = ?`;
    params.push(stage);
  }

  sql += ` ORDER BY m.date ASC, m.time ASC`;

  const matches = await db.prepare(sql).all(...params);
  return res.json(matches);
});

router.get('/:id', async (req, res) => {
  const match = await db.prepare(`
    SELECT m.*, md.name as match_day_name,
           ta.name as team_a_name, ta.logo_url as team_a_logo, ta.country as team_a_country,
           tb.name as team_b_name, tb.logo_url as team_b_logo, tb.country as team_b_country,
           potm.full_name as potm_name, potm.photo_url as potm_photo
    FROM matches m
    JOIN match_days md ON m.match_day_id = md.id
    JOIN teams ta ON m.team_a_id = ta.id
    JOIN teams tb ON m.team_b_id = tb.id
    LEFT JOIN players potm ON m.potm_player_id = potm.id
    WHERE m.id = ?
  `).get(req.params.id) as any;

  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const events = await db.prepare(`
    SELECT me.*, p.full_name as player_name, p.jersey_number as player_jersey,
           p2.full_name as secondary_player_name, t.name as team_name
    FROM match_events me
    JOIN players p ON me.player_id = p.id
    JOIN teams t ON me.team_id = t.id
    LEFT JOIN players p2 ON me.secondary_player_id = p2.id
    WHERE me.match_id = ?
    ORDER BY me.minute ASC
  `).all(req.params.id);

  return res.json({ match, events });
});

router.post('/admin/save', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  let { id, match_day_id, group_id, stage, team_a_id, team_b_id, date, time, venue, status, score_a, score_b, minute_text } = req.body;

  if (!team_a_id || !team_b_id) {
    return res.status(400).json({ error: 'Both Team A and Team B are required.' });
  }

  if (team_a_id === team_b_id) {
    return res.status(400).json({ error: 'Team A and Team B must be different teams.' });
  }

  if (!match_day_id) match_day_id = 'md-1';
  if (!stage) stage = 'Group Stage';
  if (!date) date = '2026-09-26';
  if (!time) time = '16:00';
  if (!venue) venue = 'Marwadi University Main Stadium';
  if (!status) status = 'SCHEDULED';

  const valScoreA = parseInt(score_a || '0', 10);
  const valScoreB = parseInt(score_b || '0', 10);
  const now = Date.now();

  if (id) {
    await db.prepare(`
      UPDATE matches
      SET match_day_id = ?, group_id = ?, stage = ?, team_a_id = ?, team_b_id = ?, date = ?, time = ?, venue = ?, status = ?, score_a = ?, score_b = ?, minute_text = ?
      WHERE id = ?
    `).run(match_day_id, group_id || null, stage, team_a_id, team_b_id, date, time, venue, status, valScoreA, valScoreB, minute_text || '', id);

    if (status === 'LIVE') {
      const existing = await db.prepare('SELECT live_start_timestamp FROM matches WHERE id = ?').get(id) as any;
      if (!existing?.live_start_timestamp) {
        await db.prepare("UPDATE matches SET live_start_timestamp = ?, live_period = '1ST_HALF' WHERE id = ?").run(now, id);
      }
    }

    if (status === 'FULL_TIME') {
      try {
        await db.prepare("UPDATE matches SET confirmed_result = 1 WHERE id = ?").run(id);
      } catch (e) {}
    }

    return res.json({ success: true, message: 'Match updated successfully.' });
  } else {
    const count = (((await db.prepare('SELECT COUNT(*) as count FROM matches').get() as any)?.count || 0) + 1);
    const matchCode = `MIUCC-M${count.toString().padStart(2, '0')}`;
    const newId = crypto.randomUUID();

    const liveStartTs = status === 'LIVE' ? now : null;
    const livePeriod = status === 'LIVE' ? '1ST_HALF' : (status === 'FULL_TIME' ? 'FULL_TIME' : 'NONE');

    await db.prepare(`
      INSERT INTO matches (id, match_code, match_day_id, group_id, stage, team_a_id, team_b_id, date, time, venue, status, score_a, score_b, minute_text, live_start_timestamp, live_period, confirmed_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newId, matchCode, match_day_id, group_id || null, stage, team_a_id, team_b_id, date, time, venue, status, valScoreA, valScoreB, minute_text || '', liveStartTs, livePeriod, status === 'FULL_TIME' ? 1 : 0);

    return res.json({ success: true, message: `Match created successfully as ${status}.`, match_code: matchCode });
  }
});

router.delete('/admin/:id', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await db.transaction(async (tx) => {
    await tx.prepare('DELETE FROM match_events WHERE match_id = ?').run(req.params.id);
    await tx.prepare('DELETE FROM matches WHERE id = ?').run(req.params.id);
  });
  return res.json({ success: true, message: 'Match deleted successfully.' });
});

router.put('/admin/:id/live-clock', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const matchId = req.params.id;
  const { action, stoppage_time } = req.body;

  const match = await db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
  if (!match) return res.status(404).json({ error: 'Match not found.' });

  const now = Date.now();

  if (action === 'START_1ST_HALF') {
    await db.prepare(`
      UPDATE matches
      SET status = 'LIVE', live_period = '1ST_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '0\''
      WHERE id = ?
    `).run(now, matchId);
    return res.json({ success: true, message: 'First Half Started! Match clock running automatically from 0\'.' });
  } else if (action === 'PAUSE_HALF_TIME') {
    await db.prepare(`
      UPDATE matches
      SET status = 'HALF_TIME', live_period = 'HALF_TIME', minute_text = 'HT'
      WHERE id = ?
    `).run(matchId);
    return res.json({ success: true, message: 'First Half Paused! Status set to HALF TIME (HT).' });
  } else if (action === 'START_2ND_HALF') {
    await db.prepare(`
      UPDATE matches
      SET status = 'LIVE', live_period = '2ND_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '45\''
      WHERE id = ?
    `).run(now, matchId);
    return res.json({ success: true, message: 'Second Half Resumed! Match clock running automatically from 45\'.' });
  } else if (action === 'SET_STOPPAGE_1ST') {
    const stop1 = parseInt(stoppage_time || '0', 10);
    await db.prepare('UPDATE matches SET stoppage_time_1st = ? WHERE id = ?').run(stop1, matchId);
    return res.json({ success: true, message: `1st Half Stoppage Time set to +${stop1} mins.` });
  } else if (action === 'SET_STOPPAGE_2ND') {
    const stop2 = parseInt(stoppage_time || '0', 10);
    await db.prepare('UPDATE matches SET stoppage_time_2nd = ? WHERE id = ?').run(stop2, matchId);
    return res.json({ success: true, message: `2nd Half Stoppage Time set to +${stop2} mins.` });
  } else if (action === 'END_MATCH') {
    await db.prepare(`
      UPDATE matches
      SET status = 'FULL_TIME', live_period = 'FULL_TIME', minute_text = 'FT', confirmed_result = 1
      WHERE id = ?
    `).run(matchId);
    return res.json({ success: true, message: 'Match Finished! Status set to FULL TIME (FT).' });
  }

  return res.status(400).json({ error: 'Invalid live clock action.' });
});

router.post('/admin/:id/events', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const matchId = req.params.id;
  const { minute, team_id, player_id, event_type, secondary_player_id, details } = req.body;

  if (!team_id || !player_id || !event_type) {
    return res.status(400).json({ error: 'Team, player, and event type are required.' });
  }

  const eventId = crypto.randomUUID();
  const minVal = parseInt(minute || '1', 10);

  await db.prepare(`
    INSERT INTO match_events (id, match_id, minute, team_id, player_id, event_type, secondary_player_id, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, matchId, minVal, team_id, player_id, event_type, secondary_player_id || null, details || '');

  if (event_type === 'GOAL') {
    const match = await db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
    if (match) {
      if (team_id === match.team_a_id) {
        await db.prepare('UPDATE matches SET score_a = score_a + 1 WHERE id = ?').run(matchId);
      } else if (team_id === match.team_b_id) {
        await db.prepare('UPDATE matches SET score_b = score_b + 1 WHERE id = ?').run(matchId);
      }
    }
  }

  return res.status(201).json({ success: true, message: 'Match event recorded.' });
});

router.put('/admin/:id/status', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { status, score_a, score_b, potm_player_id, minute_text } = req.body;
  
  await db.prepare(`
    UPDATE matches
    SET status = ?, score_a = COALESCE(?, score_a), score_b = COALESCE(?, score_b), potm_player_id = COALESCE(?, potm_player_id), minute_text = COALESCE(?, minute_text)
    WHERE id = ?
  `).run(status, score_a, score_b, potm_player_id, minute_text, req.params.id);

  return res.json({ success: true, message: `Match status updated to ${status}.` });
});

router.post('/admin/:id/confirm-result', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const matchId = req.params.id;

  await db.transaction(async (tx) => {
    const match = await tx.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
    if (!match) throw new Error('Match not found.');

    await tx.prepare("UPDATE matches SET status = 'FULL_TIME', confirmed_result = 1 WHERE id = ?").run(matchId);

    if (match.group_id) {
      const allGroupMatches = await tx.prepare(`
        SELECT * FROM matches
        WHERE group_id = ? AND confirmed_result = 1 AND status = 'FULL_TIME'
      `).all(match.group_id) as any[];

      const groupTeams = await tx.prepare('SELECT team_id FROM group_teams WHERE group_id = ?').all(match.group_id) as any[];
      for (const gt of groupTeams) {
        await tx.prepare(`
          UPDATE standings
          SET played = 0, won = 0, drawn = 0, lost = 0, goals_for = 0, goals_against = 0, goal_difference = 0, points = 0
          WHERE group_id = ? AND team_id = ?
        `).run(match.group_id, gt.team_id);
      }

      for (const m of allGroupMatches) {
        const teamA = m.team_a_id;
        const teamB = m.team_b_id;
        const scoreA = m.score_a;
        const scoreB = m.score_b;

        let pointsA = 0, pointsB = 0, wonA = 0, wonB = 0, drawnA = 0, drawnB = 0, lostA = 0, lostB = 0;
        if (scoreA > scoreB) {
          wonA = 1; pointsA = 3; lostB = 1;
        } else if (scoreB > scoreA) {
          wonB = 1; pointsB = 3; lostA = 1;
        } else {
          drawnA = 1; pointsA = 1; drawnB = 1; pointsB = 1;
        }

        await tx.prepare(`
          UPDATE standings
          SET played = played + 1, won = won + ?, drawn = drawn + ?, lost = lost + ?,
              goals_for = goals_for + ?, goals_against = goals_against + ?,
              goal_difference = goal_difference + ?, points = points + ?
          WHERE group_id = ? AND team_id = ?
        `).run(wonA, drawnA, lostA, scoreA, scoreB, (scoreA - scoreB), pointsA, match.group_id, teamA);

        await tx.prepare(`
          UPDATE standings
          SET played = played + 1, won = won + ?, drawn = drawn + ?, lost = lost + ?,
              goals_for = goals_for + ?, goals_against = goals_against + ?,
              goal_difference = goal_difference + ?, points = points + ?
          WHERE group_id = ? AND team_id = ?
        `).run(wonB, drawnB, lostB, scoreB, scoreA, (scoreB - scoreA), pointsB, match.group_id, teamB);
      }

      const rankedStandings = await tx.prepare(`
        SELECT id FROM standings
        WHERE group_id = ?
        ORDER BY points DESC, goal_difference DESC, goals_for DESC
      `).all(match.group_id) as any[];

      for (const [index, st] of rankedStandings.entries()) {
        await tx.prepare('UPDATE standings SET position = ? WHERE id = ?').run(index + 1, st.id);
      }
    }

    await tx.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, entity, entity_id, details)
      VALUES (?, ?, 'CONFIRM_MATCH_RESULT', 'MATCH', ?, ?)
    `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org', matchId, `Confirmed match result: ${match.score_a} - ${match.score_b}`);
  });

  return res.json({ success: true, message: 'Match result confirmed. Standings and statistics updated automatically.' });
});

export default router;
