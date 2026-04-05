const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({})
      .select('name username avatarUrl totalXP level title')
      .sort({ totalXP: -1 })
      .limit(50);
    
    // Add Rank field (dynamically calculate based on sorted results)
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1,
    }));
    
    res.status(200).json(rankedLeaderboard);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getLeaderboard };
