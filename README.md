# Calories Training Tracker

[![React Native](https://img.shields.io/badge/React_Native-0.79.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.9-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

A comprehensive cross-platform mobile application for precise nutrition tracking, fitness monitoring, and health goal management, built with modern React Native technology and advanced backend infrastructure.

## Overview

Calories Training Tracker is a professional-grade health and fitness application that combines precise calorie counting with advanced training tools. The application provides users with comprehensive nutrition tracking, HIIT timer functionality, hydration monitoring, and detailed progress analytics through an intuitive mobile interface.

**Key Features:**
- Cross-platform iOS and Android support via React Native and Expo
- Real-time nutrition and calorie tracking with barcode scanning capability
- Integrated HIIT timer with customizable intervals
- Advanced water tracking with animated visualizations
- Secure JWT-based authentication system
- Native health platform integration (HealthKit and Google Fit)
- Comprehensive dark and light theme support

## Core Functionality

### Nutrition Management
The application provides detailed nutritional analysis including calorie, protein, carbohydrate, and fat tracking. Users can input food items through barcode scanning using the integrated camera system or manual entry with custom nutritional data. The portion calculator automatically adjusts serving sizes and recalculates nutritional values accordingly.

### Fitness Integration
The built-in HIIT timer offers fully configurable high-intensity interval training with customizable work and rest periods, adjustable round counts, and audio-haptic feedback. The application integrates with native health APIs for bidirectional synchronization with HealthKit and Google Fit platforms.

### Analytics and Reporting
Users receive comprehensive daily, weekly, and monthly progress summaries through an interactive dashboard. The system includes BMI tracking, goal management, and long-term trend analysis with WebView-based animated visualizations.

## Technology Stack

### Frontend Architecture
- **Framework:** React Native 0.79.2 with Expo 53.0.9
- **Language:** TypeScript 5.8.3 with strict type checking
- **Styling:** Styled-Components 6.1.18 with React Native Reanimated 3.17.5
- **Navigation:** React Navigation 7.x with Native Stack and Bottom Tabs
- **Storage:** AsyncStorage for local data persistence
- **Hardware Integration:** Expo Camera, Barcode Scanner, Location Services, and Haptic Feedback

### Backend Infrastructure
- **Runtime:** Node.js with Express.js framework
- **Database:** MySQL 8.0+ with mysql2 driver
- **Authentication:** JWT tokens with bcrypt password hashing
- **API Security:** CORS middleware and comprehensive request validation

## Installation and Setup

### System Requirements
- Node.js v16.0.0 or higher
- npm v7.0.0 or higher
- Expo CLI: `npm install -g @expo/cli`
- iOS: Xcode 14+ and iOS Simulator
- Android: Android Studio and Android Emulator
- MySQL v8.0 or higher for backend operations

### Development Environment

1. **Clone Repository:**
   ```bash
   git clone https://github.com/jonax1337/calories-training-tracker.git
   cd calories-training-tracker
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Backend:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Configure .env with MySQL credentials
   ```

4. **Database Setup:**
   ```sql
   CREATE DATABASE calories_tracker;
   ```

5. **Start Backend Server:**
   ```bash
   npm run dev  # Development mode
   npm start    # Production mode
   ```

6. **Launch Frontend Application:**
   ```bash
   cd ..
   npm start
   ```

7. **Run Application:**
   - iOS: Press `i` for iOS Simulator
   - Android: Press `a` for Android Emulator
   - Physical Device: Scan QR code with Expo Go

## API Architecture

### Authentication System
The application implements secure JWT-based authentication with bcrypt password hashing and protected route middleware for all authenticated endpoints.

### Primary Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - New user registration
- `GET /api/users/profile` - User profile retrieval
- `POST /api/users/profile` - Profile updates
- `GET /api/daily-logs/:date` - Daily log data retrieval
- `POST /api/daily-logs` - Daily log creation and updates

### Database Schema
The system utilizes a normalized MySQL database structure with tables for users, daily logs, food items, and user goals, ensuring data integrity and optimal query performance.

## Application Structure

### Frontend Organization
```
src/
├── components/          # Reusable UI components
├── screens/            # Application screens
├── navigation.tsx      # Navigation configuration
├── services/          # API and storage services
├── context/           # React Context for state management
├── theme/             # Theme system implementation
└── types/             # TypeScript definitions
```

### Backend Organization
```
server/
├── controllers/       # Request handling logic
├── routes/           # API endpoint definitions
├── middleware/       # Authentication and validation
└── config/           # Database and application configuration
```

## Getting Started

1. **Account Setup:** Register with email and secure password
2. **Profile Configuration:** Enter personal data including age, gender, height, weight, and activity level
3. **Goal Setting:** Define health and fitness objectives
4. **Nutrition Tracking:** Begin logging meals using barcode scanner or manual entry
5. **Health Integration:** Grant permissions for HealthKit or Google Fit synchronization
6. **Training:** Configure and utilize the HIIT timer for workout sessions

## Version Information

**Current Version:** 1.0.0

The current release includes complete nutrition tracking with barcode scanning, HIIT timer functionality with audio-haptic feedback, WebView-based wave animations, JWT authentication with secure backend, health platform integration, and comprehensive theme system support.

## Contact Information

For technical inquiries, support requests, or business partnerships:

**Developer:** Jonas Laux  
**Email:** jonas.laux@hotmail.com  
**GitHub:** [jonax1337](https://github.com/jonax1337)

---

*Built with React Native, Expo, and enterprise-grade web technologies for optimal performance and security.*