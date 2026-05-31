// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const todoRoutes = require('./route/todoRoutes');
const authRoutes = require('./route/authroute');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow all origins for development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies (form data)
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Debug: Cek controller exports
const authController = require('./controller/authcontroller');
console.log('🔍 authController exports:', Object.keys(authController));
console.log('✅ register is function:', typeof authController.register === 'function');
console.log('✅ login is function:', typeof authController.login === 'function');
// ============================================
// API ROUTES
// ============================================

// Auth routes (register, login) - NO authentication required
app.use('/api/auth', authRoutes);

// Todo routes - ALL require JWT authentication via middleware
app.use('/api/todos', todoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVE FRONTEND PAGES
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ============================================
// 404 HANDLER (MUST BE LAST)
// ============================================
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.originalUrl
    });
  }
  res.status(404).json({ success: false, message: 'Page not found' });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER & TEST DATABASE
// ============================================
app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════╗
║  🚀 TaskFlow Server                ║
║  📍 http://localhost:${PORT}          ║
║  🔗 /register.html                 ║
║  🔗 /login.html                    ║
║  🔗 /dashboard.html                ║
╚════════════════════════════════════╝
  `);

  // Test database connection
  try {
    const pool = require('./db');
    const result = await pool.query('SELECT NOW() as server_time');
    console.log('✅ PostgreSQL connected!');
    console.log('🕐 Server time:', result.rows[0].server_time);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  try {
    const pool = require('./db');
    await pool.end();
  } catch (e) {}
  process.exit(0);
});