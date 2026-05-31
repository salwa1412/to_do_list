-- ============================================
-- Taskly - To Do List App
-- Database Schema + Sample Data
-- ============================================

CREATE DATABASE IF NOT EXISTS todo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_db;

-- Drop table if exists (untuk re-run script)
DROP TABLE IF EXISTS todos;

CREATE TABLE todos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(100)  DEFAULT 'General',
  priority    ENUM('low','medium','high') DEFAULT 'medium',
  due_date    DATE,
  status      ENUM('pending','in_progress','done') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data
INSERT INTO todos (title, description, category, priority, due_date, status) VALUES
('Kerjakan tugas Backend',   'Buat REST API CRUD dengan Express dan MySQL', 'Kuliah',    'high',   CURDATE() + INTERVAL 3 DAY,  'in_progress'),
('Beli bahan makanan',       'Beras, telur, sayur, minyak goreng',          'Belanja',   'medium', CURDATE() + INTERVAL 1 DAY,  'pending'),
('Review materi UAS',        'Bab 1 sampai 7 mata kuliah basis data',       'Kuliah',    'high',   CURDATE() + INTERVAL 7 DAY,  'pending'),
('Olahraga pagi',            'Jogging 30 menit di taman',                   'Kesehatan', 'low',    CURDATE(),                   'done'),
('Update portofolio GitHub', 'Upload project-project terbaru',              'Kerja',     'medium', CURDATE() + INTERVAL 5 DAY,  'pending'),
('Bayar tagihan listrik',    NULL,                                          'Pribadi',   'high',   CURDATE() - INTERVAL 1 DAY,  'pending'),
('Baca buku Clean Code',     'Minimal 2 bab per hari',                      'Pribadi',   'low',    CURDATE() + INTERVAL 14 DAY, 'in_progress');
