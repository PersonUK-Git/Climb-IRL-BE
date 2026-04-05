import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconName: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Tasks', 'Streaks', 'Social', 'Special'
  target: { type: Number, required: true }, // Number required to unlock
  rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common' },
  xpReward: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
