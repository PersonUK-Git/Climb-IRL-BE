const Task = require('../models/Task');
const User = require('../models/User');
const { getLevel, getLevelTitle, updateGamificationStats } = require('../services/gamificationService');

/**
 * Get all tasks for the logged in user.
 */
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new task.
 */
const createTask = async (req, res) => {
  const { title, category, difficulty, xpReward, dueDate } = req.body;

  if (!title || !category || !difficulty || !xpReward) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const task = await Task.create({
      userId: req.user._id,
      title,
      category,
      difficulty,
      xpReward,
      dueDate,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Complete a task and reward XP.
 */
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

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
    
    // Use service to update stats
    const updatedStats = updateGamificationStats(user, task.xpReward);
    
    user.totalXP = updatedStats.totalXP;
    user.level = updatedStats.level;
    user.title = updatedStats.title;
    user.tasksCompleted += 1;

    // Update weekly XP tracking (simple "today" bucket)
    // In a real production app, this would use a more robust daily distribution logic
    user.weeklyXP[6] += task.xpReward;
    user.streakDays[6] = true;

    await user.save();

    res.status(200).json({ 
      task, 
      user: { 
        totalXP: user.totalXP, 
        level: user.level, 
        title: user.title 
      } 
    });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a task.
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

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

module.exports = {
  getTasks,
  createTask,
  completeTask,
  deleteTask,
};
