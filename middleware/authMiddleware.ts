import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import type { AuthRequest } from '../utils/types.js';

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token!, process.env.JWT_SECRET as string) as JwtPayload;
      
      const user = await User.findById(decoded.id).select('-otp -otpExpires');
      
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      (req as AuthRequest).user = user;
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};


