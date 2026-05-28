require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const authroute = require('./route/authroute');
const taskroute = require('./route/taskroute');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authroute);
app.use('/api/task', taskroute);
app.use(express.static(path.join(__dirname, "public")));

// test route
app.get('/', (req, res) => {
  res.send('API Todo List berjalan');
});

// test database
pool.connect()
  .then(() => {
    console.log('Database connected');
  })
  .catch((err) => {
    console.log('Database error:', err);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});