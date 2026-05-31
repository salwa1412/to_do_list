const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authmiddleware');

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require('../controller/taskcontroller');

router.get('/', authMiddleware, getTasks);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);

module.exports = router;