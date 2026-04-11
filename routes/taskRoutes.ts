import express from 'express';
import { getTasks, createTask, completeTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/complete', completeTask);
router.delete('/:id', deleteTask);

export default router;
