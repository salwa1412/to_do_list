// route/authroute.js
const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../controller/authcontroller');

// Import middleware
const middleware = require('../middleware/authMiddleware');
const validateRegister = middleware.validateRegister; // ✅ Untuk register
const validateLogin = middleware.validateLogin;       // ✅ Untuk login

// REGISTER - butuh validasi nama, email, password
router.post('/register', validateRegister, authController.register);

// LOGIN - hanya butuh email & password (TANPA validasi nama!)
router.post('/login', validateLogin, authController.login);

module.exports = router;