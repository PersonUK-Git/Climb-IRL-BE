import mongoose from 'mongoose';

export interface IDefaultTask extends mongoose.Document {
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultTaskSchema = new mongoose.Schema<IDefaultTask>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Epic'], default: 'Medium' },
  xpReward: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IDefaultTask>('DefaultTask', defaultTaskSchema);
