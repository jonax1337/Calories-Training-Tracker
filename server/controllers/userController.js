const { pool, executeQuery } = require('../config/db');

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const [rows] = await executeQuery(() => pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    ));

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
    const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (existingUser.length > 0) {
      // Update existing user
      // WICHTIGE ÄNDERUNG: Viel robustere Datumsbehandlung mit mehreren Fallbacks
      
      // 1. Priorisieren und validieren des Geburtsdatums mit mehreren Quellen
      let originalBirthDate = birth_date || req.body.birthDate || null;
      let formattedBirthDate = null;
      
      // Wenn kein neues Geburtsdatum gesendet wird, behalte das aktuelle aus der DB
      if (!originalBirthDate) {
        formattedBirthDate = existingUser[0].birth_date;
      } 
      // Wenn ein neues Geburtsdatum gesendet wird
      else {
        // YYYY-MM-DD Format prüfen
        const isCorrectFormat = /^\d{4}-\d{2}-\d{2}$/.test(originalBirthDate);
        
        if (isCorrectFormat) {
          // Bereits im richtigen Format
          formattedBirthDate = originalBirthDate;
        } 
        // ISO-Format mit Zeitstempel (enthält 'T')
        else if (typeof originalBirthDate === 'string' && originalBirthDate.includes('T')) {
          formattedBirthDate = originalBirthDate.split('T')[0];
        }
        // Andere String-Formate versuchen zu parsen
        else if (typeof originalBirthDate === 'string') {
          try {
            const dateObj = new Date(originalBirthDate);
            if (!isNaN(dateObj)) {
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              formattedBirthDate = `${year}-${month}-${day}`;
            } else {
              // Fallback: Behalte existierendes Datum
              formattedBirthDate = existingUser[0].birth_date;
            }
          } catch (e) {
            // Fallback: Behalte existierendes Datum
            formattedBirthDate = existingUser[0].birth_date;
          }
        }
      }
      
      // 2. Gewichtsupdate speziell behandeln
      const weightValue = weight !== undefined ? Number(weight) : existingUser[0].weight;
      
      // 3. SQL-Update ausführen
      await pool.query(
        `UPDATE users SET 
        name = ?, birth_date = ?, age = ?, weight = ?, height = ?, 
        gender = ?, activity_level = ?, daily_calories = ?, daily_protein = ?, 
        daily_carbs = ?, daily_fat = ?, daily_water = ?, weight_goal = ? 
        WHERE id = ?`,
        [
          name || existingUser[0].name, 
          formattedBirthDate, 
          age || existingUser[0].age, 
          weightValue, 
          height || existingUser[0].height, 
          gender || existingUser[0].gender, 
          activityLevel || existingUser[0].activity_level,
          goals?.dailyCalories || existingUser[0].daily_calories, 
          goals?.dailyProtein || existingUser[0].daily_protein, 
          goals?.dailyCarbs || existingUser[0].daily_carbs,
          goals?.dailyFat || existingUser[0].daily_fat, 
          goals?.dailyWater || existingUser[0].daily_water, 
          goals?.weightGoal || existingUser[0].weight_goal, 
          id
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
