import {Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncRouter } from '../middleware/asyncRouter.js';
import { getJwtSecret } from '../config.js';

const router = asyncRouter();


router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const admin = await db.prepare('SELECT * FROM admins WHERE email = ?').get(email.trim().toLowerCase()) as any;
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    admin: {
      id: admin.id,
      email: admin.email
    }
  });
});

router.get('/me', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ admin: req.admin });
});

export default router;
