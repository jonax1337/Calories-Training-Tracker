const { pool } = require('../config/db');

// Get favorite food IDs for a user
exports.getFavoriteFoodIds = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const [rows] = await pool.query(
      'SELECT food_item_id FROM favorite_foods WHERE user_id = ?',
      [userId]
    );
    
    const favoriteIds = rows.map(row => row.food_item_id);
    
    res.status(200).json(favoriteIds);
  } catch (error) {
    console.error('Error getting favorite food IDs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle favorite status for a food item
exports.toggleFavoriteFood = async (req, res) => {
  try {
    const { userId, foodId } = req.body;
    
    if (!userId || !foodId) {
      return res.status(400).json({ message: 'User ID and Food ID are required' });
    }
    
    // Check if the food item is already a favorite
    const [existing] = await pool.query(
      'SELECT id FROM favorite_foods WHERE user_id = ? AND food_item_id = ?',
      [userId, foodId]
    );
    
    let isFavorite;
    
    if (existing.length > 0) {
      // Remove from favorites
      await pool.query(
        'DELETE FROM favorite_foods WHERE user_id = ? AND food_item_id = ?',
        [userId, foodId]
      );
      isFavorite = false;
    } else {
      // Add to favorites
      await pool.query(
        'INSERT INTO favorite_foods (user_id, food_item_id) VALUES (?, ?)',
        [userId, foodId]
      );
      isFavorite = true;
    }
    
    res.status(200).json({
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      isFavorite: isFavorite
    });
  } catch (error) {
    console.error('Error toggling favorite food:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
