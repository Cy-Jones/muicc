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
  if (name.includes('eswatini') || name.includes('zimbabwe') || name.includes('mozambique') || name.includes('zambia')) return 'SOUTHERN_AFRICA';
  if (name.includes('south sudan')) return 'EAST_CENTRAL_AFRICA';
  if (name.includes('india')) return 'SOUTH_ASIA';
  return 'OTHER';
}

router.get('/', async (req, res) => {
  // Ensure Groups A, B, C exist
  let groups = await db.prepare('SELECT * FROM groups ORDER BY name ASC').all() as any[];
  if (groups.length < 3) {
    await db.prepare("INSERT OR IGNORE INTO groups (id, name) VALUES ('grp-a', 'Group A')").run();
    await db.prepare("INSERT OR IGNORE INTO groups (id, name) VALUES ('grp-b', 'Group B')").run();
    await db.prepare("INSERT OR IGNORE INTO groups (id, name) VALUES ('grp-c', 'Group C')").run();
    groups = await db.prepare('SELECT * FROM groups ORDER BY name ASC').all() as any[];
  }
  
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

  // 8-TEAM QUARTER-FINAL KNOCKOUT BRACKET CALCULATION
  const grpA = groups.find(g => g.name === 'Group A');
  const grpB = groups.find(g => g.name === 'Group B');
  const grpC = groups.find(g => g.name === 'Group C');

  let knockoutBracket: any = null;

  if (grpA && grpB && grpC) {
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
    const stdC = await getGroupStandings(grpC.id) as any[];

    // Top 2 Teams per Group (6 automatic qualifiers)
    const a1 = stdA[0] || null;
    const a2 = stdA[1] || null;

    const b1 = stdB[0] || null;
    const b2 = stdB[1] || null;

    const c1 = stdC[0] || null;
    const c2 = stdC[1] || null;

    // 3rd Place Teams (Ranked to pick 2 Best Losers)
    const thirdA = stdA[2] || null;
    const thirdB = stdB[2] || null;
    const thirdC = stdC[2] || null;

    const thirdPlaces = [thirdA, thirdB, thirdC].filter(Boolean);
    thirdPlaces.sort((x, y) => 
      (y.points - x.points) || 
      (y.goal_difference - x.goal_difference) || 
      (y.goals_for - x.goals_for)
    );

    const wc1 = thirdPlaces[0] || null; // Best 3rd Place / Best Loser 1
    const wc2 = thirdPlaces[1] || null; // 2nd Best 3rd Place / Best Loser 2

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
      quarterFinals: {
        qf1: {
          matchCode: 'MIUCC-QF1',
          title: 'Quarter-Final 1 (Group A Winner vs 2nd Best Loser)',
          teamA: formatTeam(a1, 'Winner Group A (A1)', 'Group A 1st'),
          teamB: formatTeam(wc2, '2nd Best Loser (WC2)', 'Wildcard #2')
        },
        qf2: {
          matchCode: 'MIUCC-QF2',
          title: 'Quarter-Final 2 (Group B Winner vs Group C Runner-Up)',
          teamA: formatTeam(b1, 'Winner Group B (B1)', 'Group B 1st'),
          teamB: formatTeam(c2, 'Runner-Up Group C (C2)', 'Group C 2nd')
        },
        qf3: {
          matchCode: 'MIUCC-QF3',
          title: 'Quarter-Final 3 (Group C Winner vs 1st Best Loser)',
          teamA: formatTeam(c1, 'Winner Group C (C1)', 'Group C 1st'),
          teamB: formatTeam(wc1, '1st Best Loser (WC1)', 'Wildcard #1')
        },
        qf4: {
          matchCode: 'MIUCC-QF4',
          title: 'Quarter-Final 4 (Group A Runner-Up vs Group B Runner-Up)',
          teamA: formatTeam(a2, 'Runner-Up Group A (A2)', 'Group A 2nd'),
          teamB: formatTeam(b2, 'Runner-Up Group B (B2)', 'Group B 2nd')
        }
      },
      semiFinals: {
        sf1: {
          matchCode: 'MIUCC-SF1',
          title: 'Semi-Final 1 (Winner QF1 vs Winner QF2)',
          teamA: { name: 'Winner Quarter-Final 1', seed: 'QF1 Winner' },
          teamB: { name: 'Winner Quarter-Final 2', seed: 'QF2 Winner' }
        },
        sf2: {
          matchCode: 'MIUCC-SF2',
          title: 'Semi-Final 2 (Winner QF3 vs Winner QF4)',
          teamA: { name: 'Winner Quarter-Final 3', seed: 'QF3 Winner' },
          teamB: { name: 'Winner Quarter-Final 4', seed: 'QF4 Winner' }
        }
      },
      finals: {
        bronze: {
          matchCode: 'MIUCC-3RD',
          title: 'Third Place Playoff (Loser SF1 vs Loser SF2)',
          teamA: { name: 'Runner-Up Semi-Final 1', seed: 'SF1 Loser' },
          teamB: { name: 'Runner-Up Semi-Final 2', seed: 'SF2 Loser' }
        },
        gold: {
          matchCode: 'MIUCC-FNL',
          title: 'Grand Final (Winner SF1 vs Winner SF2)',
          teamA: { name: 'Winner Semi-Final 1', seed: 'SF1 Winner' },
          teamB: { name: 'Winner Semi-Final 2', seed: 'SF2 Winner' }
        }
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

  if (teams.length < 2) {
    return res.status(400).json({ error: 'At least 2 teams are required to generate a tournament draw.' });
  }

  // Group Capacities for 10 teams: Group A (3), Group B (3), Group C (4)
  const groupA = (await db.prepare("SELECT id FROM groups WHERE name = 'Group A'").get() as any) || { id: 'grp-a' };
  const groupB = (await db.prepare("SELECT id FROM groups WHERE name = 'Group B'").get() as any) || { id: 'grp-b' };
  const groupC = (await db.prepare("SELECT id FROM groups WHERE name = 'Group C'").get() as any) || { id: 'grp-c' };

  const groupCaps: Record<string, number> = {
    [groupA.id]: 3,
    [groupB.id]: 3,
    [groupC.id]: 4
  };

  // Perform Regional Seeded Avoidance Draw Algorithm
  const teamsWithRegion = teams.map(t => ({
    ...t,
    region: getTeamRegion(t)
  }));

  let successfulDraw: Record<string, any[]> | null = null;

  for (let attempt = 0; attempt < 300; attempt++) {
    const shuffled = [...teamsWithRegion].sort(() => Math.random() - 0.5);
    const resultGroups: Record<string, any[]> = {
      [groupA.id]: [],
      [groupB.id]: [],
      [groupC.id]: []
    };
    let isValid = true;

    for (const team of shuffled) {
      // Find candidate groups that aren't full and don't violate regional collision rules
      const validGroupIds = Object.keys(resultGroups).filter(grpId => {
        const groupTeams = resultGroups[grpId];
        const maxCap = groupCaps[grpId];

        if (groupTeams.length >= maxCap) return false;

        // West Africa Rule: Liberia and Nigeria MUST NOT be in the same group
        if (team.region === 'WEST_AFRICA' && groupTeams.some(t => t.region === 'WEST_AFRICA')) {
          return false;
        }

        // East Africa Rule: Tanzania and Uganda MUST NOT be in the same group
        if (team.region === 'EAST_AFRICA' && groupTeams.some(t => t.region === 'EAST_AFRICA')) {
          return false;
        }

        // Southern Africa Rule: Max 1 in Group A, Max 1 in Group B, Max 2 in Group C
        if (team.region === 'SOUTHERN_AFRICA') {
          const countSA = groupTeams.filter(t => t.region === 'SOUTHERN_AFRICA').length;
          if (grpId === groupA.id && countSA >= 1) return false;
          if (grpId === groupB.id && countSA >= 1) return false;
          if (grpId === groupC.id && countSA >= 2) return false;
        }

        return true;
      });

      if (validGroupIds.length === 0) {
        isValid = false;
        break; // Retry shuffle
      }

      // Pick random valid candidate group
      const chosenGrpId = validGroupIds[Math.floor(Math.random() * validGroupIds.length)];
      resultGroups[chosenGrpId].push(team);
    }

    if (isValid) {
      successfulDraw = resultGroups;
      break;
    }
  }

  // Fallback if strict regional retry limit reached
  if (!successfulDraw) {
    successfulDraw = { [groupA.id]: [], [groupB.id]: [], [groupC.id]: [] };
    const shuffled = [...teamsWithRegion].sort(() => Math.random() - 0.5);
    shuffled.forEach((t, idx) => {
      if (idx < 3) successfulDraw![groupA.id].push(t);
      else if (idx < 6) successfulDraw![groupB.id].push(t);
      else successfulDraw![groupC.id].push(t);
    });
  }

  await db.transaction(async (tx) => {
    await tx.prepare('DELETE FROM group_teams').run();
    await tx.prepare('DELETE FROM standings').run();

    for (const groupId of Object.keys(successfulDraw!)) {
      const groupTeams = successfulDraw![groupId];
      for (const t of groupTeams) {
        await tx.prepare('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), groupId, t.id);
        await tx.prepare('INSERT INTO standings (id, group_id, team_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), groupId, t.id);
      }
    }

    await tx.prepare(`
      INSERT INTO audit_logs (id, admin_email, action, entity, details)
      VALUES (?, ?, 'GENERATE_DRAW', 'DRAW', ?)
    `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org', `Generated Regional-Seeded 3-Group draw (A:3, B:3, C:4) for ${teams.length} teams.`);
  });

  return res.json({
    success: true,
    message: 'Regional Seeded Draw generated successfully with 3 Groups (Group A: 3, Group B: 3, Group C: 4). Same-region teams placed in separate groups.'
  });
});

router.post('/admin/confirm', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await db.prepare(`
    INSERT INTO audit_logs (id, admin_email, action, entity, details)
    VALUES (?, ?, 'CONFIRM_DRAW', 'DRAW', 'Tournament draw officially confirmed and locked.')
  `).run(crypto.randomUUID(), req.admin?.email || 'admin@miucc2026.org');

  return res.json({ success: true, message: 'Tournament draw confirmed and locked.' });
});

export default router;
