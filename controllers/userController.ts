import User from '../models/User.js';
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


