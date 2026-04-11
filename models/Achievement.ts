import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
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

export default mongoose.model('Achievement', achievementSchema);
