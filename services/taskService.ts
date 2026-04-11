import DefaultTask from '../models/DefaultTask.js';
import Task from '../models/Task.js';

/**
 * Ensures that a user has their daily default tasks for today.
 * If not, it creates them.
 */
export const ensureDailyTasks = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if user already has tasks created for today
  // (Tasks with dueDate between now and tomorrow midnight)
  const existingTodayTasks = await Task.find({
    userId,
    dueDate: { $gte: today, $lt: tomorrow }
  });

  if (existingTodayTasks.length === 0) {
    const defaultTasks = await DefaultTask.find();
    
    if (defaultTasks.length > 0) {
      const tasksToCreate = defaultTasks.map((dt: any) => ({
        userId,
        title: dt.title,
        category: dt.category,
        difficulty: dt.difficulty,
        xpReward: dt.xpReward,
        dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
      }));
      
      await Task.insertMany(tasksToCreate);
      return await Task.find({ userId, dueDate: { $gte: today, $lt: tomorrow } });
    }
  }

  return existingTodayTasks;
};
