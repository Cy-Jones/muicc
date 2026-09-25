import {Response} from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

async function updateAllStandings(tx: any) {
  await tx.prepare(`
    UPDATE standings
    SET played = 0, won = 0, drawn = 0, lost = 0, goals_for = 0, goals_against = 0, goal_difference = 0, points = 0
  `).run();

  const allMatches = await tx.prepare(`
    SELECT * FROM matches
    WHERE confirmed_result = 1 AND status = 'FULL_TIME'
  `).all() as any[];

  for (const m of allMatches) {
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
      WHERE team_id = ?
    `).run(wonA, drawnA, lostA, scoreA, scoreB, (scoreA - scoreB), pointsA, teamA);

    await tx.prepare(`
      UPDATE standings
      SET played = played + 1, won = won + ?, drawn = drawn + ?, lost = lost + ?,
          goals_for = goals_for + ?, goals_against = goals_against + ?,
          goal_difference = goal_difference + ?, points = points + ?
      WHERE team_id = ?
    `).run(wonB, drawnB, lostB, scoreB, scoreA, (scoreB - scoreA), pointsB, teamB);
  }

  const groups = await tx.prepare('SELECT id FROM groups').all() as any[];
  for (const g of groups) {
    const rankedStandings = await tx.prepare(`
      SELECT id FROM standings
      WHERE group_id = ?
      ORDER BY points DESC, goal_difference DESC, goals_for DESC
    `).all(g.id) as any[];

    for (const [index, st] of rankedStandings.entries()) {
      await tx.prepare('UPDATE standings SET position = ? WHERE id = ?').run(index + 1, st.id);
    }
  }

  // AUTO ADVANCE TO KNOCKOUTS
  try {
    const groupsObj = await tx.prepare("SELECT id, name FROM groups").all() as any[];
    const grpA = groupsObj.find((g: any) => g.name === 'Group A');
    const grpB = groupsObj.find((g: any) => g.name === 'Group B');

    let a1, a2, b1, b2;

    const checkFinished = async (groupId: string) => {
      // Must have at least 1 match to be considered finished, and 0 pending
      const stats = await tx.prepare(`
        SELECT COUNT(*) as total, SUM(CASE WHEN confirmed_result = 0 THEN 1 ELSE 0 END) as pending
        FROM matches WHERE group_id = ?
      `).get(groupId) as any;
      return stats && stats.total > 0 && stats.pending === 0;
    };

    if (grpA && await checkFinished(grpA.id)) {
      const std = await tx.prepare("SELECT team_id FROM standings WHERE group_id = ? ORDER BY position ASC LIMIT 2").all(grpA.id) as any[];
      if (std.length >= 2) { a1 = std[0].team_id; a2 = std[1].team_id; }
    }

    if (grpB && await checkFinished(grpB.id)) {
      const std = await tx.prepare("SELECT team_id FROM standings WHERE group_id = ? ORDER BY position ASC LIMIT 2").all(grpB.id) as any[];
      if (std.length >= 2) { b1 = std[0].team_id; b2 = std[1].team_id; }
    }

    // MIUCC-SF1: Group A Winner vs Group B Runner-Up
    if (a1) await tx.prepare("UPDATE matches SET team_a_id = ? WHERE match_code = 'MIUCC-SF1'").run(a1);
    if (b2) await tx.prepare("UPDATE matches SET team_b_id = ? WHERE match_code = 'MIUCC-SF1'").run(b2);
    
    // MIUCC-SF2: Group B Winner vs Group A Runner-Up
    if (b1) await tx.prepare("UPDATE matches SET team_a_id = ? WHERE match_code = 'MIUCC-SF2'").run(b1);
    if (a2) await tx.prepare("UPDATE matches SET team_b_id = ? WHERE match_code = 'MIUCC-SF2'").run(a2);

    // Auto advance to Finals / Third Place
    const getWinnerLoser = (m: any) => {
      if (!m) return { w: null, l: null };
      const scoreA = m.score_a + (m.penalty_a || 0);
      const scoreB = m.score_b + (m.penalty_b || 0);
      if (scoreA > scoreB) return { w: m.team_a_id, l: m.team_b_id };
      if (scoreB > scoreA) return { w: m.team_b_id, l: m.team_a_id };
      return { w: null, l: null };
    };

    const sf1 = await tx.prepare("SELECT * FROM matches WHERE match_code = 'MIUCC-SF1' AND confirmed_result = 1").get() as any;
    const sf2 = await tx.prepare("SELECT * FROM matches WHERE match_code = 'MIUCC-SF2' AND confirmed_result = 1").get() as any;

    const res1 = getWinnerLoser(sf1);
    const res2 = getWinnerLoser(sf2);

    if (res1.w) await tx.prepare("UPDATE matches SET team_a_id = ? WHERE match_code = 'MIUCC-FNL'").run(res1.w);
    if (res2.w) await tx.prepare("UPDATE matches SET team_b_id = ? WHERE match_code = 'MIUCC-FNL'").run(res2.w);
    
    if (res1.l) await tx.prepare("UPDATE matches SET team_a_id = ? WHERE match_code = 'MIUCC-3RD'").run(res1.l);
    if (res2.l) await tx.prepare("UPDATE matches SET team_b_id = ? WHERE match_code = 'MIUCC-3RD'").run(res2.l);

  } catch (err) {
    console.error("Auto-advance error:", err);
  }
}


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

  // Fetch approved lineups
  const lineups = await db.prepare(`
    SELECT id, team_id, formation
    FROM match_lineups
    WHERE match_id = ? AND approval_status = 'APPROVED'
  `).all(req.params.id) as any[];

  for (const lineup of lineups) {
    lineup.players = await db.prepare(`
      SELECT mlp.is_starting, mlp.position, mlp.display_order, p.full_name, p.jersey_number, p.photo_url
      FROM match_lineup_players mlp
      JOIN players p ON mlp.player_id = p.id
      WHERE mlp.lineup_id = ?
      ORDER BY mlp.is_starting DESC, mlp.display_order ASC
    `).all(lineup.id);
  }

  return res.json({ match, events, lineups });
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
    } else {
      try {
        await db.prepare("UPDATE matches SET confirmed_result = 0 WHERE id = ?").run(id);
      } catch (e) {}
    }

    try {
      await updateAllStandings(db);
    } catch (e) {}

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
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'FIRST_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '0''' WHERE id = ?`).run(now, matchId);
    return res.json({ success: true, message: 'First Half Started!' });
  } else if (action === 'END_1ST_HALF' || action === 'PAUSE_HALF_TIME') {
    await db.prepare(`UPDATE matches SET status = 'HALF_TIME', live_period = 'HALF_TIME', minute_text = 'HT' WHERE id = ?`).run(matchId);
    return res.json({ success: true, message: 'First Half Ended (HT).' });
  } else if (action === 'START_2ND_HALF') {
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'SECOND_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '45''' WHERE id = ?`).run(now, matchId);
    return res.json({ success: true, message: 'Second Half Started!' });
  } else if (action === 'END_2ND_HALF') {
    await db.prepare(`UPDATE matches SET status = 'FULL_TIME', live_period = 'FULL_TIME', minute_text = 'FT' WHERE id = ?`).run(matchId);
    return res.json({ success: true, message: 'Second Half Ended (FT).' });
  } else if (action === 'START_ET_1') {
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'EXTRA_TIME_FIRST_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '90''' WHERE id = ?`).run(now, matchId);
    return res.json({ success: true, message: 'Extra Time 1st Half Started!' });
  } else if (action === 'END_ET_1') {
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'EXTRA_TIME_HALF_TIME', minute_text = 'HT ET' WHERE id = ?`).run(matchId);
    return res.json({ success: true, message: 'Extra Time 1st Half Ended.' });
  } else if (action === 'START_ET_2') {
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'EXTRA_TIME_SECOND_HALF', live_start_timestamp = ?, live_pause_elapsed_seconds = 0, minute_text = '105''' WHERE id = ?`).run(now, matchId);
    return res.json({ success: true, message: 'Extra Time 2nd Half Started!' });
  } else if (action === 'START_PENALTIES') {
    await db.prepare(`UPDATE matches SET status = 'LIVE', live_period = 'PENALTY_SHOOTOUT', minute_text = 'Pens' WHERE id = ?`).run(matchId);
    return res.json({ success: true, message: 'Penalty Shootout Started!' });
  } else if (action === 'END_MATCH') {
    await db.prepare(`UPDATE matches SET status = 'FULL_TIME', live_period = 'COMPLETED', minute_text = 'FT', confirmed_result = 1 WHERE id = ?`).run(matchId);
    await updateAllStandings(db);
    return res.json({ success: true, message: 'Match Finished and Completed!' });
  } else if (action === 'SET_STOPPAGE_1ST') {
    await db.prepare('UPDATE matches SET stoppage_time_1st = ? WHERE id = ?').run(parseInt(stoppage_time || '0', 10), matchId);
    return res.json({ success: true, message: `1st Half Stoppage Time set.` });
  } else if (action === 'SET_STOPPAGE_2ND') {
    await db.prepare('UPDATE matches SET stoppage_time_2nd = ? WHERE id = ?').run(parseInt(stoppage_time || '0', 10), matchId);
    return res.json({ success: true, message: `2nd Half Stoppage Time set.` });
  } else if (action === 'SET_STOPPAGE_ET1') {
    await db.prepare('UPDATE matches SET stoppage_time_et1 = ? WHERE id = ?').run(parseInt(stoppage_time || '0', 10), matchId);
    return res.json({ success: true, message: `ET 1st Half Stoppage Time set.` });
  } else if (action === 'SET_STOPPAGE_ET2') {
    await db.prepare('UPDATE matches SET stoppage_time_et2 = ? WHERE id = ?').run(parseInt(stoppage_time || '0', 10), matchId);
    return res.json({ success: true, message: `ET 2nd Half Stoppage Time set.` });
  } else if (action === 'TOGGLE_TEST_MODE') {
    const isTestMode = match.is_test_mode === 1 ? 0 : 1;
    await db.prepare('UPDATE matches SET is_test_mode = ? WHERE id = ?').run(isTestMode, matchId);
    return res.json({ success: true, message: `Test mode ${isTestMode ? 'enabled' : 'disabled'}.` });
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
  const { status, score_a, score_b, potm_player_id, minute_text, date, time } = req.body;
  
  const match = await db.prepare('SELECT group_id FROM matches WHERE id = ?').get(req.params.id) as any;
  await db.prepare(`
    UPDATE matches
    SET status = ?, 
        score_a = COALESCE(?, score_a), 
        score_b = COALESCE(?, score_b), 
        potm_player_id = COALESCE(?, potm_player_id), 
        minute_text = COALESCE(?, minute_text),
        date = COALESCE(?, date),
        time = COALESCE(?, time)
    WHERE id = ?
  `).run(status, score_a, score_b, potm_player_id, minute_text, date, time, req.params.id);

  if (status === 'FULL_TIME' && match && match.group_id) {
    await db.prepare("UPDATE matches SET confirmed_result = 1 WHERE id = ?").run(req.params.id);
    await updateAllStandings(db);
  }

  return res.json({ success: true, message: `Match status updated to ${status}.` });
});

router.post('/admin/:id/confirm-result', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const matchId = req.params.id;

  await db.transaction(async (tx) => {
    const match = await tx.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as any;
    if (!match) throw new Error('Match not found.');

    await tx.prepare("UPDATE matches SET status = 'FULL_TIME', confirmed_result = 1 WHERE id = ?").run(matchId);

    await updateAllStandings(tx);

    await tx.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, entity, entity_id, details)
      VALUES (?, ?, 'CONFIRM_MATCH_RESULT', 'MATCH', ?, ?)
    `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org', matchId, `Confirmed match result: ${match.score_a} - ${match.score_b}`);
  });

  return res.json({ success: true, message: 'Match result confirmed. Standings and statistics updated automatically.' });
});

export default router;
