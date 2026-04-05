const express = require('express');
const router = express.Router();
const { getTasks, createTask, completeTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/complete', completeTask);
router.delete('/:id', deleteTask);

module.exports = router;
