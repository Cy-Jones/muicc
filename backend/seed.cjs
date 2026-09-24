const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log("Seeding Database...");

// Clear all data
db.prepare('DELETE FROM matches').run();
db.prepare('DELETE FROM standings').run();
db.prepare('DELETE FROM group_teams').run();
db.prepare('DELETE FROM groups').run();
db.prepare('DELETE FROM players').run();
db.prepare('DELETE FROM teams').run();

// Insert Teams
const teams = [
  { id: '1', name: 'Tanzania Taifa Stars', country: 'Tanzania', logo_url: '' },
  { id: '2', name: 'Super Eagles FC', country: 'Nigeria', logo_url: '' },
  { id: '3', name: 'MULSU', country: 'Liberia', logo_url: '' },
  { id: '4', name: 'SSD', country: 'South Sudan', logo_url: '' },
  { id: '5', name: 'Eswatini FC', country: 'Eswatini', logo_url: '' },
  { id: '6', name: 'USAMU', country: 'Uganda', logo_url: '' },
  { id: '7', name: 'Zimbabwe Warriors', country: 'Zimbabwe', logo_url: '' },
];

const insertTeam = db.prepare('INSERT INTO teams (id, name, country, logo_url, status) VALUES (?, ?, ?, ?, ?)');
teams.forEach(t => insertTeam.run(t.id, t.name, t.country, t.logo_url, 'APPROVED'));

// Insert Groups
const grpAId = 'grpA';
const grpBId = 'grpB';
db.prepare('INSERT INTO groups (id, name) VALUES (?, ?)').run(grpAId, 'Group A');
db.prepare('INSERT INTO groups (id, name) VALUES (?, ?)').run(grpBId, 'Group B');

// Assign to groups
const insertGroupTeam = db.prepare('INSERT INTO group_teams (group_id, team_id, pot) VALUES (?, ?, ?)');
insertGroupTeam.run(grpAId, '1', 'POT_1');
insertGroupTeam.run(grpAId, '2', 'POT_2');
insertGroupTeam.run(grpAId, '3', 'POT_3');
insertGroupTeam.run(grpAId, '4', 'POT_4');

insertGroupTeam.run(grpBId, '5', 'POT_1');
insertGroupTeam.run(grpBId, '6', 'POT_2');
insertGroupTeam.run(grpBId, '7', 'POT_3');

// Initialize Standings
const insertStanding = db.prepare('INSERT INTO standings (id, group_id, team_id) VALUES (?, ?, ?)');
for (let i = 1; i <= 4; i++) insertStanding.run(`stA${i}`, grpAId, `${i}`);
for (let i = 5; i <= 7; i++) insertStanding.run(`stB${i}`, grpBId, `${i}`);

// Create Group Matches
const insertMatch = db.prepare(`
  INSERT INTO matches (id, group_id, team_a_id, team_b_id, match_type, match_code, status, score_a, score_b, confirmed_result)
  VALUES (?, ?, ?, ?, 'GROUP', ?, 'COMPLETED', ?, ?, 1)
`);

// Group A matches (Round robin: 1v2, 3v4, 1v3, 2v4, 1v4, 2v3)
let matchId = 1;
insertMatch.run(matchId++, grpAId, '1', '2', 'GRP-A-1', 2, 1);
insertMatch.run(matchId++, grpAId, '3', '4', 'GRP-A-2', 0, 0);
insertMatch.run(matchId++, grpAId, '1', '3', 'GRP-A-3', 3, 0);
insertMatch.run(matchId++, grpAId, '2', '4', 'GRP-A-4', 1, 1);
insertMatch.run(matchId++, grpAId, '1', '4', 'GRP-A-5', 0, 1);
insertMatch.run(matchId++, grpAId, '2', '3', 'GRP-A-6', 2, 0);

// Group B matches (1v2, 2v3, 1v3)
insertMatch.run(matchId++, grpBId, '5', '6', 'GRP-B-1', 1, 2);
insertMatch.run(matchId++, grpBId, '6', '7', 'GRP-B-2', 1, 1);
insertMatch.run(matchId++, grpBId, '5', '7', 'GRP-B-3', 0, 2);

// Create Knockout Matches Placeholders
const insertKoMatch = db.prepare(`
  INSERT INTO matches (id, match_type, match_code, status, team_a_id, team_b_id, score_a, score_b, confirmed_result)
  VALUES (?, 'KNOCKOUT', ?, ?, ?, ?, ?, ?, ?)
`);
insertKoMatch.run(matchId++, 'MIUCC-SF1', 'COMPLETED', '1', '6', 2, 1, 1);
insertKoMatch.run(matchId++, 'MIUCC-SF2', 'COMPLETED', '7', '2', 0, 1, 1);
insertKoMatch.run(matchId++, 'MIUCC-3RD', 'SCHEDULED', '6', '7', 0, 0, 0);
insertKoMatch.run(matchId++, 'MIUCC-FNL', 'SCHEDULED', '1', '2', 0, 0, 0);

console.log("Database seeded successfully.");
