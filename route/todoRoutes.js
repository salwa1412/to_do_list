const express = require('express');
const router = express.Router();
const {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  updateStatus,
  deleteTodo,
  clearDone,
  getStats,
} = require('../controller/todoController');
const { requestLogger, validateTodo } = require('../middleware/authMiddleware');

// Apply logger to all routes
router.use(requestLogger);

// Stats
router.get('/stats', getStats);

// Clear done
router.delete('/clear-done', clearDone);

// CRUD
router.get('/', getAllTodos);
router.get('/:id', getTodoById);
router.post('/', validateTodo, createTodo);
router.put('/:id', validateTodo, updateTodo);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTodo);

module.exports = router;
