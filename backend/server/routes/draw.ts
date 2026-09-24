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

  // 4-TEAM SEMI-FINAL KNOCKOUT BRACKET CALCULATION
  const grpA = groups.find(g => g.name === 'Group A');
  const grpB = groups.find(g => g.name === 'Group B');

  let knockoutBracket: any = null;

  if (grpA && grpB) {
    const getGroupStandings = async (groupId: string) => {
      return await db.prepare(`
        SELECT s.*, t.name as team_name, t.logo_url as team_logo, t.country as team_country
        FROM standings s
        JOIN teams t ON s.team_id = t.id
        WHERE s.group_id = ?
        ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, t.name ASC
      `).all(groupId) as any[];
    };

    const stdA = await getGroupStandings(grpA.id) as any[];
    const stdB = await getGroupStandings(grpB.id) as any[];

    // Top 2 Teams per Group (4 automatic qualifiers)
    const a1 = stdA[0] || null;
    const a2 = stdA[1] || null;

    const b1 = stdB[0] || null;
    const b2 = stdB[1] || null;

    const formatTeam = (teamObj: any, fallbackName: string, seedLabel: string) => {
      if (teamObj) {
        return {
          name: teamObj.team_name,
          logo: teamObj.team_logo,
          country: teamObj.team_country,
          seed: seedLabel
        };
      }
      return { name: fallbackName, seed: seedLabel };
    };

    knockoutBracket = {
      quarterFinals: [],
      semiFinals: [
        {
          matchCode: 'MIUCC-SF1',
          title: 'Semi-Final 1 (Group A Winner vs Group B Runner-Up)',
          teamA: formatTeam(a1, 'Winner Group A (A1)', 'Group A 1st'),
          teamB: formatTeam(b2, 'Runner-Up Group B (B2)', 'Group B 2nd')
        },
        {
          matchCode: 'MIUCC-SF2',
          title: 'Semi-Final 2 (Group B Winner vs Group A Runner-Up)',
          teamA: formatTeam(b1, 'Winner Group B (B1)', 'Group B 1st'),
          teamB: formatTeam(a2, 'Runner-Up Group A (A2)', 'Group A 2nd')
        }
      ],
      final: {
        matchCode: 'MIUCC-FNL',
        title: 'Grand Final (Winner SF1 vs Winner SF2)',
        teamA: { name: 'Winner Semi-Final 1', seed: 'SF1 Winner' },
        teamB: { name: 'Winner Semi-Final 2', seed: 'SF2 Winner' }
      }
    };
  }

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
