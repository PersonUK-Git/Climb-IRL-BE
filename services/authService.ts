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
/**
 * Internal helper to handle the actual creation of user and tasks.
 * Can be run with or without a transaction session.
 */
async function _performRegistration(User: Model<IUser>, userData: IRegisterData, session: mongoose.ClientSession | null): Promise<IUser> {
  const options = session ? { session } : {};

  // 1. Create User
  const createdUsers = await User.create([{
    ...userData,
    totalXP: 0,
    level: 1,
    title: 'Newcomer'
  }], options);
  
  const user = createdUsers[0];
  if (!user) {
    throw new Error('User creation failed');
  }

  const userId = user._id;

  // 2. Assign Default Tasks
  const tasksQuery = DefaultTask.find();
  if (session) {
    tasksQuery.session(session);
  }
  const defaultTasks = await tasksQuery;

  if (defaultTasks.length > 0) {
    const tasksToCreate = defaultTasks.map((dt: any) => ({
      userId: userId,
      title: dt.title,
      category: dt.category,
      difficulty: dt.difficulty,
      xpReward: dt.xpReward,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }));
    
    await Task.insertMany(tasksToCreate, options);
  }

  return user;
}

/**
 * Handle user registration creation.
 * Attempts to use a transaction, but falls back to non-transactional for standalone MongoDB.
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

  let session: mongoose.ClientSession | null = null;
  let user: IUser | undefined;

  try {
    // Attempt with transaction
    session = await mongoose.startSession();
    session.startTransaction();
    
    user = await _performRegistration(User, userData, session);
    
    await session.commitTransaction();
    return user;
  } catch (error: any) {
    // Check if this is the "No Transactions" error
    const isTransactionError = error.message.includes('Transaction numbers are only allowed') || 
                               error.code === 20 ||
                               error.message.includes('not supported in transactions');

    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    if (isTransactionError) {
      console.log('NOTICE: MongoDB Transactions not supported. Retrying in Compatibility Mode...');
      // Reset user state and retry without transaction
      try {
        return await _performRegistration(User, userData, null);
      } catch (retryError) {
        // Fallback Compensation: Manually cleanup if something fails in non-trans mode
        const createdUser = await User.findOne({ email: userData.email });
        if (createdUser) {
          await User.deleteOne({ _id: createdUser._id });
        }
        throw retryError;
      }
    }
    
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};




