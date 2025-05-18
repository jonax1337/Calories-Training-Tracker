const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// GET / - Get favorite food IDs for a user
router.get('/', favoriteController.getFavoriteFoodIds);

// POST /toggle - Toggle favorite status for a food item
router.post('/toggle', favoriteController.toggleFavoriteFood);

module.exports = router;
