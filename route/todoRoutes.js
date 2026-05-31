// route/todoRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTodos, getTodoById, createTodo, updateTodo, updateStatus, deleteTodo, clearDone, getStats
} = require('../controller/todoController');

// ✅ Import middleware dengan cara aman
const middleware = require('../middleware/authMiddleware');
const authMiddleware = middleware.authMiddleware;
const validateTodo = middleware.validateTodo;

// Apply auth to all todo routes
router.use(authMiddleware);

// Routes
router.get('/stats', getStats);
router.delete('/clear-done', clearDone);
router.get('/', getAllTodos);
router.get('/:id', getTodoById);
router.post('/', validateTodo, createTodo);
router.put('/:id', validateTodo, updateTodo);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTodo);

module.exports = router;