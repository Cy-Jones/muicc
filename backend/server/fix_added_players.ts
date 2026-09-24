import { db } from './db.js';

const indianNames = [
  "Rahul Sharma", "Amit Singh", "Rajesh Kumar", "Vikram Patel",
  "Sandeep Mishra", "Pooja Desai", "Sunil Reddy", "Ravi Verma",
  "Anil Gupta", "Sanjay Joshi", "Deepak Tiwari", "Karan Yadav",
  "Prakash Chauhan", "Gaurav Agarwal", "Rakesh Bhatia", "Nitin Das",
  "Manoj Nair", "Vivek Menon", "Ashish Jain", "Tarun Kapoor",
  "Rohan Bhatt", "Varun Thakur", "Ajay Pandey", "Kunal Prasad",
  "Vijay Rao", "Yash Bhagat", "Mohit Ahuja", "Naveen Raj",
  "Prashant Shetty", "Dinesh Kulkarni"
];

async function fixPlayers() {
  console.log("Fixing test players...");
  try {
    // Get the highest player_id number to increment from
    const result = await db.prepare("SELECT player_id FROM players WHERE player_id LIKE 'MULSU-PLY-%' ORDER BY player_id DESC LIMIT 1").get() as any;
    
    let lastIdNum = 2030;
    if (result && result.player_id) {
      const match = result.player_id.match(/MULSU-PLY-(\d+)/);
      if (match) {
        lastIdNum = parseInt(match[1], 10);
      }
    }

    const playersToFix = await db.prepare("SELECT id FROM players WHERE full_name LIKE 'TestPlayer%'").all() as any[];

    for (let i = 0; i < playersToFix.length; i++) {
      const player = playersToFix[i];
      const newId = `MULSU-PLY-${lastIdNum + i + 1}`;
      const newName = indianNames[i % indianNames.length];
      
      await db.prepare("UPDATE players SET player_id = ?, full_name = ? WHERE id = ?").run(newId, newName, player.id);
    }
    
    console.log(`Fixed ${playersToFix.length} players successfully.`);
  } catch(e) {
    console.error("Error:", e);
  }
}

fixPlayers().then(() => process.exit(0));
