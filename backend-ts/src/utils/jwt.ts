import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24 hours

export const verifyPassword = (plainPassword: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

export const getPasswordHash = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

export const createAccessToken = (data: { sub: string }, expiresIn?: string): string => {
  const payload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + (60 * ACCESS_TOKEN_EXPIRE_MINUTES)
  };
  return jwt.sign(payload, SECRET_KEY, { algorithm: ALGORITHM });
};

export const decodeAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch (error) {
    return null;
  }
}; 