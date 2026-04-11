import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// If running from dist, the public folder is one level up in the root
const rootPath = __dirname.endsWith('dist') ? path.join(__dirname, '..') : __dirname;
const publicPath = path.join(rootPath, 'public');


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

// Request Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Legal Routes (Clean URLs)
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(publicPath, 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.sendFile(path.join(publicPath, 'terms.html'));
});

app.get('/delete-account', (req, res) => {
  res.sendFile(path.join(publicPath, 'delete-account.html'));
});


// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climbirl';
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});
