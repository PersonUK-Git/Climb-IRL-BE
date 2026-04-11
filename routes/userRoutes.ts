import express from 'express';
import { getProfile, updateProfile, getUserAchievements } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/profile/achievements', getUserAchievements);

export default router;
