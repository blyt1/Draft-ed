import express, { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import { createAccessToken, getPasswordHash, verifyPassword } from '../utils/jwt';
import { UserCreate, UserLogin, Token, UserResponse } from '../models/types';

const router = express.Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as UserCreate;

    if (!username || !email || !password) {
      return res.status(400).json({ detail: 'Username, email, and password are required' });
    }

    const db = getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ detail: 'User with this username or email already exists' });
    }

    // Create new user
    const hashedPassword = getPasswordHash(password);
    const newUser = {
      username,
      email,
      hashed_password: hashedPassword,
      created_at: new Date()
    };

    const result = await db.collection('users').insertOne(newUser);
    
    // Create default "All Beers" list
    await db.collection('beer_lists').insertOne({
      user_id: result.insertedId,
      name: 'All Beers',
      beers: [],
      created_at: new Date()
    });

    const userResponse: UserResponse = {
      _id: result.insertedId.toString(),
      username,
      email,
      created_at: newUser.created_at
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as UserLogin;

    if (!username || !password) {
      return res.status(400).json({ detail: 'Username and password are required' });
    }

    const db = getDatabase();
    const user = await db.collection('users').findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ detail: 'Incorrect username or password' });
    }

    // Handle both password field names for backward compatibility with Python backend
    const storedPasswordHash = user.hashed_password || user.password_hash;
    
    if (!storedPasswordHash || !verifyPassword(password, storedPasswordHash)) {
      return res.status(401).json({ detail: 'Incorrect username or password' });
    }

    const accessToken = createAccessToken({ sub: user._id.toString() });
    const tokenResponse: Token = {
      access_token: accessToken,
      token_type: 'bearer'
    };

    res.json(tokenResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
