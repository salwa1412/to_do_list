# ✦ Taskly — To Do List App

Aplikasi manajemen tugas berbasis web dengan **Node.js + Express + MySQL**.

## ✨ Fitur Baru (v2.0)

- ✅ CRUD lengkap (Create, Read, Update, Delete)
- 📊 Dashboard statistik real-time (Total, Pending, On Progress, Selesai, Overdue)
- 🏷️ Kategori task (Kuliah, Kerja, Pribadi, dll.)
- 🔴 Prioritas task (High / Medium / Low)
- 📅 Due date + deteksi overdue otomatis
- 🔄 Status task (Pending → In Progress → Done)
- 🔍 Search & filter (status, prioritas)
- 🌙 Dark mode
- 🗑️ Hapus semua task selesai sekaligus
- 📋 Modal detail task

## 🗂️ Struktur Proyek

```
to_do_list/
├── controller/
│   └── todoController.js   # Logic CRUD
├── middleware/
│   └── authMiddleware.js   # Logger & validator
├── route/
│   └── todoRoutes.js       # Definisi endpoint
├── public/
│   ├── index.html          # Halaman utama
│   ├── css/style.css       # Styling
│   └── js/app.js           # Frontend logic
├── db.js                   # Koneksi MySQL
├── server.js               # Entry point
├── .env.example            # Contoh konfigurasi
└── package.json
```

## 🚀 Cara Menjalankan

### 1. Clone repo

```bash
git clone https://github.com/salwa1412/to_do_list.git
cd to_do_list
```

### 2. Install dependencies

```bash
npm install
```

### 3. Buat database MySQL

```bash
mysql -u root -p < database.sql
```

### 4. Konfigurasi environment

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi database kamu
```

### 5. Jalankan server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Buka browser: **http://localhost:3000**

## 🌐 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/todos` | Ambil semua todo (support filter & search) |
| GET | `/api/todos/stats` | Statistik todo |
| GET | `/api/todos/:id` | Ambil todo by ID |
| POST | `/api/todos` | Buat todo baru |
| PUT | `/api/todos/:id` | Update todo |
| PATCH | `/api/todos/:id/status` | Update status saja |
| DELETE | `/api/todos/:id` | Hapus todo |
| DELETE | `/api/todos/clear-done` | Hapus semua yang selesai |

### Query Parameters (GET /api/todos)

| Param | Contoh | Deskripsi |
|-------|--------|-----------|
| `search` | `?search=tugas` | Cari berdasarkan judul |
| `status` | `?status=pending` | Filter status |
| `priority` | `?priority=high` | Filter prioritas |
| `category` | `?category=Kuliah` | Filter kategori |

### Contoh Request Body (POST/PUT)

```json
{
  "title": "Kerjakan tugas Backend",
  "description": "Buat REST API CRUD",
  "category": "Kuliah",
  "priority": "high",
  "due_date": "2025-12-31",
  "status": "pending"
}
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Font**: Syne + DM Sans (Google Fonts)

## 📝 Lisensi

MIT
