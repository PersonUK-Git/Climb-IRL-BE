const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  iconName: { type: String, required: true },
  category: { type: String, enum: ['Tasks', 'Streaks', 'Social', 'Special'], default: 'Tasks' },
  isUnlocked: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  target: { type: Number, default: 1 },
  current: { type: Number, default: 0 },
  rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common' },
  unlockedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
