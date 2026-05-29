// controller/authcontroller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// ============================================
// REGISTER USER
// ============================================
const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { nama, email, password } = req.body;

    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama, email, dan password wajib diisi' 
      });
    }

    // Cek email sudah terdaftar
    const checkResult = await client.query(
      'SELECT id_user FROM users WHERE email_user = $1',
      [email.toLowerCase().trim()]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah digunakan. Silakan login.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const insertResult = await client.query(
      `INSERT INTO users (nama_user, email_user, password_user)
       VALUES ($1, $2, $3)
       RETURNING id_user, nama_user, email_user`,
      [nama.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const newUser = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      user: newUser
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    // Handle duplicate email (unique constraint)
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// ============================================
// LOGIN USER
// ============================================
const login = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email dan password wajib diisi' 
      });
    }

    // Cari user berdasarkan email
    const result = await client.query(
      'SELECT * FROM users WHERE email_user = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }

    const user = result.rows[0];

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password_user);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau password salah' 
      });
    }

    // Generate JWT token menggunakan JWT_SECRET dari .env
    const token = jwt.sign(
      { id: user.id_user, email: user.email_user },
      process.env.JWT_SECRET || 'todo_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id_user,
        nama: user.nama_user,
        email: user.email_user
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// ============================================
// EXPORT FUNCTIONS (HARUS BENAR!)
// ============================================
module.exports = {
  register,
  login
};