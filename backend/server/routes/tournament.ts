import { db } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

router.get('/settings', async (req, res) => {
  const settings = await db.prepare('SELECT * FROM tournament_settings LIMIT 1').get();
  const nations = await db.prepare('SELECT * FROM participating_nations ORDER BY display_order ASC').all();
  return res.json({ settings, nations });
});

router.get('/summary', async (req, res) => {
  const teamsCount = (await db.prepare("SELECT COUNT(*) as count FROM teams WHERE status = 'APPROVED'").get() as any)?.count || 0;
  const playersCount = (await db.prepare("SELECT COUNT(*) as count FROM players WHERE status = 'APPROVED'").get() as any)?.count || 0;
  const matchesCount = (await db.prepare("SELECT COUNT(*) as count FROM matches").get() as any)?.count || 0;
  const completedMatchesCount = (await db.prepare("SELECT COUNT(*) as count FROM matches WHERE status = 'FULL_TIME'").get() as any)?.count || 0;
  const goalsCount = (await db.prepare("SELECT SUM(score_a + score_b) as total FROM matches WHERE status = 'FULL_TIME'").get() as any)?.total || 0;
  
  const upcomingMatch = await db.prepare(`
    SELECT m.*, ta.name as team_a_name, ta.logo_url as team_a_logo, tb.name as team_b_name, tb.logo_url as team_b_logo
    FROM matches m
    JOIN teams ta ON m.team_a_id = ta.id
    JOIN teams tb ON m.team_b_id = tb.id
    WHERE m.status IN ('SCHEDULED', 'LIVE')
    ORDER BY m.date ASC, m.time ASC
    LIMIT 1
  `).get();

  return res.json({
    teamsCount,
    playersCount,
    matchesCount,
    completedMatchesCount,
    goalsCount,
    upcomingMatch
  });
});

router.put('/settings', authenticateAdmin, async (req, res) => {
  const { name, full_name, host, start_date, end_date, status, tagline, secondary_tagline, max_predictions_per_match_day, rules } = req.body;
  
  // Target the single settings row by lookup rather than a hardcoded id: the
  // seed writes 'mulsu-icc-2026-config', so the previous literal
  // ('miucc-2026-config') matched nothing and the update silently did nothing
  // while still reporting success.
  //
  // COALESCE keeps any field the caller omits at its stored value, so a
  // partial save cannot blank out the rest of the tournament configuration.
  const current = await db.prepare('SELECT id FROM tournament_settings LIMIT 1').get() as any;
  if (!current) {
    return res.status(404).json({ error: 'Tournament settings have not been initialized.' });
  }

  const result = await db.prepare(`
    UPDATE tournament_settings
    SET name = COALESCE(?, name),
        full_name = COALESCE(?, full_name),
        host = COALESCE(?, host),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        tagline = COALESCE(?, tagline),
        secondary_tagline = COALESCE(?, secondary_tagline),
        max_predictions_per_match_day = COALESCE(?, max_predictions_per_match_day),
        rules = COALESCE(?, rules),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, full_name, host, start_date, end_date, status, tagline, secondary_tagline,
         max_predictions_per_match_day, rules, current.id);

  if (result.changes === 0) {
    return res.status(500).json({ error: 'Tournament settings could not be updated.' });
  }

  return res.json({ success: true, message: 'Tournament settings updated successfully.' });
});

export default router;
