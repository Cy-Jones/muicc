import {Response} from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';

const router = asyncRouter();

// Helper to determine region of a team or country
function getTeamRegion(team: any): string {
  const name = (team.country || team.name || '').toLowerCase();
  if (name.includes('liberia') || name.includes('nigeria')) return 'WEST_AFRICA';
  if (name.includes('tanzania') || name.includes('uganda')) return 'EAST_AFRICA';
  if (name.includes('eswatini') || name.includes('zimbabwe') ) return 'SOUTHERN_AFRICA';
  if (name.includes('south sudan')) return 'EAST_CENTRAL_AFRICA';
  return 'OTHER';
}

router.get('/', async (req, res) => {
  // Ensure Groups A, B exist
  let groups = await db.prepare('SELECT * FROM groups ORDER BY name ASC').all() as any[];
  if (groups.length < 2) {
    await db.prepare("INSERT OR IGNORE INTO groups (id, name) VALUES ('grp-a', 'Group A')").run();
    await db.prepare("INSERT OR IGNORE INTO groups (id, name) VALUES ('grp-b', 'Group B')").run();
    groups = await db.prepare('SELECT * FROM groups ORDER BY name ASC').all() as any[];
  }
  
  // Clean up Group C if it exists in DB just in case
  await db.prepare("DELETE FROM groups WHERE name = 'Group C'").run();
  groups = groups.filter(g => g.name !== 'Group C');
  
  const drawData: any[] = [];
  for (const g of groups) {
    const teams = await db.prepare(`
      SELECT t.id, t.name, t.logo_url, t.country, t.university
      FROM group_teams gt
      JOIN teams t ON gt.team_id = t.id
      WHERE gt.group_id = ?
    `).all(g.id);

    drawData.push({
      group: g,
      teams
    });
  }

  // KNOCKOUT BRACKET: use the actual SEMI_FINAL match records as the source of truth.
  // Do NOT derive the displayed semifinal pairings from current group standings once
  // semifinal fixtures have been created in the Matches module.
  let knockoutBracket: any = null;

  const semifinalMatches = await db.prepare(`
    SELECT
      m.id,
      m.match_code,
      m.date,
      m.time,
      m.status,
      m.score_a,
      m.score_b,
      ta.name as team_a_name,
      ta.logo_url as team_a_logo,
      ta.country as team_a_country,
      tb.name as team_b_name,
      tb.logo_url as team_b_logo,
      tb.country as team_b_country
    FROM matches m
    JOIN teams ta ON m.team_a_id = ta.id
    JOIN teams tb ON m.team_b_id = tb.id
    WHERE m.stage = 'SEMI_FINAL'
    ORDER BY m.date ASC, m.time ASC
    LIMIT 2
  `).all() as any[];

  const formatMatch = (m: any) => m ? ({
    matchCode: m.match_code,
    team_a_name: m.team_a_name,
    team_a_logo: m.team_a_logo,
    team_a_country: m.team_a_country,
    team_b_name: m.team_b_name,
    team_b_logo: m.team_b_logo,
    team_b_country: m.team_b_country,
    score_a: m.score_a,
    score_b: m.score_b,
    status: m.status
  }) : {
    matchCode: null,
    team_a_name: 'TBD',
    team_b_name: 'TBD',
    score_a: 0,
    score_b: 0,
    status: 'SCHEDULED'
  };

  // The first two SEMI_FINAL fixtures are the two semifinal slots shown on
  // the public bracket. Their team pairings come directly from the matches table.
  const sf1 = formatMatch(semifinalMatches[0]);
  const sf2 = formatMatch(semifinalMatches[1]);

  // The final/third-place slots remain placeholders until the semifinal
  // results are confirmed. This prevents the bracket from inventing winners.
  const winnerName = (m: any, label: string) => {
    if (m?.status === 'FULL_TIME' || m?.status === 'COMPLETED') {
      if (Number(m.score_a) > Number(m.score_b)) return m.team_a_name;
      if (Number(m.score_b) > Number(m.score_a)) return m.team_b_name;
    }
    return label;
  };

  knockoutBracket = {
    quarterFinals: [],
    semiFinals: [sf1, sf2],
    final: {
      matchCode: null,
      title: 'Grand Final (Winner SF1 vs Winner SF2)',
      team_a_name: winnerName(semifinalMatches[0], 'Semi-final Winner 1'),
      team_a_country: null,
      team_a_logo: null,
      team_b_name: winnerName(semifinalMatches[1], 'Semi-final Winner 2'),
      team_b_country: null,
      team_b_logo: null
    }
  };

  const isLocked = ((await db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action = 'CONFIRM_DRAW'").get() as any)?.count || 0) > 0;

  return res.json({ draw: drawData, isLocked, knockoutBracket });
});

router.post('/admin/generate', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  // Fetch all approved teams (or all teams if less than 10 approved)
  let teams = await db.prepare("SELECT id, name, country FROM teams WHERE status = 'APPROVED'").all() as any[];
  if (teams.length === 0) {
    teams = await db.prepare("SELECT id, name, country FROM teams").all() as any[];
  }

  const groupA = (await db.prepare("SELECT id FROM groups WHERE name = 'Group A'").get() as any) || { id: 'grp-a' };
  const groupB = (await db.prepare("SELECT id FROM groups WHERE name = 'Group B'").get() as any) || { id: 'grp-b' };

  const groupACountries = ['Liberia', 'Nigeria', 'Tanzania', 'South Sudan'];
  const groupBCountries = ['Uganda', 'Eswatini', 'Zimbabwe'];

  const successfulDraw: Record<string, any[]> = {
    [groupA.id]: [],
    [groupB.id]: []
  };

  for (const team of teams) {
    // We match by checking if the team's country string contains the target country name
    if (groupACountries.some(c => team.country.toLowerCase().includes(c.toLowerCase()))) {
      successfulDraw[groupA.id].push(team);
    } else if (groupBCountries.some(c => team.country.toLowerCase().includes(c.toLowerCase()))) {
      successfulDraw[groupB.id].push(team);
    }
  }

  await db.transaction(async (tx) => {
    // Delete old groupings and standings
    await tx.prepare('DELETE FROM group_teams').run();
    await tx.prepare('DELETE FROM standings').run();

    // Assign new groupings
    for (const groupId of Object.keys(successfulDraw)) {
      const groupTeams = successfulDraw[groupId];
      for (const t of groupTeams) {
        await tx.prepare('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), groupId, t.id);
        await tx.prepare('INSERT INTO standings (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), groupId, t.id);
      }
    }

    // Ensure we delete Group C if it exists to clean up
    await tx.prepare("DELETE FROM groups WHERE name = 'Group C'").run();

    await tx.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, entity, details)
      VALUES (?, ?, 'GENERATE_DRAW', 'DRAW', ?)
    `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org', `Applied manual 2-Group draw (A:4, B:3) for ${teams.length} teams.`);
  });

  return res.json({
    success: true,
    message: 'Manual Draw applied successfully with 2 Groups (Group A: 4, Group B: 3).'
  });
});

router.post('/admin/confirm', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await db.prepare(`
    INSERT INTO audit_logs (id, admin_email, action, entity, details)
    VALUES (?, ?, 'CONFIRM_DRAW', 'DRAW', 'Tournament draw officially confirmed and locked.')
  `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org');

  return res.json({ success: true, message: 'Tournament draw confirmed and locked.' });
});

router.post('/admin/unlock', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await db.prepare(`DELETE FROM audit_logs WHERE action = 'CONFIRM_DRAW'`).run();
  
  await db.prepare(`
    INSERT INTO audit_logs (id, admin_email, action, entity, details)
    VALUES (?, ?, 'UNLOCK_DRAW', 'DRAW', 'Tournament draw was manually unlocked by admin.')
  `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org');

  return res.json({ success: true, message: 'Tournament draw unlocked successfully.' });
});

export default router;
