import { db } from '../db.js';
import { asyncRouter } from '../middleware/asyncRouter.js';
import { memoryCache } from '../middleware/memoryCache.js';

const router = asyncRouter();

// Public: Get Standings by Group & Top Scorers / Assists (cached for 30 seconds)
router.get('/', memoryCache(30, 'standings'), async (req, res) => {
  const groups = await db.prepare('SELECT * FROM groups ORDER BY name ASC').all() as any[];
  
  const standingsByGroup: any[] = [];
  for (const g of groups) {
    const table = await db.prepare(`
      SELECT s.*, t.name as team_name, t.logo_url as team_logo, t.country as team_country, t.university
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      WHERE s.group_id = ?
      ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, t.name ASC
    `).all(g.id);

    standingsByGroup.push({
      group: g,
      table: table.map((item: any, idx: number) => ({ ...item, position: idx + 1 }))
    });
  }

  // Top Scorers & Top Assists using pre-aggregated Common Table Expressions (CTEs)
  // Replaces 1,600+ correlated table scans with a single pass over match_events.
  const topScorers = await db.prepare(`
    WITH goal_counts AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL'
        AND me.is_own_goal = 0
        AND COALESCE(m.is_test_mode, 0) = 0
      GROUP BY me.player_id
    ),
    assist_counts AS (
      SELECT me.secondary_player_id as player_id, COUNT(*) as assists
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL'
        AND me.is_own_goal = 0
        AND COALESCE(m.is_test_mode, 0) = 0
        AND me.secondary_player_id IS NOT NULL
      GROUP BY me.secondary_player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      COALESCE(gc.goals, 0) as goals,
      COALESCE(ac.assists, 0) as assists
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN goal_counts gc ON gc.player_id = p.id
    LEFT JOIN assist_counts ac ON ac.player_id = p.id
    WHERE p.status = 'APPROVED'
      AND COALESCE(gc.goals, 0) > 0
    ORDER BY goals DESC, assists DESC, p.full_name ASC
  `).all() as any[];

  // Top Playmakers / Assists (sorted by assists DESC, then goals DESC)
  const topAssists = await db.prepare(`
    WITH goal_counts AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL'
        AND me.is_own_goal = 0
        AND COALESCE(m.is_test_mode, 0) = 0
      GROUP BY me.player_id
    ),
    assist_counts AS (
      SELECT me.secondary_player_id as player_id, COUNT(*) as assists
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL'
        AND me.is_own_goal = 0
        AND COALESCE(m.is_test_mode, 0) = 0
        AND me.secondary_player_id IS NOT NULL
      GROUP BY me.secondary_player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      COALESCE(gc.goals, 0) as goals,
      COALESCE(ac.assists, 0) as assists
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN goal_counts gc ON gc.player_id = p.id
    LEFT JOIN assist_counts ac ON ac.player_id = p.id
    WHERE p.status = 'APPROVED'
      AND COALESCE(ac.assists, 0) > 0
    ORDER BY assists DESC, goals DESC, p.full_name ASC
  `).all() as any[];

  // Semi-Final Scorers
  const semiFinalScorers = await db.prepare(`
    WITH sf_goals AS (
      SELECT me.player_id, COUNT(*) as goals
      FROM match_events me
      JOIN matches m ON me.match_id = m.id
      WHERE me.event_type = 'GOAL'
        AND me.is_own_goal = 0
        AND m.stage = 'SEMI_FINAL'
      GROUP BY me.player_id
    )
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      sfg.goals
    FROM players p
    JOIN teams t ON p.team_id = t.id
    JOIN sf_goals sfg ON sfg.player_id = p.id
    WHERE p.status = 'APPROVED'
    ORDER BY sfg.goals DESC, p.full_name ASC
  `).all() as any[];

  // Finals & Third Place Matches
  const finalsMatches = await db.prepare(`
    SELECT m.id, m.stage, m.status, m.score_a, m.score_b, m.penalty_a, m.penalty_b, m.date, m.time,
           ta.name as team_a_name, tb.name as team_b_name,
           ta.logo_url as team_a_logo, tb.logo_url as team_b_logo,
           ta.country as team_a_country, tb.country as team_b_country
    FROM matches m
    JOIN teams ta ON m.team_a_id = ta.id
    JOIN teams tb ON m.team_b_id = tb.id
    WHERE m.stage IN ('FINAL', 'THIRD_PLACE')
    ORDER BY m.date ASC, m.time ASC
  `).all() as any[];

  return res.json({
    standings: standingsByGroup,
    topScorers,
    topAssists,
    semiFinalScorers,
    finalsMatches
  });
});

export default router;
