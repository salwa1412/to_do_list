// controller/todoController.js
const pool = require('../db');

// ============================================
// Ganti fungsi getAllTodos dengan kode ini:

const getAllTodos = async (req, res) => {
  const client = await pool.connect();
  try {
    const { status, priority, category, search } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    // Filter status (dengan dukungan 'overdue')
    if (status) {
      if (status === 'overdue') {
        // Overdue = belum selesai + deadline sudah lewat
        query += ` AND status != 'done' AND due_date < CURRENT_DATE`;
      } else {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }
    
    if (priority) { 
      query += ` AND priority = $${paramIndex}`; 
      params.push(priority); 
      paramIndex++; 
    }
    if (category) { 
      query += ` AND category = $${paramIndex}`; 
      params.push(category); 
      paramIndex++; 
    }
    if (search) { 
      query += ` AND title ILIKE $${paramIndex}`; 
      params.push(`%${search}%`); 
      paramIndex++; 
    }

    query += ' ORDER BY created_at DESC';

    const result = await client.query(query, params);
    
    res.json({ 
      success: true, 
      data: result.rows, 
      count: result.rows.length 
    });

  } catch (error) {
    console.error('❌ Get todos error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil task', error: error.message });
  } finally {
    client.release();
  }
};

// GET single todo by ID
const getTodoById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const result = await client.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('❌ Get todo by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// POST create new todo
const createTodo = async (req, res) => {
  const client = await pool.connect();
  try {
    // Mapping field frontend (Indonesia) → backend (English)
    const { judul, deskripsi, kategori_id, tenggat_waktu, kategori, prioritas } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const title = judul?.trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
    }

    const result = await client.query(
      `INSERT INTO todos (
        user_id, title, description, category, priority, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        userId,
        title,
        deskripsi || null,
        kategori || kategori_id || 'General',
        prioritas || 'medium',
        tenggat_waktu || null,
        'pending'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Task berhasil ditambahkan',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Create todo error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambah task', error: error.message });
  } finally {
    client.release();
  }
};

// PUT update todo
const updateTodo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { judul, deskripsi, kategori, prioritas, tenggat_waktu, status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    // Cek kepemilikan task
    const checkResult = await client.query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    const result = await client.query(
      `UPDATE todos SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        status = COALESCE($6, status),
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [
        judul?.trim(),
        deskripsi,
        kategori,
        prioritas,
        tenggat_waktu,
        status,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Task berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Update todo error:', error);
    res.status(500).json({ success: false, message: 'Gagal update task', error: error.message });
  } finally {
    client.release();
  }
};

// PATCH update status only
const updateStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const validStatuses = ['pending', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const result = await client.query(
      'UPDATE todos SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    res.json({ success: true, message: 'Status berhasil diupdate', data: result.rows[0] });

  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({ success: false, message: 'Gagal update status', error: error.message });
  } finally {
    client.release();
  }
};

// DELETE todo
const deleteTodo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const result = await client.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan' });
    }

    res.json({ success: true, message: 'Task berhasil dihapus' });

  } catch (error) {
    console.error('❌ Delete todo error:', error);
    res.status(500).json({ success: false, message: 'Gagal hapus task', error: error.message });
  } finally {
    client.release();
  }
};

// DELETE all done todos
const clearDone = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const result = await client.query(
      "DELETE FROM todos WHERE status = 'done' AND user_id = $1",
      [userId]
    );

    res.json({
      success: true,
      message: `${result.rowCount} task selesai dihapus`,
      deletedCount: result.rowCount
    });

  } catch (error) {
    console.error('❌ Clear done error:', error);
    res.status(500).json({ success: false, message: 'Gagal hapus task selesai', error: error.message });
  } finally {
    client.release();
  }
};

// GET stats
const getStats = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User tidak terautentikasi' });
    }

    const result = await client.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue
       FROM todos WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik', error: error.message });
  } finally {
    client.release();
  }
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