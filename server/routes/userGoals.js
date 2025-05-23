const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { 
  getGoalTypes, 
  getUserGoals, 
  createOrUpdateUserGoal, 
  deleteUserGoal 
} = require('../controllers/userGoalsController');

// Get all goal types (no authentication required for types)
router.get('/types', getGoalTypes);

// Get user goals - requires authentication
router.get('/:userId', authenticate, getUserGoals);

// Create or update user goal - requires authentication
router.post('/:userId', authenticate, createOrUpdateUserGoal);

// Delete user goal - requires authentication
router.delete('/:userId/:goalId', authenticate, deleteUserGoal);

module.exports = router;
