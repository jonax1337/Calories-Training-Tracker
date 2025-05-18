const { pool } = require('../config/db');

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
        `SELECT fe.*, fi.* 
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
        date: log.date.toISOString().split('T')[0],
        foodEntries: foodEntries,
        waterIntake: log.water_intake,
        dailyNotes: log.daily_notes
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
      `SELECT fe.*, fi.* 
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
    const dailyLog = {
      date: log.date.toISOString().split('T')[0],
      foodEntries: foodEntries,
      waterIntake: log.water_intake,
      dailyNotes: log.daily_notes
    };
    
    res.status(200).json(dailyLog);
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
    
    const { date, foodEntries, waterIntake, dailyNotes, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if log exists for this date and user
    const [existingLogs] = await connection.query(
      'SELECT id FROM daily_logs WHERE date = ? AND user_id = ?',
      [date, userId]
    );
    
    let logId;
    
    if (existingLogs.length > 0) {
      // Update existing log
      logId = existingLogs[0].id;
      await connection.query(
        'UPDATE daily_logs SET water_intake = ?, daily_notes = ? WHERE id = ?',
        [waterIntake, dailyNotes, logId]
      );
      
      // Delete existing food entries for this log
      await connection.query(
        'DELETE FROM food_entries WHERE daily_log_id = ?',
        [logId]
      );
    } else {
      // Create new log
      const [result] = await connection.query(
        'INSERT INTO daily_logs (date, user_id, water_intake, daily_notes) VALUES (?, ?, ?, ?)',
        [date, userId, waterIntake, dailyNotes]
      );
      
      logId = result.insertId;
    }
    
    // Insert food entries
    if (foodEntries && foodEntries.length > 0) {
      for (const entry of foodEntries) {
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
            entry.timeConsumed
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
