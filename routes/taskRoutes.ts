import express from 'express';
import { getTasks, createTask, completeTask, deleteTask, rerollTaskController, verifyAndCompleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/complete', completeTask);
router.post('/:id/verify', verifyAndCompleteTask);
router.patch('/:id/reroll', rerollTaskController);
router.delete('/:id', deleteTask);

export default router;
