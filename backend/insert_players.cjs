const Database = require('better-sqlite3');
const db = new Database('local.db');

console.log("Adding 10 players to each team...");

const insertPlayer = db.prepare('INSERT INTO players (id, team_id, name, jersey_number, position, status) VALUES (?, ?, ?, ?, ?, ?)');

const teams = db.prepare('SELECT id FROM teams').all();

let playerIdCounter = 1000;
teams.forEach(team => {
  for (let i = 1; i <= 10; i++) {
    insertPlayer.run(
      `p${playerIdCounter++}`, 
      team.id, 
      `Player ${i} (Team ${team.id})`, 
      i, 
      'MIDFIELDER', 
      'APPROVED'
    );
  }
});

console.log("Done adding players.");
