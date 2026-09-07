import { db } from '../db.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

// Public: Get Standings by Group & Top Scorers / Assists
router.get('/', async (req, res) => {
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

  // Top Goalscorers (sorted by goals DESC, then assists DESC)
  const topScorers = await db.prepare(`
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      COUNT(CASE WHEN me.event_type = 'GOAL' THEN 1 END) as goals,
      COUNT(CASE WHEN me.event_type = 'ASSIST' THEN 1 END) as assists
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN match_events me ON me.player_id = p.id
    WHERE p.status = 'APPROVED'
    GROUP BY p.id
    ORDER BY goals DESC, assists DESC, p.full_name ASC
    LIMIT 10
  `).all() as any[];

  // Top Playmakers / Assists (sorted by assists DESC, then goals DESC)
  const topAssists = await db.prepare(`
    SELECT 
      p.id, p.player_id, p.full_name, p.photo_url, p.position, p.jersey_number,
      t.name as team_name, t.logo_url as team_logo, t.country as team_country,
      COUNT(CASE WHEN me.event_type = 'ASSIST' THEN 1 END) as assists,
      COUNT(CASE WHEN me.event_type = 'GOAL' THEN 1 END) as goals
    FROM players p
    JOIN teams t ON p.team_id = t.id
    LEFT JOIN match_events me ON me.player_id = p.id
    WHERE p.status = 'APPROVED'
    GROUP BY p.id
    ORDER BY assists DESC, goals DESC, p.full_name ASC
    LIMIT 10
  `).all() as any[];

  return res.json({
    standings: standingsByGroup,
    topScorers,
    topAssists
  });
});

export default router;
