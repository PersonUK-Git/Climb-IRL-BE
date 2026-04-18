import type { Request, Response } from 'express';
import User from '../models/User.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';
import { calculateUserAchievements } from '../services/achievementService.js';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpires');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const achievements = await calculateUserAchievements(user);
    res.status(200).json(achievements);
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

interface UpdateProfileBody {
  name?: string;
  username?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: Date;
}

export const updateProfile = async (req: Request<{}, {}, UpdateProfileBody>, res: Response) => {
  const { name, username, avatarUrl, gender, dateOfBirth } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (name) user.name = name;
      if (username) user.username = username;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      if (gender) user.gender = gender;
      if (dateOfBirth) user.dateOfBirth = dateOfBirth;

      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  const userId = req.user._id;

  const performDeletion = async (session: mongoose.ClientSession | null) => {
    const options = session ? { session } : {};
    
    // 1. Delete all tasks
    await Task.deleteMany({ userId }, options);
    
    // 2. Delete the user
    const result = await User.deleteOne({ _id: userId }, options);
    
    if (result.deletedCount === 0) {
      throw new Error('User not found or already deleted');
    }
  };

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    await performDeletion(session);

    await session.commitTransaction();
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    const err = error as Error & { code?: number };
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    const isTransactionError = err.message.includes('Transaction numbers are only allowed') || 
                               err.code === 20 ||
                               err.message.includes('not supported in transactions');

    if (isTransactionError) {
      console.log('NOTICE: Standalone MongoDB detected. Deleting account without transaction.');
      try {
        await performDeletion(null);
        return res.status(200).json({ message: 'Account deleted successfully' });
      } catch (retryError) {
        const retryErr = retryError as Error;
        return res.status(500).json({ message: retryErr.message || 'Server error during deletion' });
      }
    }

    res.status(500).json({ message: err.message || 'Server error during deletion' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};



