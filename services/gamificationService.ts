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
export const resetMonthlyIfNeeded = (user: IUser, now: Date, timezoneOffset: number = 0): boolean => {
  // Convert UTC dates to local dates based on offset
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  const localLastUpdate = new Date(lastUpdate.getTime() + (timezoneOffset * 60000));
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));

  const lastUpdateMonth = localLastUpdate.getUTCMonth();
  const lastUpdateYear = localLastUpdate.getUTCFullYear();
  const currentMonth = localNow.getUTCMonth();
  const currentYear = localNow.getUTCFullYear();

  if (lastUpdateMonth !== currentMonth || lastUpdateYear !== currentYear) {
    user.monthlyXP = 0;
    return true;
  }
  return false;
};

/**
 * Correctly identifies if a day has passed and clears indices to prevent stale data.
 * This implementation uses a Mon-Sun fixed week (0-6).
 */
export const syncWeeklyArrays = (user: IUser, now: Date, timezoneOffset: number = 0): boolean => {
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));
  // Convert Sun-Sat (0-6) to Mon-Sun (0-6)
  const currentDay = (localNow.getUTCDay() + 6) % 7;
  
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  const localLastUpdate = new Date(lastUpdate.getTime() + (timezoneOffset * 60000));
  
  // Normalize dates to start of local day for comparison
  const todayStart = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate())).getTime();
  const lastUpdateStart = new Date(Date.UTC(localLastUpdate.getUTCFullYear(), localLastUpdate.getUTCMonth(), localLastUpdate.getUTCDate())).getTime();
  
  const daysDiff = Math.floor((todayStart - lastUpdateStart) / (1000 * 60 * 60 * 24));
  
  console.log(`[StreakSync] todayStart: ${new Date(todayStart).toISOString()}, lastUpdateStart: ${new Date(lastUpdateStart).toISOString()}, daysDiff: ${daysDiff}, currentDay: ${currentDay}`);
  
  let modified = false;

  if (daysDiff >= 7) {
    // Whole week or more passed: reset everything
    user.weeklyXP = [0, 0, 0, 0, 0, 0, 0];
    user.streakDays = [false, false, false, false, false, false, false];
    modified = true;
  } else if (daysDiff > 0) {
    // Clone arrays to safely modify and re-assign
    const updatedWeeklyXP = [...user.weeklyXP];
    const updatedStreakDays = [...user.streakDays];

    // Clear each stale/missed day from today back to the last update (exclusive)
    for (let i = 0; i < daysDiff; i++) {
      const idx = (currentDay - i + 7) % 7;
      console.log(`[StreakSync] Clearing index ${idx} as it is stale/missed`);
      if (updatedWeeklyXP[idx] !== 0 || updatedStreakDays[idx] !== false) {
        updatedWeeklyXP[idx] = 0;
        updatedStreakDays[idx] = false;
        modified = true;
      }
    }

    if (modified) {
      user.weeklyXP = updatedWeeklyXP;
      user.streakDays = updatedStreakDays;
    }
  }
  return modified;
};

/**
 * Update user's gamification stats after XP gain, including date-aware rollover.
 */
export const updateGamificationStats = (user: IUser, xpDelta: number, timezoneOffset: number = 0) => {
  const now = new Date();
  const localNow = new Date(now.getTime() + (timezoneOffset * 60000));
  // Convert Sun-Sat (0-6) to Mon-Sun (0-6)
  const currentDay = (localNow.getUTCDay() + 6) % 7;

  const todayStart = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate())).getTime();
  const lastUpdate = user.lastXPUpdate ? new Date(user.lastXPUpdate) : new Date(0);
  const localLastUpdate = new Date(lastUpdate.getTime() + (timezoneOffset * 60000));
  const lastUpdateStart = new Date(Date.UTC(localLastUpdate.getUTCFullYear(), localLastUpdate.getUTCMonth(), localLastUpdate.getUTCDate())).getTime();
  const daysDiff = Math.floor((todayStart - lastUpdateStart) / (1000 * 60 * 60 * 24));

  console.log(`[GamificationDebug] MonSunDay: ${currentDay}, daysDiff: ${daysDiff}, xpDelta: ${xpDelta}`);

  // 1. Handle Rollovers
  resetMonthlyIfNeeded(user, now, timezoneOffset);
  syncWeeklyArrays(user, now, timezoneOffset);

  // 2. Apply XP to Total
  const newTotalXP = Math.max(0, (user.totalXP || 0) + xpDelta);
  const newLevel = getLevel(newTotalXP);
  const newTitle = getLevelTitle(newLevel);

  // 3. Apply XP to Periodics
  if (!user.weeklyXP || user.weeklyXP.length < 7) user.weeklyXP = [0, 0, 0, 0, 0, 0, 0];
  if (!user.streakDays || user.streakDays.length < 7) user.streakDays = [false, false, false, false, false, false, false];

  // Clone arrays and re-assign to ensure Mongoose tracks the changes
  const updatedWeeklyXP = [...user.weeklyXP];
  const updatedStreakDays = [...user.streakDays];

  const currentWeeklyXP = updatedWeeklyXP[currentDay] ?? 0;
  updatedWeeklyXP[currentDay] = currentWeeklyXP + xpDelta;
  user.weeklyXP = updatedWeeklyXP;
  
  updatedStreakDays[currentDay] = true;
  user.streakDays = updatedStreakDays;
  
  user.monthlyXP = (user.monthlyXP || 0) + xpDelta;

  console.log(`[GamificationDebug] After update - weeklyXP: ${user.weeklyXP}, streakDays: ${user.streakDays}`);

  // 4. Update Streak
  const oldStreak = user.currentStreak;
  if (daysDiff === 1) {
    // Consecutive day
    user.currentStreak = (user.currentStreak || 0) + 1;
  } else if (daysDiff > 1 || user.currentStreak === 0) {
    // Missed days OR first task ever (even on account creation day)
    user.currentStreak = 1;
  }
  
  console.log(`[StreakUpdate] daysDiff: ${daysDiff}, oldStreak: ${oldStreak}, newStreak: ${user.currentStreak}`);

  // Update Longest Streak
  if (user.currentStreak > (user.longestStreak || 0)) {
    user.longestStreak = user.currentStreak;
  }

  // 5. Update core stats and timestamp
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
