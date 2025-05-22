const { pool } = require('./db');

async function initializeUserGoals() {
  try {
    const connection = await pool.getConnection();
    
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
      { id: 'weight_loss', name: 'Gewichtsabnahme', description: 'Empfohlen für Personen, die Gewicht verlieren möchten', is_custom: false },
      { id: 'maintenance', name: 'Gewicht halten', description: 'Empfohlen für Personen, die ihr aktuelles Gewicht halten möchten', is_custom: false },
      { id: 'weight_gain', name: 'Gewichtszunahme', description: 'Empfohlen für Personen, die Gewicht zunehmen möchten', is_custom: false },
      { id: 'custom', name: 'Benutzerdefiniert', description: 'Benutzerdefinierte Ziele', is_custom: true }
    ];

    for (const goalType of defaultGoalTypes) {
      await connection.query(
        'INSERT IGNORE INTO goal_types (id, name, description, is_custom) VALUES (?, ?, ?, ?)',
        [goalType.id, goalType.name, goalType.description, goalType.is_custom]
      );
    }
    
    console.log('User goals tables and default goal types created successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error initializing user goals:', error);
    return false;
  }
}

module.exports = { initializeUserGoals };
