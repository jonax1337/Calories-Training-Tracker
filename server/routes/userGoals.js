const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { 
  getGoalTypes, 
  getUserGoals, 
  createOrUpdateUserGoal, 
  deleteUserGoal 
} = require('../controllers/userGoalsController');

// Get all goal types (no authentication required for types)
router.get('/types', getGoalTypes);

// Get user goals - requires authentication
router.get('/:userId', authenticateJWT, getUserGoals);

// Create or update user goal - requires authentication
router.post('/:userId', authenticateJWT, createOrUpdateUserGoal);

// Delete user goal - requires authentication
router.delete('/:userId/:goalId', authenticateJWT, deleteUserGoal);

module.exports = router;
