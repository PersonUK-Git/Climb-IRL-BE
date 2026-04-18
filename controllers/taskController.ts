import type { Request, Response } from 'express';
import Task from '../models/Task.js';
import type { ITask } from '../models/Task.js';
import User from '../models/User.js';
import { updateGamificationStats } from '../services/gamificationService.js';
import { ensureDailyTasks } from '../services/taskService.js';
import type { AuthTypedRequest } from '../utils/types.js';

/**
 * Get all tasks for the logged in user.
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await ensureDailyTasks(req.user._id);
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

interface CreateTaskBody {
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  xpReward: number;
  dueDate?: Date;
}

/**
 * Create a new task.
 */
export const createTask = async (req: AuthTypedRequest<CreateTaskBody>, res: Response) => {
  const { title, category, difficulty, xpReward, dueDate } = req.body;

  if (!title || !category || !difficulty || !xpReward) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const taskData: Partial<ITask> = {
      userId: req.user._id,
      title,
      category,
      difficulty,
      xpReward,
    };
    if (dueDate) taskData.dueDate = dueDate;

    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Complete a task and reward XP.
 */
export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (task.isCompleted) {
      return res.status(400).json({ message: 'Task already completed' });
    }

    // Mark task as completed
    task.isCompleted = true;
    task.completedAt = new Date();
    await task.save();

    // Fetch user and update gamification stats
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found for updating XP' });
    
    // Use service to update stats
    updateGamificationStats(user, task.xpReward);
    user.tasksCompleted += 1;

    // Ensure array and date changes are tracked by Mongoose
    user.markModified('weeklyXP');
    user.markModified('streakDays');
    user.markModified('lastXPUpdate');

    await user.save();

    res.status(200).json({ 
      task, 
      user
    });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a task.
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await task.deleteOne();
    res.status(200).json({ message: 'Task removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


