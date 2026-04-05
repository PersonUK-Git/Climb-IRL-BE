const levelThresholds = [
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

const levelTitles = [
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

const maxLevel = 20;

/**
 * Calculate level based on total XP.
 * @param {number} totalXP 
 * @returns {number}
 */
const getLevel = (totalXP) => {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= levelThresholds[i]) {
      return i + 1;
    }
  }
  return 1;
};

/**
 * Get title for a specific level.
 * @param {number} level 
 * @returns {string}
 */
const getLevelTitle = (level) => {
  if (level < 1) return levelTitles[0];
  if (level > maxLevel) return levelTitles[maxLevel - 1];
  return levelTitles[level - 1];
};

/**
 * Update user's gamification stats after XP gain.
 * @param {Object} user - Mongoose User object
 * @param {number} xpDelta - Amount of XP gained/lost
 * @returns {Object} - Updated user stats
 */
const updateGamificationStats = (user, xpDelta) => {
  const newTotalXP = Math.max(0, (user.totalXP || 0) + xpDelta);
  const newLevel = getLevel(newTotalXP);
  const newTitle = getLevelTitle(newLevel);
  
  return {
    totalXP: newTotalXP,
    level: newLevel,
    title: newTitle
  };
};

module.exports = {
  getLevel,
  getLevelTitle,
  updateGamificationStats,
  levelThresholds,
  levelTitles,
  maxLevel,
};
