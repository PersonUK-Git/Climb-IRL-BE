import User from '../models/User.js';
import { resetMonthlyIfNeeded, syncWeeklyArrays } from '../services/gamificationService.js';

export const getLeaderboard = async (req: any, res: any) => {
  const { period = 'allTime' } = req.query;

  try {
    const now = new Date();
    
    // 1. Normalize buckets for ALL users prior to ranking
    // To optimize, we only fetch users who haven't been updated today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const usersToSync = await User.find({ 
      lastXPUpdate: { $lt: startOfToday } 
    });

    if (usersToSync.length > 0) {
      const syncPromises = usersToSync.map(user => {
        const modM = resetMonthlyIfNeeded(user, now);
        const modW = syncWeeklyArrays(user, now);
        if (modM || modW) {
          return user.save();
        }
        return Promise.resolve();
      });
      await Promise.all(syncPromises);
    }

    let sortField = 'totalXP';
    let pipeline: any[] = [];

    if (period === 'weekly') {
      // Sum the weeklyXP array
      pipeline = [
        {
          $addFields: {
            weeklyTotal: { $sum: "$weeklyXP" }
          }
        },
        { $sort: { weeklyTotal: -1 } }
      ];
      sortField = 'weeklyTotal';
    } else if (period === 'monthly') {
      pipeline = [{ $sort: { monthlyXP: -1 } }];
      sortField = 'monthlyXP';
    } else {
      pipeline = [{ $sort: { totalXP: -1 } }];
    }

    pipeline.push(
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          avatarUrl: 1,
          totalXP: 1,
          level: 1,
          title: 1,
          weeklyXP: 1,
          monthlyXP: 1,
          weeklyTotal: (period === 'weekly') ? 1 : { $sum: "$weeklyXP" }
        }
      }
    );

    const leaderboard = await User.aggregate(pipeline);
    
    // Add Rank and ensure the XP displayed matches the period
    const rankedLeaderboard = leaderboard.map((user, index) => {
      let displayXP = user.totalXP;
      if (period === 'weekly') displayXP = user.weeklyTotal;
      if (period === 'monthly') displayXP = user.monthlyXP;

      return {
        ...user,
        totalXP: displayXP, // Override totalXP for the frontend to display the correct ranking metric
        rank: index + 1,
      };
    });
    
    res.status(200).json(rankedLeaderboard);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


