const { pool } = require('../config/db');
const dateUtils = require('../utils/date-utils');

// Get all daily logs for a user
exports.getDailyLogs = async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Get all daily logs for the user
    const [logs] = await pool.query(
      'SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    
    // For each log, get the food entries
    const logsWithEntries = await Promise.all(logs.map(async (log) => {
      const [entries] = await pool.query(
        `SELECT fe.*, fi.id, fi.name, fi.brand, fi.barcode, fi.calories, fi.protein, fi.carbs, fi.fat, 
         fi.sugar, fi.fiber, fi.sodium, fi.potassium, fi.vitamin_a, fi.vitamin_b12, fi.vitamin_c, fi.vitamin_d,
         fi.calcium, fi.iron, fi.magnesium, fi.zinc, fi.serving_size, fi.serving_size_grams, fi.image
         FROM food_entries fe 
         JOIN food_items fi ON fe.food_item_id = fi.id 
         WHERE fe.daily_log_id = ? 
         ORDER BY fe.time_consumed`,
        [log.id]
      );
      
      // Transform entries to app model
      const foodEntries = entries.map(entry => ({
        id: entry.id,
        foodItem: {
          id: entry.food_item_id,
          name: entry.name,
          brand: entry.brand,
          barcode: entry.barcode,
          nutrition: {
            calories: entry.calories,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            sugar: entry.sugar,
            fiber: entry.fiber,
            sodium: entry.sodium,
            potassium: entry.potassium,
            vitaminA: entry.vitamin_a,
            vitaminB12: entry.vitamin_b12,
            vitaminC: entry.vitamin_c,
            vitaminD: entry.vitamin_d,
            calcium: entry.calcium,
            iron: entry.iron,
            magnesium: entry.magnesium,
            zinc: entry.zinc,
            servingSize: entry.serving_size,
            servingSizeGrams: entry.serving_size_grams
          },
          image: entry.image
        },
        servingAmount: entry.serving_amount,
        mealType: entry.meal_type,
        timeConsumed: entry.time_consumed
      }));
      
      // Return the daily log with its entries
      return {
        date: dateUtils.formatToLocalISODate(log.date),
        foodEntries: foodEntries,
        waterIntake: log.water_intake,
        weight: log.weight || null,
        dailyNotes: log.daily_notes,
        isCheatDay: log.is_cheat_day === 1 || false // Konvertiere DB-Boolean (0/1) zu JavaScript-Boolean
      };
    }));
    
    res.status(200).json(logsWithEntries);
  } catch (error) {
    console.error('Error getting daily logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get daily log by date for a user
exports.getDailyLogByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Get the daily log
    const [logs] = await pool.query(
      'SELECT * FROM daily_logs WHERE date = ? AND user_id = ?',
      [date, userId]
    );
    
    if (logs.length === 0) {
      return res.status(404).json({ message: 'Daily log not found' });
    }
    
    const log = logs[0];
    
    // Get food entries for this log
    const [entries] = await pool.query(
      `SELECT fe.id as entry_id, fe.daily_log_id, fe.food_item_id, fe.serving_amount, fe.meal_type, fe.time_consumed,
              fi.id as food_id, fi.name, fi.brand, fi.barcode, fi.calories, fi.protein, fi.carbs, fi.fat, 
              fi.sugar, fi.fiber, fi.sodium, fi.potassium, fi.vitamin_a, fi.vitamin_b12, fi.vitamin_c, fi.vitamin_d,
              fi.calcium, fi.iron, fi.magnesium, fi.zinc, fi.serving_size, fi.serving_size_grams, fi.image
       FROM food_entries fe 
       JOIN food_items fi ON fe.food_item_id = fi.id 
       WHERE fe.daily_log_id = ? 
       ORDER BY fe.time_consumed`,
      [log.id]
    );
    
    if (entries.length > 0) {
    }
    
    // Transform entries to app model using the correct column aliases from our SQL query
    const foodEntries = entries.map(entry => ({
      id: entry.entry_id, // Using the aliased column entry_id instead of id
      foodItem: {
        id: entry.food_id, // Using the aliased food_id from our query
        name: entry.name,
        brand: entry.brand,
        barcode: entry.barcode,
        nutrition: {
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          sugar: entry.sugar,
          fiber: entry.fiber,
          sodium: entry.sodium,
          potassium: entry.potassium,
          vitaminA: entry.vitamin_a,
          vitaminB12: entry.vitamin_b12,
          vitaminC: entry.vitamin_c,
          vitaminD: entry.vitamin_d,
          calcium: entry.calcium,
          iron: entry.iron,
          magnesium: entry.magnesium,
          zinc: entry.zinc,
          servingSize: entry.serving_size,
          servingSizeGrams: entry.serving_size_grams
        },
        image: entry.image
      },
      servingAmount: entry.serving_amount,
      mealType: entry.meal_type,
      timeConsumed: entry.time_consumed
    }));
    
    // Return the daily log with its entries
    return res.status(200).json({
      date: dateUtils.formatToLocalISODate(log.date),
      foodEntries: foodEntries,
      waterIntake: log.water_intake,
      weight: log.weight || null,
      dailyNotes: log.daily_notes,
      isCheatDay: log.is_cheat_day === 1 // Konvertiere DB-Boolean (0/1) zu JavaScript-Boolean
    });
  } catch (error) {
    console.error('Error getting daily log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save daily log
exports.saveDailyLog = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { date, foodEntries, waterIntake, weight, dailyNotes, userId, isCheatDay } = req.body;
    
    // Log für Debugging-Zwecke
    console.log('Received isCheatDay flag:', isCheatDay);
    console.log('Received weight:', weight);
    
    // Gewicht-Handling: Falls kein Gewicht angegeben wurde, holen wir das zuletzt bekannte Gewicht
    let userWeight = weight;
    if (userWeight === undefined || userWeight === null) {
      console.log('No weight provided, fetching most recent weight for user', userId);
      
      // Schritt 1: Letzten Logeintrag mit Gewicht für diesen Benutzer finden
      const [lastWeightRecords] = await connection.query(
        'SELECT weight FROM daily_logs WHERE user_id = ? AND weight IS NOT NULL ORDER BY date DESC LIMIT 1',
        [userId]
      );
      
      if (lastWeightRecords.length > 0 && lastWeightRecords[0].weight) {
        userWeight = lastWeightRecords[0].weight;
        console.log('Found previous weight in daily logs:', userWeight);
      } else {
        // Schritt 2: Falls kein Gewicht in den Logs gefunden wurde, im Benutzerprofil nachschauen
        console.log('No weight in daily logs, checking user profile');
        const [userRecords] = await connection.query(
          'SELECT weight FROM users WHERE id = ? AND weight IS NOT NULL',
          [userId]
        );
        
        if (userRecords.length > 0 && userRecords[0].weight) {
          userWeight = userRecords[0].weight;
          console.log('Found weight in user profile:', userWeight);
        } else {
          console.log('No weight found in user profile either');
          userWeight = null;
        }
      }
    }
    
    if (date) {
      const currentDate = new Date();
      console.log('Current server time:', currentDate.toISOString());
      console.log('Current server local date components:', {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate()
      });
    }
    
    // Ensure waterIntake is a valid number
    const sanitizedWaterIntake = typeof waterIntake === 'number' ? Math.max(0, waterIntake) : 0;
    
    // Use the date-utils to ensure consistent date format
    let normalizedDate = dateUtils.parseDateString(date);
    
    // If no date is provided, use today's date
    if (!normalizedDate) {
      normalizedDate = dateUtils.getTodayFormatted();
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if log exists for this date and user
    const [existingLogs] = await connection.query(
      'SELECT id FROM daily_logs WHERE date = ? AND user_id = ?',
      [normalizedDate, userId]
    );
    
    let logId;
    
    if (existingLogs.length > 0) {
      // Update existing log
      logId = existingLogs[0].id;
      await connection.query(
        'UPDATE daily_logs SET water_intake = ?, weight = ?, daily_notes = ?, is_cheat_day = ? WHERE id = ?',
        [sanitizedWaterIntake, userWeight, dailyNotes, isCheatDay ? 1 : 0, logId]
      );
      
      console.log(`Updated daily log ${logId} with water intake: ${sanitizedWaterIntake}ml`);
      
      // Delete existing food entries for this log
      await connection.query(
        'DELETE FROM food_entries WHERE daily_log_id = ?',
        [logId]
      );
    } else {
      // Create new log
      const [result] = await connection.query(
        'INSERT INTO daily_logs (date, user_id, water_intake, weight, daily_notes, is_cheat_day) VALUES (?, ?, ?, ?, ?, ?)',
        [normalizedDate, userId, sanitizedWaterIntake, userWeight, dailyNotes, isCheatDay ? 1 : 0]
      );
      
      console.log(`Created new daily log for date ${normalizedDate} with water intake: ${sanitizedWaterIntake}ml`);
      
      logId = result.insertId;
    }
    
    // Insert food entries
    if (foodEntries && foodEntries.length > 0) {
      for (const entry of foodEntries) {
        // Format the timestamp to be MySQL compatible using our utility function
        let formattedTimeConsumed;
        
        try {
          if (entry.timeConsumed) {
            // Use our utility function to convert to MySQL format
            const timeDate = new Date(entry.timeConsumed);
            formattedTimeConsumed = dateUtils.dateToMySQLDateTime(timeDate);
            console.log(`Formatted time_consumed from ${entry.timeConsumed} to ${formattedTimeConsumed}`);
          } else {
            // No time provided, use current time
            formattedTimeConsumed = dateUtils.dateToMySQLDateTime();
            console.log(`No time provided, using current time: ${formattedTimeConsumed}`);
          }
        } catch (timeError) {
          // Handle any errors in date conversion
          console.error('Error formatting time:', timeError);
          formattedTimeConsumed = dateUtils.dateToMySQLDateTime();
          console.log(`Error in time format, using current time: ${formattedTimeConsumed}`);
        }

        await connection.query(
          `INSERT INTO food_entries (
            id, daily_log_id, food_item_id, serving_amount, meal_type, time_consumed
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            entry.id,
            logId,
            entry.foodItem.id,
            entry.servingAmount,
            entry.mealType,
            formattedTimeConsumed
          ]
        );
      }
    }
    
    await connection.commit();
    
    res.status(200).json({
      message: 'Daily log saved successfully',
      logId: logId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving daily log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};
