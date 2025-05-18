const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import initialization utility
const { initServer } = require('./utils/initServer');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const foodItemsRoutes = require('./routes/foodItems');
const dailyLogsRoutes = require('./routes/dailyLogs');
const favoritesRoutes = require('./routes/favorites');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS to allow all origins in development
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use routes
app.use('/api/auth', authRoutes);
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
