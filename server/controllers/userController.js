const { pool } = require('../config/db');

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    
    // Transform database model to app model
    const userProfile = {
      id: user.id,
      name: user.name,
      birthDate: user.birth_date,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      activityLevel: user.activity_level,
      goals: {
        dailyCalories: user.daily_calories,
        dailyProtein: user.daily_protein,
        dailyCarbs: user.daily_carbs,
        dailyFat: user.daily_fat,
        dailyWater: user.daily_water,
        weightGoal: user.weight_goal
      }
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create or update user profile
exports.saveUserProfile = async (req, res) => {
  try {
    const { 
      id, name, birth_date, age, weight, height, gender, activityLevel, goals 
    } = req.body;

    // Check if user exists
    const [existingUser] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    
    if (existingUser.length > 0) {
      // Update existing user
      // Format birth_date to YYYY-MM-DD format (MySQL format)
      let formattedBirthDate = birth_date;
      if (birth_date && typeof birth_date === 'string' && birth_date.includes('T')) {
        // If ISO format, extract just the date part 
        formattedBirthDate = birth_date.split('T')[0];
      }
      
      await pool.query(
        `UPDATE users SET 
        name = ?, birth_date = ?, age = ?, weight = ?, height = ?, 
        gender = ?, activity_level = ?, daily_calories = ?, daily_protein = ?, 
        daily_carbs = ?, daily_fat = ?, daily_water = ?, weight_goal = ? 
        WHERE id = ?`,
        [
          name, formattedBirthDate, age, weight, height, gender, activityLevel,
          goals?.dailyCalories, goals?.dailyProtein, goals?.dailyCarbs,
          goals?.dailyFat, goals?.dailyWater, goals?.weightGoal, id
        ]
      );
      
      res.status(200).json({ message: 'User profile updated successfully' });
    } else {
      // Create new user
      // Format birth_date (if necessary, though for new user it should be YYYY-MM-DD from client)
      let formattedBirthDateForInsert = birth_date;
      if (birth_date && typeof birth_date === 'string' && birth_date.includes('T')) {
        formattedBirthDateForInsert = birth_date.split('T')[0];
      }

      await pool.query(
        `INSERT INTO users (
          id, name, birth_date, age, weight, height, gender, activity_level,
          daily_calories, daily_protein, daily_carbs, daily_fat, daily_water, weight_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, name, formattedBirthDateForInsert, age, weight, height, gender, activityLevel,
          goals?.dailyCalories, goals?.dailyProtein, goals?.dailyCarbs,
          goals?.dailyFat, goals?.dailyWater, goals?.weightGoal
        ]
      );
      
      res.status(201).json({ message: 'User profile created successfully' });
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
