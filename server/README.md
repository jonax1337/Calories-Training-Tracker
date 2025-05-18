# Calories Training Tracker Backend Server

This is the backend server for the Calories Training Tracker application. It provides a REST API for storing and retrieving user profiles, food items, daily logs, and favorite foods.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)

### Installation

1. Navigate to the server directory
   ```
   cd server
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure the database
   - Create a MySQL database named `calories_tracker`
   - Update the `.env` file with your MySQL credentials:
     ```
     DB_HOST=localhost
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=calories_tracker
     PORT=3001
     ```

4. Start the server
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### User Profiles

- **GET** `/api/users/:id` - Get user profile by ID
- **POST** `/api/users` - Create or update user profile

### Food Items

- **GET** `/api/food-items` - Get all food items
- **GET** `/api/food-items/:id` - Get food item by ID
- **POST** `/api/food-items` - Create or update food item
- **DELETE** `/api/food-items/:id` - Delete food item

### Daily Logs

- **GET** `/api/daily-logs?userId=:userId` - Get all daily logs for a user
- **GET** `/api/daily-logs/:date?userId=:userId` - Get daily log by date for a user
- **POST** `/api/daily-logs` - Create or update daily log

### Favorites

- **GET** `/api/favorites?userId=:userId` - Get favorite food IDs for a user
- **POST** `/api/favorites/toggle` - Toggle favorite status for a food item

## Database Schema

The database includes the following tables:

- **users** - Stores user profiles and their nutrition goals
- **food_items** - Stores food items with nutrition information
- **daily_logs** - Stores daily logs with water intake and notes
- **food_entries** - Stores food entries for each daily log
- **favorite_foods** - Stores favorite food items for each user

## Frontend Integration

To integrate with the frontend, you'll need to modify the storage-service.ts file to use API calls instead of AsyncStorage.
