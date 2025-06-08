const { pool } = require('../config/db');

// Get all food items
exports.getFoodItems = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM food_items');
    
    // Map DB rows to app model
    const foodItems = rows.map(item => ({
      id: item.id,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        sugar: item.sugar,
        fiber: item.fiber,
        sodium: item.sodium,
        potassium: item.potassium,
        servingSize: item.serving_size,
        servingSizeGrams: item.serving_size_grams
      },
      image: item.image
    }));
    
    res.status(200).json(foodItems);
  } catch (error) {
    console.error('Error getting food items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get food item by ID
exports.getFoodItemById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM food_items WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    const item = rows[0];
    
    // Transform to app model
    const foodItem = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      barcode: item.barcode,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        sugar: item.sugar,
        fiber: item.fiber,
        sodium: item.sodium,
        potassium: item.potassium,
        servingSize: item.serving_size,
        servingSizeGrams: item.serving_size_grams
      },
      image: item.image
    };

    res.status(200).json(foodItem);
  } catch (error) {
    console.error('Error getting food item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save (Create or Update) food item
exports.saveFoodItem = async (req, res) => {
  try {
    const { id, name, brand, barcode, nutrition, image } = req.body;
    
    // Check if food item exists
    const [existingItem] = await pool.query(
      'SELECT id FROM food_items WHERE id = ?',
      [id]
    );
    
    if (existingItem.length > 0) {
      // Update existing food item
      await pool.query(
        `UPDATE food_items SET 
         name = ?, brand = ?, barcode = ?, calories = ?, 
         protein = ?, carbs = ?, fat = ?, sugar = ?, 
         fiber = ?, sodium = ?, potassium = ?, serving_size = ?, 
         serving_size_grams = ?, image = ? 
         WHERE id = ?`,
        [
          name, brand, barcode, nutrition.calories,
          nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.sugar,
          nutrition.fiber, nutrition.sodium, nutrition.potassium, nutrition.servingSize,
          nutrition.servingSizeGrams, image, id
        ]
      );
      
      res.status(200).json({ message: 'Food item updated successfully' });
    } else {
      // Create new food item
      await pool.query(
        `INSERT INTO food_items (
          id, name, brand, barcode, calories, protein, 
          carbs, fat, sugar, fiber, sodium, potassium, serving_size, 
          serving_size_grams, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, name, brand, barcode, nutrition.calories,
          nutrition.protein, nutrition.carbs, nutrition.fat, nutrition.sugar,
          nutrition.fiber, nutrition.sodium, nutrition.potassium, nutrition.servingSize,
          nutrition.servingSizeGrams, image
        ]
      );
      
      res.status(201).json({ message: 'Food item created successfully' });
    }
  } catch (error) {
    console.error('Error saving food item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete food item
exports.deleteFoodItem = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM food_items WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
