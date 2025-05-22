const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');

// Get all goal types
async function getGoalTypes(req, res) {
  try {
    const connection = await pool.getConnection();
    const [goalTypes] = await connection.query('SELECT * FROM goal_types');
    connection.release();
    
    return res.status(200).json(goalTypes);
  } catch (error) {
    console.error('Error getting goal types:', error);
    return res.status(500).json({ message: 'Fehler beim Abrufen der Zieltypen' });
  }
}

// Get user goals by user ID
async function getUserGoals(req, res) {
  const { userId } = req.params;
  
  try {
    const connection = await pool.getConnection();
    
    // Get user goals with joined goal type info
    const [userGoals] = await connection.query(
      `SELECT ug.*, gt.name as goal_type_name, gt.description as goal_type_description 
       FROM user_goals ug 
       LEFT JOIN goal_types gt ON ug.goal_type_id = gt.id 
       WHERE ug.user_id = ?`,
      [userId]
    );
    
    connection.release();
    
    if (userGoals.length === 0) {
      return res.status(404).json({ message: 'Keine Ziele für diesen Benutzer gefunden' });
    }
    
    return res.status(200).json(userGoals);
  } catch (error) {
    console.error('Error getting user goals:', error);
    return res.status(500).json({ message: 'Fehler beim Abrufen der Benutzerziele' });
  }
}

// Create or update user goal
async function createOrUpdateUserGoal(req, res) {
  const { userId } = req.params;
  const { goalTypeId, isCustom, dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWater } = req.body;
  
  try {
    const connection = await pool.getConnection();
    
    // Check if user exists
    const [userExists] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
    
    if (userExists.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }
    
    // Check if goal type exists (if provided)
    if (goalTypeId) {
      const [goalTypeExists] = await connection.query('SELECT id FROM goal_types WHERE id = ?', [goalTypeId]);
      
      if (goalTypeExists.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Zieltyp nicht gefunden' });
      }
    }
    
    // Check if user already has a goal
    const [existingGoal] = await connection.query('SELECT id FROM user_goals WHERE user_id = ?', [userId]);
    
    const goalId = existingGoal.length > 0 ? existingGoal[0].id : uuidv4();
    
    if (existingGoal.length > 0) {
      // Update existing goal
      await connection.query(
        `UPDATE user_goals SET 
         goal_type_id = ?, 
         is_custom = ?, 
         daily_calories = ?, 
         daily_protein = ?, 
         daily_carbs = ?, 
         daily_fat = ?, 
         daily_water = ? 
         WHERE id = ?`,
        [goalTypeId, isCustom, dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWater, goalId]
      );
    } else {
      // Create new goal
      await connection.query(
        `INSERT INTO user_goals 
         (id, user_id, goal_type_id, is_custom, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [goalId, userId, goalTypeId, isCustom, dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWater]
      );
    }
    
    // Also update user table with the same goal values for backward compatibility
    await connection.query(
      `UPDATE users SET 
       daily_calories = ?, 
       daily_protein = ?, 
       daily_carbs = ?, 
       daily_fat = ?, 
       daily_water = ? 
       WHERE id = ?`,
      [dailyCalories, dailyProtein, dailyCarbs, dailyFat, dailyWater, userId]
    );
    
    connection.release();
    
    // Return the updated/created goal
    return res.status(200).json({ 
      id: goalId,
      userId,
      goalTypeId,
      isCustom,
      dailyCalories,
      dailyProtein,
      dailyCarbs,
      dailyFat,
      dailyWater
    });
  } catch (error) {
    console.error('Error creating/updating user goal:', error);
    return res.status(500).json({ message: 'Fehler beim Erstellen/Aktualisieren des Benutzerziels' });
  }
}

// Delete user goal
async function deleteUserGoal(req, res) {
  const { userId, goalId } = req.params;
  
  try {
    const connection = await pool.getConnection();
    
    // Check if goal exists and belongs to user
    const [goalExists] = await connection.query(
      'SELECT id FROM user_goals WHERE id = ? AND user_id = ?',
      [goalId, userId]
    );
    
    if (goalExists.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Ziel nicht gefunden oder gehört nicht dem Benutzer' });
    }
    
    // Delete goal
    await connection.query('DELETE FROM user_goals WHERE id = ?', [goalId]);
    
    connection.release();
    
    return res.status(200).json({ message: 'Benutzerziel erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting user goal:', error);
    return res.status(500).json({ message: 'Fehler beim Löschen des Benutzerziels' });
  }
}

module.exports = {
  getGoalTypes,
  getUserGoals,
  createOrUpdateUserGoal,
  deleteUserGoal
};
