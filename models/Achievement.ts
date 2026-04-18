import mongoose from 'mongoose';

export interface IAchievement extends mongoose.Document {
  title: string;
  description: string;
  iconName: string;
  category: 'Tasks' | 'Streaks' | 'Social' | 'Special';
  target: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new mongoose.Schema<IAchievement>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Tasks', 'Streaks', 'Social', 'Special'], 
    required: true 
  },
  target: { 
    type: Number, 
    required: true, 
    min: [1, 'Target must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer target'
    }
  },
  rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common' },
  xpReward: { type: Number, default: 0, min: [0, 'XP reward cannot be negative'] },
}, { timestamps: true });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
