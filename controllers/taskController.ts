import type { Response } from 'express';
import Task from '../models/Task.js';
import type { ITask } from '../models/Task.js';
import User from '../models/User.js';
import { updateGamificationStats } from '../services/gamificationService.js';
import { ensureDailyTasks, rerollTask, resetRerollsIfNeeded } from '../services/taskService.js';
import { verifyTaskProof } from '../services/aiService.js';
import type { AuthRequest, AuthTypedRequest } from '../utils/types.js';

/**
 * Get all tasks for the logged in user.
 */
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const timezoneOffsetStr = req.headers['x-timezone-offset'];
    const timezoneOffset = parseInt(Array.isArray(timezoneOffsetStr) ? timezoneOffsetStr[0]! : (timezoneOffsetStr || '0')) || 0;
    
    // Reset rerolls for a new day
    const user = await User.findById(req.user._id);
    if (user) {
      const reset = resetRerollsIfNeeded(user, timezoneOffset);
      if (reset) await user.save();
    }

    const tasks = await ensureDailyTasks(req.user._id, timezoneOffset);
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
export const completeTask = async (req: AuthRequest, res: Response) => {
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
    
    // Extract timezone offset from header
    const timezoneOffsetStr = req.headers['x-timezone-offset'];
    const timezoneOffset = parseInt(Array.isArray(timezoneOffsetStr) ? timezoneOffsetStr[0]! : (timezoneOffsetStr || '0')) || 0;

    // Use service to update stats
    updateGamificationStats(user, task.xpReward, timezoneOffset);
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
 * Verify task with AI and reward XP if valid.
 */
export const verifyAndCompleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { imageBase64, proofNote } = req.body;

    if (!imageBase64 && !proofNote) {
      return res.status(400).json({ message: 'At least one form of proof (photo or note) is required' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Unauthorized' });
    if (task.isCompleted) return res.status(400).json({ message: 'Task already completed' });

    // AI Verification if image is provided
    if (imageBase64) {
      console.log(`[AI] Verifying task: ${task.title}`);
      const verification = await verifyTaskProof(task.title, imageBase64);
      
      if (!verification.valid) {
        return res.status(400).json({ 
          message: 'AI Verification Failed', 
          reason: verification.reason 
        });
      }
      task.proofUrl = 'ai_verified'; // Placeholder for now, could be a real URL later
    }

    if (proofNote) {
      task.proofNote = proofNote;
    }

    // Mark as completed
    task.isCompleted = true;
    task.completedAt = new Date();
    await task.save();

    // Reward XP
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const timezoneOffsetStr = req.headers['x-timezone-offset'];
    const timezoneOffset = parseInt(Array.isArray(timezoneOffsetStr) ? timezoneOffsetStr[0]! : (timezoneOffsetStr || '0')) || 0;

    updateGamificationStats(user, task.xpReward, timezoneOffset);
    user.tasksCompleted += 1;
    
    user.markModified('weeklyXP');
    user.markModified('streakDays');
    user.markModified('lastXPUpdate');
    await user.save();

    res.status(200).json({
      message: 'Task verified and completed successfully!',
      task,
      user
    });
  } catch (err) {
    console.error('Verify task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a task.
 */
export const deleteTask = async (req: AuthRequest, res: Response) => {
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

/**
 * Reroll a task.
 */
export const rerollTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { watchAd } = req.body as { watchAd?: boolean };
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const timezoneOffsetStr = req.headers['x-timezone-offset'];
    const timezoneOffset = parseInt(Array.isArray(timezoneOffsetStr) ? timezoneOffsetStr[0]! : (timezoneOffsetStr || '0')) || 0;
    const updatedTask = await rerollTask(user, id, timezoneOffset, !!watchAd);

    res.status(200).json({
      task: updatedTask,
      user
    });
  } catch (err: any) {
    console.error(`[RerollError] Task: ${req.params.id}, Error: ${err.message}`);
    res.status(400).json({ message: err.message || 'Server error during reroll' });
  }
};


