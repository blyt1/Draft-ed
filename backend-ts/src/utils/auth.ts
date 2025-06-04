import { Request, Response, NextFunction } from 'express';
import { decodeAccessToken } from './jwt';
import { getDatabase } from '../config/database';
import { ObjectId } from 'mongodb';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const payload = decodeAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub) });
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}; 