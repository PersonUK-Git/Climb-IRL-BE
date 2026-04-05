import jwt from 'jsonwebtoken';
import DefaultTask from '../models/DefaultTask.js';
import Task from '../models/Task.js';

/**
 * Generate a JWT token for a user.
 * @param {string} id - The user ID.
 * @returns {string} - The JWT token.
 */
export const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET || 'secret';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

/**
 * Generate a 6-digit OTP code.
 * @returns {string}
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Handle user registration creation.
 * @param {Object} User - Mongoose User model
 * @param {Object} userData - Registration data (name, username, email, gender, dateOfBirth)
 * @returns {Promise<Object>} - The newly created User object
 */
export const registerUser = async (User: any, userData: any) => {
  const { email, username } = userData;
  
  // Extra safety check in service
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error(existingUser.email === email ? 'Email already exists' : 'Username already taken');
  }

  const user = await User.create({
    ...userData,
    totalXP: 0,
    level: 1,
    title: 'Newcomer'
  });

  // Assign Default Tasks to the new user
  const defaultTasks = await DefaultTask.find();
  if (defaultTasks.length > 0) {
    const tasksToCreate = defaultTasks.map((dt: any) => ({
      userId: user._id,
      title: dt.title,
      category: dt.category,
      difficulty: dt.difficulty,
      xpReward: dt.xpReward,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }));
    await Task.insertMany(tasksToCreate);
  }

  return user;
};


