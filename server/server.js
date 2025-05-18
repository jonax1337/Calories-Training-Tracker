const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import initialization utility
const { initServer } = require('./utils/initServer');

// Import routes
const userRoutes = require('./routes/users');
const foodItemsRoutes = require('./routes/foodItems');
const dailyLogsRoutes = require('./routes/dailyLogs');
const favoritesRoutes = require('./routes/favorites');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/food-items', foodItemsRoutes);
app.use('/api/daily-logs', dailyLogsRoutes);
app.use('/api/favorites', favoritesRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Calories Training Tracker API is running');
});

// Initialize database and start server
initServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
