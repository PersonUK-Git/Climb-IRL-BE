import mongoose from 'mongoose';
import DefaultTask from '../models/DefaultTask.js';
import type { IDefaultTask } from '../models/DefaultTask.js';
import Task from '../models/Task.js';
import type { ITask } from '../models/Task.js';
import type { IUser } from '../models/User.js';

/**
 * Resets daily rerolls if a new local day has started.
 */
export const resetRerollsIfNeeded = (user: IUser, timezoneOffset: number = 0): boolean => {
  const now = new Date();
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));
  
  const lastUpdate = user.lastRerollUpdate ? new Date(user.lastRerollUpdate) : new Date(0);
  const localLastUpdate = new Date(lastUpdate.getTime() + (timezoneOffset * 60000));

  // Compare local day components
  const lastUpdateDay = localLastUpdate.getUTCDate();
  const lastUpdateMonth = localLastUpdate.getUTCMonth();
  const lastUpdateYear = localLastUpdate.getUTCFullYear();
  
  const currentDay = localNow.getUTCDate();
  const currentMonth = localNow.getUTCMonth();
  const currentYear = localNow.getUTCFullYear();

  if (lastUpdateDay !== currentDay || lastUpdateMonth !== currentMonth || lastUpdateYear !== currentYear) {
    user.rerollsRemaining = 2; // Reduced from 3 to 2
    user.lastRerollUpdate = now;
    return true;
  }
  return false;
};

/**
 * Ensures that a user has their daily default tasks for today.
 * If not, it creates them.
 */
export const ensureDailyTasks = async (userId: string | mongoose.Types.ObjectId, timezoneOffset: number = 0): Promise<ITask[]> => {
  const now = new Date();
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));
  
  // localMid represents 00:00:00 in user's local time, as a UTC object for component extraction
  const localMid = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));
  
  // today represents the actual UTC moment when the user's day started
  const today = new Date(localMid.getTime() - (timezoneOffset * 60000));
  
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  // Check if user already has tasks created for today
  // (Tasks with dueDate between now and tomorrow midnight)
  const existingTodayTasks = await Task.find({
    userId,
    'dueDate': { $gte: today, $lt: tomorrow }
  } as any); // Temporary cast for mongoose-specific type mismatch

  if (existingTodayTasks.length === 0) {
    const defaultTasks: IDefaultTask[] = await DefaultTask.find();
    
    if (defaultTasks.length > 0) {
      const tasksToCreate = defaultTasks.map((dt: IDefaultTask) => ({
        userId,
        title: dt.title,
        category: dt.category,
        difficulty: dt.difficulty,
        xpReward: dt.xpReward,
        dueDate: new Date(tomorrow.getTime() - 1) // End of user's today
      }));
      
      await Task.insertMany(tasksToCreate);
      return await Task.find({ userId, dueDate: { $gte: today, $lt: tomorrow } });
    }
  }

  return existingTodayTasks;
};

/**
 * Rerolls a specific task for a user.
 */
export const rerollTask = async (user: IUser, taskId: string, timezoneOffset: number = 0, isAdReroll: boolean = false): Promise<ITask> => {
  // 1. Handle daily reset
  resetRerollsIfNeeded(user, timezoneOffset);

  // If not an ad reroll, check if any free rerolls remain
  if (!isAdReroll && user.rerollsRemaining <= 0) {
    throw new Error('No rerolls remaining for today. Watch an ad to reload!');
  }

  // 2. Find the task to reroll
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');
  if (task.userId.toString() !== user._id.toString()) throw new Error('Unauthorized');
  if (task.isCompleted) throw new Error('Cannot reroll a completed task');

  // 3. Find today's tasks to avoid duplicates
  const now = new Date();
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));
  const localMid = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));
  const today = new Date(localMid.getTime() - (timezoneOffset * 60000));
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const todaysTasks = await Task.find({
    userId: user._id,
    'dueDate': { $gte: today, $lt: tomorrow }
  } as any);
  
  const existingTitles = todaysTasks.map(t => t.title);

  // 4. Find available default tasks (those not already on today's list)
  let availableDefaults = await DefaultTask.find({
    title: { $nin: existingTitles },
    isActive: true
  });

  // If no "new" tasks are left, allow any task EXCEPT the current one
  if (availableDefaults.length === 0) {
    console.log('[Reroll] No unique tasks left, falling back to any available task');
    availableDefaults = await DefaultTask.find({
      title: { $ne: task.title },
      isActive: true
    });
  }

  if (availableDefaults.length === 0) {
    throw new Error('No other tasks available in the library to reroll into');
  }

  // 5. Pick a random one
  const randomIndex = Math.floor(Math.random() * availableDefaults.length);
  const newDefault = availableDefaults[randomIndex]!;

  // 6. Update task and user
  task.title = newDefault.title;
  task.category = newDefault.category;
  task.difficulty = newDefault.difficulty;
  task.xpReward = newDefault.xpReward;
  await task.save();

  // 7. Decrement rerolls only if it wasn't an ad-backed one
  if (!isAdReroll) {
    user.rerollsRemaining -= 1;
  }
  
  await user.save();

  return task;
};
