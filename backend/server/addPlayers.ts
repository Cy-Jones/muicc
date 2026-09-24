import { db } from './db.js';
import crypto from 'crypto';

async function generatePlayers() {
  console.log("Generating additional players for all teams...");
  try {
    const teams = await db.prepare('SELECT id, country FROM teams').all() as any[];

    for (const team of teams) {
      console.log(`Adding 4 players to team ${team.id}`);
      
      const posArr = ['DF', 'MF', 'FW', 'GK'];
      
      for (let i = 0; i < 4; i++) {
        const id = 'MULSU-P-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const fname = `TestPlayer ${team.id} ${i+1}`;
        const pos = posArr[i];
        
        // Random jersey number not conflicting with 1-10
        const jersey = Math.floor(Math.random() * 89) + 11;
        
        const player_id = 'P' + jersey + '-' + Math.floor(Math.random() * 1000);
        await db.prepare(`
          INSERT INTO players (id, player_id, team_id, full_name, dob, nationality, student_id, university, position, jersey_number, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')
        `).run(id, player_id, team.id, fname, '2000-01-01', team.country, 'SID'+jersey, 'MUI', pos, jersey);
      }
    }
    console.log("Added additional players successfully.");
  } catch(e) {
    console.error("Error:", e);
  }
}

generatePlayers().then(() => process.exit(0));
