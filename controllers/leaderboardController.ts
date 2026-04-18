import type { Request, Response } from 'express';
import User from '../models/User.js';
import { resetMonthlyIfNeeded, syncWeeklyArrays } from '../services/gamificationService.js';

interface LeaderboardUser {
  _id: any;
  name: string;
  username: string;
  avatarUrl: string;
  totalXP: number;
  level: number;
  title: string;
  weeklyXP: number[];
  monthlyXP: number;
  weeklyTotal: number;
  rank?: number;
}

export const getLeaderboard = async (req: Request, res: Response) => {
  const { period = 'allTime' } = req.query as { period?: string };

  try {
    const now = new Date();
    
    // 1. Normalize buckets for ALL users prior to ranking
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
    let pipeline: any[] = []; // Aggregation pipelines often use any[] unless we define a complex union

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

    const leaderboard: LeaderboardUser[] = await User.aggregate(pipeline);
    
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


