const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /:id - Get user profile by ID
router.get('/:id', userController.getUserProfile);

// POST / - Create or update user profile
router.post('/', userController.saveUserProfile);

module.exports = router;
