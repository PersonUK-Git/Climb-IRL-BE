import User from '../models/User.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';
import { calculateUserAchievements } from '../services/achievementService.js';

export const getProfile = async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user._id).select('-otp -otpExpires');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserAchievements = async (req: any, res: any) => {
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

export const updateProfile = async (req: any, res: any) => {
  const { name, username, avatarUrl, gender, dateOfBirth } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.username = username || user.username;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.gender = gender || user.gender;
      user.dateOfBirth = dateOfBirth || user.dateOfBirth;

      const updatedUser = await user.save();
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProfile = async (req: any, res: any) => {
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
  } catch (err: any) {
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
      } catch (retryErr: any) {
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



