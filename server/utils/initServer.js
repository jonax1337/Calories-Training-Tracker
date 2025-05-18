const { testConnection } = require('../config/db');
const { initializeDatabase } = require('../config/db-init');
const { initDefaultData } = require('./initDefaultData');

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
  
  // Initialize default data if needed
  try {
    await initDefaultData();
  } catch (error) {
    console.error('Warning: Failed to initialize default data:', error);
    // Continue server startup even if default data initialization fails
  }
  
  console.log('Server initialization completed successfully.');
}

module.exports = { initServer };
