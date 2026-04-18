import type { IUser } from '../models/User.js';

export const levelThresholds = [
  0,      // Level 1:  0 XP
  100,    // Level 2:  100 XP
  300,    // Level 3:  300 XP
  600,    // Level 4:  600 XP
  1000,   // Level 5:  1,000 XP
  1500,   // Level 6:  1,500 XP
  2100,   // Level 7:  2,100 XP
  2800,   // Level 8:  2,800 XP
  3600,   // Level 9:  3,600 XP
  4500,   // Level 10: 4,500 XP
  5500,   // Level 11: 5,500 XP
  6600,   // Level 12: 6,600 XP
  7800,   // Level 13: 7,800 XP
  9100,   // Level 14: 9,100 XP
  10500,  // Level 15: 10,500 XP
  12000,  // Level 16: 12,000 XP
  13600,  // Level 17: 13,600 XP
  15300,  // Level 18: 15,300 XP
  17100,  // Level 19: 17,100 XP
  19000,  // Level 20: 19,000 XP
];

export const levelTitles = [
  'Newcomer',       // 1
  'Beginner',       // 2
  'Apprentice',     // 3
  'Initiate',       // 4
  'Adventurer',     // 5
  'Explorer',       // 6
  'Warrior',        // 7
  'Champion',       // 8
  'Hero',           // 9
  'Legend',         // 10
  'Master',         // 11
  'Grandmaster',    // 12
  'Elite',          // 13
  'Mythic',         // 14
  'Transcendent',   // 15
  'Immortal',       // 16
  'Divine',         // 17
  'Celestial',      // 18
  'Eternal',        // 19
  'Ascended',       // 20
];

export const maxLevel = 20;

/**
 * Calculate level based on total XP.
 */
export const getLevel = (totalXP: number): number => {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= (levelThresholds[i] || 0)) {
      return i + 1;
    }
  }
  return 1;
};

/**
 * Get title for a specific level.
 */
export const getLevelTitle = (level: number): string => {
  if (level < 1) return levelTitles[0]!;
  if (level > maxLevel) return levelTitles[maxLevel - 1]!;
  return levelTitles[level - 1]!;
};

/**
 * Resets monthly XP if the current month is different from the last update month.
 */
export const resetMonthlyIfNeeded = (user: IUser, now: Date): boolean => {
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  if (lastUpdate.getMonth() !== currentMonth || lastUpdate.getFullYear() !== currentYear) {
    user.monthlyXP = 0;
    return true;
  }
  return false;
};

/**
 * Correctly identifies if a day has passed and clears indices to prevent stale data.
 * This implementation uses a Sun-Sat fixed week (0-6).
 */
export const syncWeeklyArrays = (user: IUser, now: Date): boolean => {
  const currentDay = now.getDay();
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  
  // Normalize dates to start of day for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lastUpdateStart = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime();
  
  const daysDiff = Math.floor((todayStart - lastUpdateStart) / (1000 * 60 * 60 * 24));
  let modified = false;

  if (daysDiff >= 7) {
    // Whole week or more passed: reset everything
    user.weeklyXP = [0, 0, 0, 0, 0, 0, 0];
    user.streakDays = [false, false, false, false, false, false, false];
    modified = true;
  } else if (daysDiff > 0) {
    // Intervening days: clear each day that was missed
    for (let i = 0; i < daysDiff; i++) {
      const idx = (currentDay - i + 7) % 7;
      if (user.weeklyXP[idx] !== 0 || user.streakDays[idx] !== false) {
        user.weeklyXP[idx] = 0;
        user.streakDays[idx] = false;
        modified = true;
      }
    }
  }
  return modified;
};

/**
 * Update user's gamification stats after XP gain, including date-aware rollover.
 */
export const updateGamificationStats = (user: IUser, xpDelta: number) => {
  const now = new Date();
  const currentDay = now.getDay();

  // 1. Handle Rollovers
  resetMonthlyIfNeeded(user, now);
  syncWeeklyArrays(user, now);

  // 2. Apply XP to Total
  const newTotalXP = Math.max(0, (user.totalXP || 0) + xpDelta);
  const newLevel = getLevel(newTotalXP);
  const newTitle = getLevelTitle(newLevel);

  // 3. Apply XP to Periodics
  if (!user.weeklyXP) user.weeklyXP = [0, 0, 0, 0, 0, 0, 0];
  if (!user.streakDays) user.streakDays = [false, false, false, false, false, false, false];

  const currentWeeklyXP = user.weeklyXP[currentDay] ?? 0;
  user.weeklyXP[currentDay] = currentWeeklyXP + xpDelta;
  user.monthlyXP = (user.monthlyXP || 0) + xpDelta;
  user.streakDays[currentDay] = true;

  // Calculate days difference for streak
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  const lastUpdateStart = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime();
  const daysDiff = Math.floor((todayStart - lastUpdateStart) / (1000 * 60 * 60 * 24));

  // Update Streak
  if (daysDiff === 1) {
    // Consecutive day
    user.currentStreak = (user.currentStreak || 0) + 1;
  } else if (daysDiff > 1 || user.currentStreak === 0) {
    // Missed days OR first task ever (even on account creation day)
    user.currentStreak = 1;
  }
  // Otherwise, if daysDiff === 0 and currentStreak > 0, it's a second task today, keep streak same.

  // Update Longest Streak
  if (user.currentStreak > (user.longestStreak || 0)) {
    user.longestStreak = user.currentStreak;
  }

  // 4. Update core stats and timestamp
  user.totalXP = newTotalXP;
  user.level = newLevel;
  user.title = newTitle;
  user.lastXPUpdate = now;

  return {
    totalXP: newTotalXP,
    level: newLevel,
    title: newTitle
  };
};
