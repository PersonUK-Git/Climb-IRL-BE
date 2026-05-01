import mongoose from 'mongoose';

export interface ITask extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  xpReward: number;
  isCompleted: boolean;
  completedAt?: Date | undefined;
  proofNote?: string;
  proofUrl?: string;
  dueDate?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new mongoose.Schema<ITask>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Epic'], default: 'Medium' },
  xpReward: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  proofNote: { type: String },
  proofUrl: { type: String },
  dueDate: { type: Date },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', taskSchema);
