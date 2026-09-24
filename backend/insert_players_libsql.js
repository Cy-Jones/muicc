import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:./local.db'
});

async function run() {
  console.log("Adding 10 players to each team...");
  const rs = await client.execute('SELECT id, university, country FROM teams');
  const teams = rs.rows;
  
  let playerIdCounter = 2000;
  for (const team of teams) {
    for (let i = 1; i <= 10; i++) {
      const pId = `p${playerIdCounter++}`;
      await client.execute({
        sql: 'INSERT INTO players (id, player_id, team_id, full_name, dob, nationality, student_id, university, position, jersey_number, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          pId, 
          pId,
          team.id, 
          `Player ${i} (Team ${team.id})`, 
          '2000-01-01',
          team.country,
          `STU-${pId}`,
          team.university,
          'MIDFIELDER', 
          i, 
          'APPROVED'
        ]
      });
    }
  }
  console.log("Done adding players.");
}
run().catch(console.error);
