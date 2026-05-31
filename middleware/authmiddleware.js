// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Request Logger
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

// ============================================
// VALIDASI REGISTER (butuh nama, email, password)
// ============================================
const validateRegister = (req, res, next) => {
  const { nama, email, password } = req.body;

  // Validasi nama (HANYA untuk register)
  if (!nama || String(nama).trim().length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nama minimal 2 karakter' 
    });
  }

  // Validasi email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Format email tidak valid' 
    });
  }

  // Validasi password
  if (!password || String(password).length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password minimal 6 karakter' 
    });
  }

  next();
};

// ============================================
// VALIDASI LOGIN (hanya email & password)
// ============================================
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Validasi email
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email wajib diisi' 
    });
  }

  // Validasi password
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password wajib diisi' 
    });
  }

  next();
};

// ============================================
// VALIDASI TODO (untuk create/update todo)
// ============================================
const validateTodo = (req, res, next) => {
  const title = req.body.judul || req.body.title;
  
  if (!title || String(title).trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Judul tugas wajib diisi'
    });
  }
  
  next();
};

// ============================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token tidak ditemukan' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'todo_secret');
    
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Token tidak valid atau kadaluarsa' 
    });
  }
};

// Export semua middleware
module.exports = {
  authMiddleware,
  requestLogger,
  validateRegister,  // ✅ Untuk register
  validateLogin,     // ✅ Untuk login (tanpa validasi nama)
  validateTodo
};