import { db } from './server/db.js';

async function run() {
  const teams = await db.prepare("SELECT id, name, country FROM teams WHERE status = 'APPROVED'").all() as any[];
  const groupA = await db.prepare("SELECT id FROM groups WHERE name = 'Group A'").get() as any;
  const groupB = await db.prepare("SELECT id FROM groups WHERE name = 'Group B'").get() as any;
  
  const groupACountries = ['Liberia', 'Nigeria', 'Tanzania', 'South Sudan'];
  const groupBCountries = ['Uganda', 'Eswatini', 'Zimbabwe'];
  
  for (const team of teams) {
    let gId = null;
    if (groupACountries.some(c => team.country.toLowerCase().includes(c.toLowerCase()))) gId = groupA.id;
    else if (groupBCountries.some(c => team.country.toLowerCase().includes(c.toLowerCase()))) gId = groupB.id;
    
    if (gId) {
      await db.prepare('INSERT INTO group_teams (id, group_id, team_id) VALUES (?, ?, ?)').run(
        team.id + '-gt', gId, team.id
      );
    }
  }
}
run();
