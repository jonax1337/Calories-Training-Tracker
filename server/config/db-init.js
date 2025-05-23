const { pool } = require('./db');

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create users table with authentication fields
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        birth_date DATE,
        age INT,
        weight FLOAT,
        height FLOAT,
        gender ENUM('male', 'female', 'divers'),
        activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'),
        daily_calories INT,
        daily_protein FLOAT,
        daily_carbs FLOAT,
        daily_fat FLOAT,
        daily_water FLOAT,
        weight_goal FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Create food_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        barcode VARCHAR(100),
        calories FLOAT NOT NULL,
        protein FLOAT NOT NULL,
        carbs FLOAT NOT NULL,
        fat FLOAT NOT NULL,
        sugar FLOAT,
        fiber FLOAT,
        sodium FLOAT,
        serving_size VARCHAR(100) NOT NULL,
        serving_size_grams FLOAT NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Create daily_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        water_intake FLOAT NOT NULL DEFAULT 0,
        daily_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (date, user_id)
      );
    `);
    
    // Create food_entries table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS food_entries (
        id VARCHAR(36) PRIMARY KEY,
        daily_log_id INT NOT NULL,
        food_item_id VARCHAR(36) NOT NULL,
        serving_amount FLOAT NOT NULL,
        meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
        time_consumed DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
      );
    `);
    
    // Create goal_types table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS goal_types (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_custom BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    // Create user_goals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_goals (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        goal_type_id VARCHAR(36),
        is_custom BOOLEAN DEFAULT FALSE,
        daily_calories INT,
        daily_protein FLOAT,
        daily_carbs FLOAT,
        daily_fat FLOAT,
        daily_water FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (goal_type_id) REFERENCES goal_types(id) ON DELETE SET NULL
      );
    `);

    // Insert default goal types
    const defaultGoalTypes = [
        { id: 'gain', name: 'Gesunde Gewichtszunahme', description: 'Für Personen mit Untergewicht oder Muskelaufbau-Ziel.', is_custom: false },
        { id: 'maintain', name: 'Gewicht halten & Fitness verbessern', description: 'Für Personen mit Normalgewicht, die ihre Fitness verbessern möchten.', is_custom: false },
        { id: 'lose_moderate', name: 'Moderate Gewichtsreduktion', description: 'Für leichtes Übergewicht, langsamer aber nachhaltiger Gewichtsverlust.', is_custom: false },
        { id: 'lose_fast', name: 'Gesunde Gewichtsreduktion', description: 'Für stärkeres Übergewicht, schnellerer Gewichtsverlust.', is_custom: false },
        { id: 'custom', name: 'Benutzerdefiniert', description: 'Eigene Ziele manuell festlegen.', is_custom: true },
      ];

    for (const goalType of defaultGoalTypes) {
      await connection.query(
        'INSERT IGNORE INTO goal_types (id, name, description, is_custom) VALUES (?, ?, ?, ?)',
        [goalType.id, goalType.name, goalType.description, goalType.is_custom]
      );
    }
    
    console.log('Database schema and user goals initialized successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

module.exports = { initializeDatabase };
