import Achievement from '../models/Achievement.js';
import type { IAchievement } from '../models/Achievement.js';
import type { IUser } from '../models/User.js';

export interface AchievementResult {
  _id: any;
  title: string;
  description: string;
  iconName: string;
  category: string;
  target: number;
  current: number;
  isUnlocked: boolean;
  progress: number;
  rarity: string;
  xpReward: number;
  unlockedAt: Date | null;
}

export const calculateUserAchievements = async (user: IUser): Promise<AchievementResult[]> => {
  const allAchievements: IAchievement[] = await Achievement.find().lean();
  
  return allAchievements.map((ach) => {
    let current = 0;
    
    switch (ach.category) {
      case 'Tasks':
        current = user.tasksCompleted || 0;
        break;
      case 'Streaks':
        current = user.currentStreak || 0;
        // Some streak achievements might use longestStreak, 
        // but for now let's use the current context.
        if (ach.title.includes('longest') || ach.target > 10) {
            current = Math.max(user.currentStreak || 0, user.longestStreak || 0);
        }
        break;
      case 'Special':
        if (ach.title.startsWith('Level')) {
            current = user.level || 1;
        } else if (ach.title === 'Ascended') {
            current = user.level || 1;
        } else {
            // For other specials like "Early Bird", we'd need more complex tracking.
            // For now, let's keep them at 0 unless we add specific fields.
            current = 0;
        }
        break;
      default:
        current = 0;
    }

    const isUnlocked = current >= ach.target;
    const progress = Math.min(1, current / ach.target);

    return {
      _id: ach._id,
      title: ach.title,
      description: ach.description,
      iconName: ach.iconName,
      category: ach.category,
      target: ach.target,
      current: current,
      isUnlocked: isUnlocked,
      progress: progress,
      rarity: ach.rarity,
      xpReward: ach.xpReward,
      unlockedAt: isUnlocked ? (user.updatedAt as Date) : null // Pseudo-unlock date
    };
  });
};
