const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool with improved settings to prevent ECONNRESET errors
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Return DATE/DATETIME as strings
  enableKeepAlive: true, // Enable keep-alive packets
  keepAliveInitialDelay: 10000, // Send keep-alive packet after 10 seconds of inactivity
  connectTimeout: 60000, // Increase connection timeout to 60 seconds
  // Handle connection errors by automatically reconnecting
  multipleStatements: false, // Security best practice
  typeCast: function (field, next) {
    // Convert TINYINT(1) to boolean
    if (field.type === 'TINY' && field.length === 1) {
      return (field.string() === '1');
    }
    return next();
  }
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

// Implement a ping mechanism to keep connections alive
const PING_INTERVAL = 30000; // 30 seconds
const pingTimer = setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    // console.log('Database ping successful'); // Uncomment for debugging
  } catch (error) {
    console.error('Database ping failed:', error);
  }
}, PING_INTERVAL);

// Handle application shutdown
process.on('SIGINT', () => {
  clearInterval(pingTimer);
  console.log('Database ping mechanism stopped');
  process.exit(0);
});

// Helper function to execute queries with retry mechanism
async function executeQuery(queryFn) {
  const MAX_RETRIES = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;
      
      // Only retry on connection errors
      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log(`Connection error (${error.code}), retry attempt ${attempt}/${MAX_RETRIES}`);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw lastError;
}

module.exports = {
  pool,
  testConnection,
  executeQuery
};