import jwt from 'jsonwebtoken';
import mongoose, { Model } from 'mongoose';
import DefaultTask from '../models/DefaultTask.js';
import Task from '../models/Task.js';
import type { IUser } from '../models/User.js';

/**
 * Generate a JWT token for a user.
 * @param {string} id - The user ID.
 * @returns {string} - The JWT token.
 */
export const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables.');
    throw new Error('Internal Server Error: Missing security configuration');
  }
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

/**
 * Generate a 6-digit OTP code.
 * @returns {string}
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export interface IRegisterData {
  name: string;
  username: string;
  email: string;
  gender?: string;
  dateOfBirth?: Date;
}

/**
 * Handle user registration creation.
 * @param {Model<IUser>} User - Mongoose User model
 * @param {IRegisterData} userData - Registration data
 * @returns {Promise<IUser>} - The newly created User object
 */
export const registerUser = async (User: Model<IUser>, userData: IRegisterData): Promise<IUser> => {
  const { email, username } = userData;
  
  // Extra safety check in service
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new Error(existingUser.email === email ? 'Email already exists' : 'Username already taken');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let user: IUser | undefined;
  try {
    // 1. Create User within the transaction
    // Note: User.create(docs, options) returns an array when docs is an array
    const createdUsers = await User.create([{
      ...userData,
      totalXP: 0,
      level: 1,
      title: 'Newcomer'
    }], { session });
    
    user = createdUsers[0];
    if (!user) {
      throw new Error('User creation failed');
    }

    const userId = user._id;

    // 2. Assign Default Tasks within the transaction
    const defaultTasks = await DefaultTask.find().session(session);
    if (defaultTasks.length > 0) {
      const tasksToCreate = defaultTasks.map((dt: any) => ({
        userId: userId,
        title: dt.title,
        category: dt.category,
        difficulty: dt.difficulty,
        xpReward: dt.xpReward,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }));
      await Task.insertMany(tasksToCreate, { session });
    }

    await session.commitTransaction();
    
    if (!user) {
      throw new Error('User creation failed');
    }
    
    return user;
  } catch (error) {
    // Abort the transaction on any error
    await session.abortTransaction();
    
    // Fallback Compensation: If user was created but transaction didn't roll back 
    // (e.g., due to DB not supporting transactions), manually delete the user.
    if (user && user._id) {
      try {
        await User.deleteOne({ _id: user._id });
      } catch (compensationError) {
        console.error('Compensation failed during registration cleanup:', compensationError);
      }
    }
    
    throw error;
  } finally {
    session.endSession();
  }
};


