const pool = require('../db');

// GET semua task user login
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM tugas
       WHERE pengguna_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// TAMBAH TASK
const createTask = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      judul,
      deskripsi,
      kategori_id,
      tenggat_waktu,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tugas (
        user_id,
        kategori_id,
        judul,
        deskripsi,
        tenggat_waktu
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        userId,
        kategori_id,
        judul,
        deskripsi,
        tenggat_waktu
      ]
    );

    res.status(201).json({
      message: 'Task berhasil ditambah',
      task: result.rows[0],
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
// EDIT TASK
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      judul,
      deskripsi,
      status,
      tenggat_waktu,
      kategori_id,
    } = req.body;

    const result = await pool.query(
      `UPDATE tugas
       SET
       judul = $1,
       deskripsi = $2,
       status = $3,
       tenggat_waktu = $4,
       kategori_id = $5
       WHERE id = $6
       RETURNING *`,
      [
        judul,
        deskripsi,
        status,
        tenggat_waktu,
        kategori_id,
        id,
      ]
    );

    res.json({
      message: 'Task berhasil diupdate',
      task: result.rows[0],
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

// HAPUS TASK
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM tugas WHERE id = $1',
      [id]
    );

    res.json({
      message: 'Task berhasil dihapus',
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server error',
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};