# Calories Training Tracker

A comprehensive React Native application for tracking nutritional intake (calories, fats, proteins, and water) and fitness data. The app includes barcode scanning functionality for easy food entry and integrates with health data.

## Features

- **Barcode Scanning**: Scan product barcodes to automatically fetch nutritional information
- **Detailed Nutrition Tracking**: Monitor calories, protein, carbs, fat and water intake
- **Health App Integration**: Connect with device health data to track activity metrics
- **Daily Food Log**: Keep a detailed record of meals and nutritional information
- **Custom Goals**: Set personalized nutrition and activity goals
- **Progress Visualization**: Track your progress with intuitive charts and statistics

## Installation

### Requirements

- Node.js (LTS version)
- npm or yarn
- Expo CLI
- iOS/Android simulator or physical device

### Setup

1. Clone the repository

```bash
git clone <repository-url>
cd calories_training_tracker
```

2. Install dependencies

```bash
npm install --legacy-peer-deps
```

3. Start the development server

```bash
npm start
```

4. Open the app in your iOS/Android simulator or scan the QR code using the Expo Go app on your physical device

## Technical Implementation

This app is built using:

- React Native & Expo
- TypeScript
- React Navigation
- Expo Barcode Scanner
- AsyncStorage for local data persistence
- Open Food Facts API for product information
- Native health integration (iOS HealthKit / Android Google Fit)

## Usage

1. **Home Screen**: View your daily nutrition summary and quick actions
2. **Barcode Scanner**: Scan food products to add them to your daily log
3. **Food Details**: View and edit nutritional information for food items
4. **Daily Log**: Track your food intake throughout the day
5. **Profile**: Configure your personal information and goals

## Health Data Integration

The app currently simulates health data integration. In a production environment, you would need to implement:

- For iOS: HealthKit integration
- For Android: Google Fit API integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
