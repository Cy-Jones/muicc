import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config.js';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
  manager?: {
    id: string;
    email: string;
    nation_id: string;
  };
}
export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Admin token required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string; role?: string };
    if (decoded.role === 'manager') {
      return res.status(403).json({ error: 'Forbidden. Admin role required.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
}

export function authenticateManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Manager token required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string; nation_id: string; role: string };
    if (decoded.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden. Manager role required.' });
    }
    req.manager = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired manager token.' });
  }
}
