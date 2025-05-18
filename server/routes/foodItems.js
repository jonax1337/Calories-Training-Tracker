const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItemController');

// GET / - Get all food items
router.get('/', foodItemController.getFoodItems);

// GET /:id - Get food item by ID
router.get('/:id', foodItemController.getFoodItemById);

// POST / - Create or update food item
router.post('/', foodItemController.saveFoodItem);

// DELETE /:id - Delete food item
router.delete('/:id', foodItemController.deleteFoodItem);

module.exports = router;
