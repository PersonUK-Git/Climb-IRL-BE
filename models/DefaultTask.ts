import mongoose from 'mongoose';

const defaultTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Epic'], default: 'Medium' },
  xpReward: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('DefaultTask', defaultTaskSchema);
