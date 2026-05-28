const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// REGISTER
const register = async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    // cek email sudah ada atau belum
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email_user = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: 'Email sudah digunakan',
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // simpan user
    const result = await pool.query(
      `INSERT INTO users
      (nama_user, email_user, password_user)
      VALUES ($1, $2, $3)
      RETURNING id_user, nama_user, email_user`,
      [nama, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Register berhasil',
      user: result.rows[0],
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // cari user berdasarkan email
    const result = await pool.query(
      'SELECT * FROM users WHERE email_user = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Email tidak ditemukan',
      });
    }

    const user = result.rows[0];

    // cek password
    const validPassword = await bcrypt.compare(
      password,
      user.password_user
    );

    if (!validPassword) {
      return res.status(400).json({
        message: 'Password salah',
      });
    }

    // generate JWT token
    const token = jwt.sign(
      { id: user.id_user },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id_user,
        nama: user.nama_user,
        email: user.email_user,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  register,
  login,
};