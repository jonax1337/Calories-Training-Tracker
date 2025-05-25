const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /register - Register a new user
router.post('/register', authController.register);

// POST /login - Login a user
router.post('/login', authController.login);

// GET /check-email - Check if email already exists
router.get('/check-email', authController.checkEmailExists);

// GET /me - Get current user (protected route)
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
