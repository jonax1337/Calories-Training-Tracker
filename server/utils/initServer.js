const { testConnection } = require('../config/db');
const { initializeDatabase } = require('../config/db-init');
const { initializeUserGoals } = require('../config/user-goals-init');

async function initServer() {
  console.log('Initializing server...');
  
  // Test database connection
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.error('Failed to connect to database. Please check your configuration.');
    process.exit(1);
  }
  
  // Initialize database schema
  const initialized = await initializeDatabase();
  
  if (!initialized) {
    console.error('Failed to initialize database schema. Please check the error logs.');
    process.exit(1);
  }
  
  // Initialize user goals tables
  const userGoalsInitialized = await initializeUserGoals();
  
  if (!userGoalsInitialized) {
    console.error('Failed to initialize user goals tables. Please check the error logs.');
    process.exit(1);
  }
  
  // Database is initialized and schema is ready
  
  console.log('Server initialization completed successfully.');
}

module.exports = { initServer };
