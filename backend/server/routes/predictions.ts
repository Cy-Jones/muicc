import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

router.get('/status/:matchDayId', async (req, res) => {
  const matchDayId = req.params.matchDayId;
  const matchDay = await db.prepare('SELECT * FROM match_days WHERE id = ?').get(matchDayId) as any;

  if (!matchDay) {
    return res.status(404).json({ error: 'Match Day not found.' });
  }

  const countRow = (await db.prepare('SELECT COUNT(*) as count FROM predictions WHERE match_day_id = ?').get(matchDayId) as any)?.count || 0;
  const configRow = await db.prepare('SELECT max_predictions_per_match_day FROM tournament_settings LIMIT 1').get() as any;
  const maxLimit = configRow?.max_predictions_per_match_day || 20;

  let effectiveStatus = matchDay.prediction_status;
  if (countRow >= maxLimit) {
    effectiveStatus = 'FULL';
  }

  return res.json({
    matchDayId: matchDay.id,
    matchDayName: matchDay.name,
    date: matchDay.date,
    status: effectiveStatus,
    submittedCount: countRow,
    maxLimit,
    remainingSlots: Math.max(0, maxLimit - countRow)
  });
});

router.post('/submit', async (req, res) => {
  const { match_day_id, full_name, email, predicted_winner_team_id, predicted_score_a, predicted_score_b, predicted_champion_team_id } = req.body;

  if (!match_day_id || !full_name || !email) {
    return res.status(400).json({ error: 'Full name, email address, and Match Day selection are required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await db.transaction(async (tx) => {
      const matchDay = await tx.prepare('SELECT * FROM match_days WHERE id = ?').get(match_day_id) as any;
      if (!matchDay) {
        throw new Error('Selected Match Day does not exist.');
      }

      if (matchDay.prediction_status === 'CLOSED' || matchDay.prediction_status === 'NOT_OPEN') {
        throw new Error(`Predictions for ${matchDay.name} are currently ${matchDay.prediction_status}.`);
      }

      const settings = await tx.prepare('SELECT max_predictions_per_match_day FROM tournament_settings LIMIT 1').get() as any;
      const maxLimit = settings?.max_predictions_per_match_day || 20;

      const existingCountRow = (await tx.prepare('SELECT COUNT(*) as count FROM predictions WHERE match_day_id = ?').get(match_day_id) as any)?.count || 0;

      if (existingCountRow >= maxLimit) {
        await tx.prepare("UPDATE match_days SET prediction_status = 'FULL' WHERE id = ?").run(match_day_id);
        throw new Error('We are no longer accepting predictions for this Match Day. The maximum limit of 20 predictions has already been reached.');
      }

      const existingUserPred = await tx.prepare('SELECT id FROM predictions WHERE match_day_id = ? AND email_normalized = ?').get(match_day_id, normalizedEmail);
      if (existingUserPred) {
        throw new Error('You have already submitted a prediction for this Match Day.');
      }

      const totalPredsRow = (await tx.prepare('SELECT COUNT(*) as count FROM predictions').get() as any)?.count || 0;
      const predSeq = (totalPredsRow + 1).toString().padStart(4, '0');
      const predRef = `MULSU-PRED-${predSeq}`;
      const predId = crypto.randomUUID();

      await tx.prepare(`
        INSERT INTO predictions (
          id, prediction_ref, match_day_id, full_name, email, email_normalized,
          predicted_winner_team_id, predicted_score_a, predicted_score_b, predicted_champion_team_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        predId, predRef, match_day_id, full_name.trim(), email.trim(), normalizedEmail,
        predicted_winner_team_id || null,
        predicted_score_a !== undefined ? predicted_score_a : null,
        predicted_score_b !== undefined ? predicted_score_b : null,
        predicted_champion_team_id || null
      );

      const newCount = existingCountRow + 1;
      if (newCount >= maxLimit) {
        await tx.prepare("UPDATE match_days SET prediction_status = 'FULL' WHERE id = ?").run(match_day_id);
      }

      return {
        prediction_ref: predRef,
        matchDayName: matchDay.name,
        slotNumber: newCount,
        maxLimit
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Prediction submitted successfully!',
      details: result
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to submit prediction.' });
  }
});

router.get('/admin/all', authenticateAdmin, async (req, res) => {
  const { match_day_id, search } = req.query;

  let sql = `
    SELECT p.*, md.name as match_day_name,
           tw.name as predicted_winner_name, tc.name as predicted_champion_name
    FROM predictions p
    JOIN match_days md ON p.match_day_id = md.id
    LEFT JOIN teams tw ON p.predicted_winner_team_id = tw.id
    LEFT JOIN teams tc ON p.predicted_champion_team_id = tc.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (match_day_id) {
    sql += ` AND p.match_day_id = ?`;
    params.push(match_day_id);
  }
  if (search) {
    sql += ` AND (p.full_name LIKE ? OR p.email LIKE ? OR p.prediction_ref LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const predictions = await db.prepare(sql).all(...params);
  return res.json(predictions);
});

router.put('/admin/match-day/:id/status', authenticateAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['NOT_OPEN', 'OPEN', 'FULL', 'CLOSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid prediction status.' });
  }

  await db.prepare('UPDATE match_days SET prediction_status = ? WHERE id = ?').run(status, req.params.id);
  return res.json({ success: true, message: `Match Day prediction status set to ${status}.` });
});

router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  await db.prepare('DELETE FROM predictions WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Prediction entry deleted.' });
});

export default router;
