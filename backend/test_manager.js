import jwt from 'jsonwebtoken';
import sqlite3 from 'better-sqlite3';

const db = new sqlite3('local.db');
const manager = db.prepare("SELECT * FROM team_managers WHERE email = 'manager@university.edu'").get();
const nation = db.prepare("SELECT * FROM participating_nations WHERE id = ?").get(manager.nation_id);

const token = jwt.sign(
  { id: manager.id, email: manager.email, nation_id: manager.nation_id, role: 'manager' },
  'change_me_in_production',
  { expiresIn: '7d' }
);
console.log(token);
