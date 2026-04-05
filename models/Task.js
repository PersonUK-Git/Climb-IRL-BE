const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Epic'], default: 'Medium' },
  xpReward: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  dueDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
