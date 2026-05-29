const db = require('../db');

// GET all todos (with optional filter)
const getAllTodos = (req, res) => {
  const { status, priority, category, search } = req.query;
  let query = 'SELECT * FROM todos WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND title LIKE ?'; params.push(`%${search}%`); }

  query += ' ORDER BY created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results, count: results.length });
  });
};

// GET single todo by ID
const getTodoById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM todos WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: results[0] });
  });
};

// POST create new todo
const createTodo = (req, res) => {
  const { title, description, category, priority, due_date, status } = req.body;
  const query = `
    INSERT INTO todos (title, description, category, priority, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [
    title.trim(),
    description || null,
    category || 'General',
    priority || 'medium',
    due_date || null,
    status || 'pending',
  ];
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: { id: result.insertId, ...req.body },
    });
  });
};

// PUT update todo
const updateTodo = (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, due_date, status } = req.body;
  const query = `
    UPDATE todos SET title=?, description=?, category=?, priority=?, due_date=?, status=?
    WHERE id=?
  `;
  const values = [
    title.trim(),
    description || null,
    category || 'General',
    priority || 'medium',
    due_date || null,
    status || 'pending',
    id,
  ];
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Todo updated successfully' });
  });
};

// PATCH update status only
const updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'in_progress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });

  db.query('UPDATE todos SET status=? WHERE id=?', [status, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Status updated successfully' });
  });
};

// DELETE todo
const deleteTodo = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM todos WHERE id=?', [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Todo deleted successfully' });
  });
};

// DELETE all done todos
const clearDone = (req, res) => {
  db.query("DELETE FROM todos WHERE status='done'", (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({
      success: true,
      message: `${result.affectedRows} completed todo(s) cleared`,
    });
  });
};

// GET stats
const getStats = (req, res) => {
  const query = `
    SELECT
      COUNT(*) as total,
      SUM(status='pending') as pending,
      SUM(status='in_progress') as in_progress,
      SUM(status='done') as done,
      SUM(priority='high') as high_priority,
      SUM(due_date < CURDATE() AND status != 'done') as overdue
    FROM todos
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: results[0] });
  });
};

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  updateStatus,
  deleteTodo,
  clearDone,
  getStats,
};
