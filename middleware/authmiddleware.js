// Request Logger Middleware
const requestLogger = (req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
};

// Validate Todo Input Middleware
const validateTodo = (req, res, next) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Title is required and cannot be empty',
    });
  }
  const validPriorities = ['low', 'medium', 'high'];
  if (req.body.priority && !validPriorities.includes(req.body.priority)) {
    return res.status(400).json({
      success: false,
      message: 'Priority must be low, medium, or high',
    });
  }
  const validStatuses = ['pending', 'in_progress', 'done'];
  if (req.body.status && !validStatuses.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be pending, in_progress, or done',
    });
  }
  next();
};

module.exports = { requestLogger, validateTodo };
