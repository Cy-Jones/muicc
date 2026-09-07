import jwt from 'jsonwebtoken';
const token = jwt.sign(
  { managerId: 'e15cb674-a5df-4bec-b978-2f3385a20b62', nationId: 'e15cb674-a5df-4bec-b978-2f3385a20b62' },
  'miucc_manager_secret_2026',
  { expiresIn: '24h' }
);
console.log(token);
