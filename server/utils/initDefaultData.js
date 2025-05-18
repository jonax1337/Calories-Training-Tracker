const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Default user ID - must match the one used in the frontend
const DEFAULT_USER_ID = 'default_user_id';

async function initDefaultData() {
  console.log('Checking for default data initialization...');
  const connection = await pool.getConnection();
  
  try {
    // Check if default user exists
    const [users] = await connection.query('SELECT id FROM users WHERE id = ?', [DEFAULT_USER_ID]);
    
    if (users.length === 0) {
      console.log('Creating default user...');
      
      // Create default user profile
      await connection.query(
        `INSERT INTO users (
          id, name, birth_date, age, weight, height, gender, activity_level,
          daily_calories, daily_protein, daily_carbs, daily_fat, daily_water, weight_goal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          DEFAULT_USER_ID,
          'Default User',
          null,
          30,
          70,  // 70kg
          175, // 175cm
          'male',
          'moderately_active',
          2000, // daily calories
          150,  // protein
          200,  // carbs
          70,   // fat
          2000, // water in ml
          65    // weight goal
        ]
      );
      
      // Create some default food items
      const defaultFoods = [
        {
          id: uuidv4(),
          name: 'Chicken Breast',
          brand: 'Generic',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          serving_size: '100g',
          serving_size_grams: 100
        },
        {
          id: uuidv4(),
          name: 'Brown Rice',
          brand: 'Generic',
          calories: 112,
          protein: 2.6,
          carbs: 23.5,
          fat: 0.9,
          serving_size: '100g cooked',
          serving_size_grams: 100
        },
        {
          id: uuidv4(),
          name: 'Broccoli',
          brand: 'Generic',
          calories: 34,
          protein: 2.8,
          carbs: 7,
          fat: 0.4,
          serving_size: '100g',
          serving_size_grams: 100
        }
      ];
      
      for (const food of defaultFoods) {
        await connection.query(
          `INSERT INTO food_items (
            id, name, brand, calories, protein, carbs, fat, 
            serving_size, serving_size_grams
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            food.id,
            food.name,
            food.brand,
            food.calories,
            food.protein,
            food.carbs,
            food.fat,
            food.serving_size,
            food.serving_size_grams
          ]
        );
      }
      
      // Create a default daily log for today
      const today = new Date().toISOString().split('T')[0];
      const [result] = await connection.query(
        'INSERT INTO daily_logs (date, user_id, water_intake, daily_notes) VALUES (?, ?, ?, ?)',
        [today, DEFAULT_USER_ID, 0, 'Initial daily log']
      );
      
      console.log('Default data initialized successfully!');
    } else {
      console.log('Default user already exists, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { initDefaultData };
