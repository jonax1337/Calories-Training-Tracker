# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React Native with Expo)
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run on web platform

### Backend (Node.js/Express)
- `cd server && npm run dev` - Start backend in development mode with nodemon
- `cd server && npm start` - Start backend in production mode
- `cd server && npm install` - Install backend dependencies

### Full Application Setup
1. Install frontend dependencies: `npm install`
2. Setup backend: `cd server && npm install`
3. Configure environment: Copy `.env.example` to `.env` in server directory
4. Create MySQL database: `CREATE DATABASE calories_tracker;`
5. Start backend: `cd server && npm run dev`
6. Start frontend: `npm start`

## Architecture Overview

### Frontend Architecture
- **Framework**: React Native 0.79.3 with Expo 53.0.11 and TypeScript 5.8.3
- **Navigation**: React Navigation 7.x with native stack and material top tabs
- **Styling**: Styled-components 6.1.18 with consistent theme system
- **Storage**: AsyncStorage for local persistence and JWT token management
- **Hardware**: Expo Camera for barcode scanning, HealthKit/Google Fit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: MySQL 8.0+ with mysql2 driver and normalized schema
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: RESTful endpoints with CORS middleware and request validation

### Key Components Structure
- `src/components/`: Reusable UI components organized by category (ui/, charts/, reports/, webview/)
- `src/screens/`: Application screens following naming convention `*-screen.tsx`
- `src/services/`: API services, authentication, storage, and health integrations
- `src/styles/`: Styled-components organized to mirror component structure
- `src/theme/`: Centralized theme system with light/dark mode support
- `src/types/`: TypeScript definitions and navigation types

### Backend Structure
- `server/controllers/`: Request handling logic for each feature area
- `server/routes/`: API endpoint definitions with middleware integration
- `server/middleware/`: Authentication and validation middleware
- `server/config/`: Database configuration and initialization scripts

## Important Implementation Details

### Authentication Flow
- JWT-based authentication with tokens stored in AsyncStorage
- Profile completion check enforces required health data entry
- Automatic logout and auth state reset functionality via `reset-auth.ts`

### Database Integration
- MySQL database with auto-initialization via `initServer.js`
- User profiles require age, gender, height, weight, and activity level for calorie calculations
- Daily logs track comprehensive nutrition and health metrics

### Health Platform Integration
- Platform-specific health service configuration (HealthKit for iOS, Google Fit for Android)
- Bidirectional synchronization for weight and activity data
- Permissions handled automatically during app initialization

### Barcode Scanning
- Expo Camera integration with Vision Camera Code Scanner
- Custom food database with fallback to manual entry
- Portion calculation and nutritional value adjustment

### HIIT Timer System
- Configurable intervals with audio-haptic feedback
- WebView-based sound generation for cross-platform compatibility
- Customizable work/rest periods and cycle counts

### Theme System
- Comprehensive light/dark theme implementation
- Context-based theme switching with persistent storage
- Styled-components integration with theme provider

## API Configuration
- Base URL configured in `src/config/api-config.ts` (currently set to local network IP)
- Authentication tokens managed via AsyncStorage with automatic injection
- CORS configured for development with wildcard origin access

## Development Notes
- TypeScript strict mode enabled across the entire codebase
- Component styles separated into dedicated style files following component structure
- Health permissions and notifications configured automatically on app initialization
- WebView component used for sound generation to ensure cross-platform audio compatibility