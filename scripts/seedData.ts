import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Achievement from '../models/Achievement.js';
import DefaultTask from '../models/DefaultTask.js';

const achievements = [
  { title: 'First Step', description: 'Complete your first task', iconName: 'rocket_launch', category: 'Tasks', target: 1, rarity: 'Common', xpReward: 50 },
  { title: 'Task Machine', description: 'Complete 50 tasks', iconName: 'bolt', category: 'Tasks', target: 50, rarity: 'Rare', xpReward: 250 },
  { title: 'Century Club', description: 'Complete 100 tasks', iconName: 'military_tech', category: 'Tasks', target: 100, rarity: 'Epic', xpReward: 1000 },
  { title: 'Task Master', description: 'Complete 500 tasks', iconName: 'workspace_premium', category: 'Tasks', target: 500, rarity: 'Legendary', xpReward: 5000 },
  { title: 'On Fire', description: '3-day streak', iconName: 'local_fire_department', category: 'Streaks', target: 3, rarity: 'Common', xpReward: 50 },
  { title: 'Week Warrior', description: '7-day streak', iconName: 'whatshot', category: 'Streaks', target: 7, rarity: 'Rare', xpReward: 250 },
  { title: 'Unstoppable', description: '30-day streak', iconName: 'shield', category: 'Streaks', target: 30, rarity: 'Epic', xpReward: 1000 },
  { title: 'Iron Will', description: '100-day streak', iconName: 'diamond', category: 'Streaks', target: 100, rarity: 'Legendary', xpReward: 5000 },
  { title: 'Social Butterfly', description: 'Add 5 friends', iconName: 'group_add', category: 'Social', target: 5, rarity: 'Common', xpReward: 50 },
  { title: 'Challenger', description: 'Win 3 challenges', iconName: 'emoji_events', category: 'Social', target: 3, rarity: 'Rare', xpReward: 250 },
  { title: 'Top Dog', description: 'Reach #1 on the leaderboard', iconName: 'leaderboard', category: 'Social', target: 1, rarity: 'Legendary', xpReward: 5000 },
  { title: 'Early Bird', description: 'Complete a task before 7 AM', iconName: 'wb_sunny', category: 'Special', target: 1, rarity: 'Common', xpReward: 50 },
  { title: 'Night Owl', description: 'Complete a task after 11 PM', iconName: 'nightlight', category: 'Special', target: 1, rarity: 'Common', xpReward: 50 },
  { title: 'Perfectionist', description: 'Complete all daily tasks for a week', iconName: 'star', category: 'Special', target: 7, rarity: 'Epic', xpReward: 1000 },
  { title: 'Level 10', description: 'Reach Level 10', iconName: 'auto_awesome', category: 'Special', target: 10, rarity: 'Epic', xpReward: 1000 },
  { title: 'Ascended', description: 'Reach Level 20 — Max Level', iconName: 'rocket', category: 'Special', target: 20, rarity: 'Legendary', xpReward: 5000 },
];

const defaultTasks = [
  { title: 'Morning Meditation', category: 'Mindfulness', difficulty: 'Easy', xpReward: 25 },
  { title: 'Run 5km', category: 'Fitness', difficulty: 'Hard', xpReward: 100 },
  { title: 'Read 30 Pages', category: 'Learning', difficulty: 'Medium', xpReward: 50 },
  { title: 'Complete Flutter Module', category: 'Learning', difficulty: 'Epic', xpReward: 200 },
  { title: 'Drink 8 Glasses Water', category: 'Health', difficulty: 'Easy', xpReward: 25 },
  { title: 'Push Day Workout', category: 'Fitness', difficulty: 'Hard', xpReward: 100 },
  { title: 'Call a Friend', category: 'Social', difficulty: 'Easy', xpReward: 25 },
  { title: 'Clean Room', category: 'Chores', difficulty: 'Medium', xpReward: 50 },
  { title: 'Draw for 1 Hour', category: 'Creative', difficulty: 'Medium', xpReward: 50 },
  { title: 'Finish Project Proposal', category: 'Work', difficulty: 'Epic', xpReward: 200 },
];

const mockUsers = [
  { name: 'Alex Honnold', username: 'free_solo', email: 'alex@example.com', totalXP: 12500, level: 15, title: 'Mountain Legend', weeklyXP: [150, 200, 300, 400, 250, 500, 450], currentStreak: 45 },
  { name: 'Sasha DiGiulian', username: 'rock_queen', email: 'sasha@example.com', totalXP: 9800, level: 12, title: 'Pro Climber', weeklyXP: [100, 150, 200, 250, 200, 300, 350], currentStreak: 30 },
  { name: 'Adam Ondra', username: 'silence_9c', email: 'adam@example.com', totalXP: 15000, level: 18, title: 'GOAT', weeklyXP: [500, 600, 700, 800, 900, 1000, 1200], currentStreak: 100 },
  { name: 'Janja Garnbret', username: 'gold_medal', email: 'janja@example.com', totalXP: 11000, level: 14, title: 'Olympic Champ', weeklyXP: [200, 300, 400, 500, 600, 700, 800], currentStreak: 60 },
  { name: 'Chris Sharma', username: 'king_lines', email: 'chris@example.com', totalXP: 8500, level: 10, title: 'Deep Water Master', weeklyXP: [50, 100, 150, 200, 150, 250, 300], currentStreak: 15 },
  { name: 'Magnus Midtbo', username: 'mag_nasty', email: 'magnus@example.com', totalXP: 7200, level: 9, title: 'Training Beast', weeklyXP: [300, 400, 300, 400, 500, 600, 550], currentStreak: 25 },
];

const seedDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climbirl';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Achievements
    await Achievement.deleteMany({});
    await Achievement.insertMany(achievements);
    console.log('✅ Achievement master list seeded');

    // Default Tasks
    await DefaultTask.deleteMany({});
    await DefaultTask.insertMany(defaultTasks);
    console.log('✅ Default tasks seeded');

    // Mock Users
    // We don't deleteMany users to avoid wiping the main user account
    for (const u of mockUsers) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    }
    console.log('✅ Mock users seeded for leaderboard');

    process.exit();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
