import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatarUrl: { type: String, default: '' },
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  title: { type: String, default: 'Newcomer' },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  achievementsUnlocked: { type: Number, default: 0 },
  weeklyXP: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
  monthlyXP: { type: Number, default: 0 },
  streakDays: { type: [Boolean], default: [false, false, false, false, false, false, false] },
  gender: { type: String, default: '' },
  dateOfBirth: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
