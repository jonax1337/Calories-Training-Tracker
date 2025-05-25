# 📊 Calories Training Tracker

[![React Native](https://img.shields.io/badge/React_Native-0.79.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.9-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-ff0000?style=for-the-badge)](LICENSE.md)

Eine moderne, Cross-Platform mobile Anwendung zur präzisen Verfolgung von Ernährung, Fitness und Gesundheitszielen mit fortschrittlichen Animationen und umfassenden Health-Integrationen.

## 📚 Inhaltsverzeichnis

* [✨ Übersicht](#-übersicht)
* [🚀 Hauptfunktionen](#-hauptfunktionen)
* [🎯 Zielgruppe](#-zielgruppe)
* [💾 Installation & Setup](#-installation--setup)
* [▶️ Erste Schritte](#️-erste-schritte)
* [⚙️ Technologie-Stack](#️-technologie-stack)
* [📱 App-Architektur](#-app-architektur)
* [🔐 Backend & API](#-backend--api)
* [🎨 UI/UX Features](#-uiux-features)
* [🔄 Updates & Roadmap](#-updates--roadmap)
* [🤝 Mitwirken](#-mitwirken)
* [📄 Lizenz](#-lizenz)
* [✉️ Kontakt](#️-kontakt)

## ✨ Übersicht

Calories Training Tracker ist eine umfassende Gesundheits- und Fitness-App, die modernste Technologien nutzt, um Benutzern eine nahtlose Erfahrung beim Tracking ihrer Ernährung und Aktivitäten zu bieten. Die App kombiniert präzises Kalorienzählen mit HIIT-Timer, Wassertracking und fortschrittlichen Visualisierungen.

**Herausragende Merkmale:**

* **🏗️ Cross-Platform**: Nativer iOS und Android Support durch React Native & Expo
* **📊 Echtzeit-Tracking**: Präzise Erfassung von Kalorien, Makronährstoffen und Wasseraufnahme
* **📱 Barcode-Scanner**: Sofortiges Hinzufügen von Lebensmitteln durch Camera-Integration
* **🌊 Animierte Visualisierungen**: WebView-basierte Wave-Animationen für Fortschrittsdarstellung
* **🔐 Sichere Authentifizierung**: JWT-basierte Benutzerverwaltung mit verschlüsseltem Backend
* **⏱️ HIIT-Timer**: Integrierter High-Intensity Interval Training Timer
* **💾 Health-Integration**: Native Anbindung an HealthKit (iOS) und Google Fit (Android)
* **🎨 Dark/Light Mode**: Vollständige Theme-Unterstützung mit adaptivem Design

## 🚀 Hauptfunktionen

### 🍎 Umfassendes Ernährungstracking

* **📊 Nährwertanalyse**: Detaillierte Aufschlüsselung von Kalorien, Proteinen, Kohlenhydraten, Fetten
* **📸 Barcode-Scanner**: Expo Camera Integration mit Vision-Camera für automatische Produkterkennung
* **⚖️ Portionsrechner**: Intelligente Anpassung der Portionsgrößen mit automatischer Neuberechnung
* **📝 Mahlzeitenprotokoll**: Chronologische Erfassung mit Datum/Zeit-Stempel und Kategorisierung
* **💧 Wassertracking**: Animiertes Wasserlevel mit WebView-basierten Wave-Animationen
* **➕ Manuelle Eingabe**: Vollständige manuelle Erfassung von Custom-Foods mit Nährwerteditor

### 💪 Fitnessüberwachung & Training

* **⏱️ HIIT-Timer**: Vollständig konfigurierbarer High-Intensity Interval Training Timer
  - Anpassbare Work/Rest Perioden
  - Customizable Runden-Anzahl
  - Audio- und Haptic-Feedback
  - Visuelle Countdown-Anzeigen
* **📈 Aktivitätsverfolgung**: Integration mit nativen Health-APIs
* **🔥 Kalorienverbrauch**: Automatische Berechnung basierend auf Aktivitätsdaten
* **📱 Health-Sync**: Bidirektionale Synchronisation mit HealthKit und Google Fit

### 📊 Personalisierte Analysen & Dashboard

* **📅 Dashboard**: Tägliche, wöchentliche und monatliche Zusammenfassungen
* **🌊 Fortschrittsvisualisierung**: WebView-basierte animierte Wellendiagramme
* **📈 Trendanalysen**: Langfristige Fortschritte und Muster-Erkennung
* **📊 BMI-Tracking**: Automatische BMI-Berechnung mit Zielgewicht-Tracking
* **🎯 Goal Management**: Intelligente Zielanpassung basierend auf Profildaten

### 🎨 Erweiterte UI/UX Features

* **🌊 Wave Animation System**
* **🌓 Theme System**: Vollständiger Dark/Light Mode Support
* **📱 Responsive Design**: Optimiert für verschiedene Bildschirmgrößen
* **🔔 Haptic Feedback**: Native Vibrations-Integration für bessere UX
* **📅 Calendar Integration**: React Native Calendars für Datum-Navigation

## 🎯 Zielgruppe

* **🏋️ Fitness-Enthusiasten**: Sportler mit spezifischen Ernährungs- und Trainingszielen
* **⚖️ Gewichtsmanagement**: Menschen mit Abnahme- oder Aufbauzielen
* **🥗 Gesundheitsbewusste**: Personen, die ihre Ernährung optimieren möchten
* **💪 Personal Trainer**: Coaches, die ihre Klienten digital unterstützen
* **🏃 HIIT-Trainierende**: Nutzer von High-Intensity Interval Training

## 💾 Installation & Setup

### Systemvoraussetzungen

* **Node.js**: v16.0.0 oder höher
* **npm**: v7.0.0 oder höher (oder Yarn alternative)
* **Expo CLI**: `npm install -g @expo/cli`
* **Platform Tools**:
  - iOS: Xcode 14+ und iOS Simulator
  - Android: Android Studio und Android Emulator
  - Physical Device: Expo Go App

### Backend-Abhängigkeiten

* **MySQL**: v8.0 oder höher
* **Node.js**: Backend Server mit Express
* **Environment**: `.env` Konfiguration erforderlich

### Entwicklungsumgebung einrichten

1. **Repository klonen**:
   ```bash
   git clone https://github.com/jonax1337/calories_training_tracker.git
   cd calories_training_tracker
   ```

2. **Frontend Dependencies installieren**:
   ```bash
   npm install
   ```

3. **Backend Server einrichten**:
   ```bash
   cd server
   npm install
   
   # .env Datei konfigurieren
   cp .env.example .env
   # Bearbeite .env mit deinen MySQL-Credentials
   ```

4. **MySQL Datenbank erstellen**:
   ```sql
   CREATE DATABASE calories_tracker;
   ```

5. **Backend starten**:
   ```bash
   npm run dev  # Development mit nodemon
   # oder
   npm start    # Production
   ```

6. **Frontend starten**:
   ```bash
   cd ..
   npm start
   ```

7. **App ausführen**:
   - **iOS**: `i` drücken für iOS Simulator
   - **Android**: `a` drücken für Android Emulator  
   - **Physical Device**: QR-Code mit Expo Go scannen

## ▶️ Erste Schritte

1. **🔐 Account erstellen**: Registrierung mit E-Mail und sicherem Passwort
2. **👤 Profil konfigurieren**: 
   - Persönliche Daten (Alter, Geschlecht, Größe, Gewicht)
   - Aktivitätslevel bestimmen
   - Gesundheitsziele festlegen
3. **📊 Dashboard erkunden**: Überblick über tägliche Statistiken und Fortschritte
4. **🍽️ Erste Mahlzeit**: 
   - Barcode scannen oder manuelle Eingabe
   - Portionsgrößen anpassen
   - Nährwerte überprüfen
5. **💧 Wasseraufnahme**: Täglich Flüssigkeitszufuhr tracken
6. **⏱️ Training starten**: HIIT-Timer konfigurieren und Workout beginnen
7. **📈 Health-Sync**: HealthKit/Google Fit Berechtigung erteilen

## ⚙️ Technologie-Stack

### Frontend (React Native App)
* **🎯 Framework**: React Native 0.79.2 mit Expo 53.0.9
* **⚡ Language**: TypeScript 5.8.3 mit strict mode
* **🎨 Styling**: 
  - Styled-Components 6.1.18 für theming
  - React Native Reanimated 3.17.5 für Animationen
  - React Native SVG 15.12.0 für Vektorgrafiken
  - React Native WebView 13.13.5 für Wave-Animationen
* **🧭 Navigation**: 
  - React Navigation 7.x (Native Stack, Bottom Tabs, Material Top Tabs)
  - Masked View und Safe Area Context
* **💾 Storage**: AsyncStorage für lokale Datenpersistenz
* **📱 Hardware-Integration**:
  - Expo Camera 16.1.6 & Barcode Scanner 13.0.1
  - Expo Location 18.1.5 & Sensors 14.1.4
  - Expo Haptics 14.1.4 für taktiles Feedback
  - Expo Health Kit 1.0.8 (iOS) & React Native Health (Android)
* **🔧 Utilities**:
  - Axios 1.9.0 für HTTP-Requests
  - React Native Calendars 1.1312.0
  - Lucide React Native 0.511.0 für Icons
  - UUID 11.1.0 für unique identifiers

### Backend (Node.js Server)
* **🖥️ Runtime**: Node.js mit Express.js Framework
* **🗄️ Database**: MySQL 8.0+ mit mysql2 Driver
* **🔐 Authentication**: 
  - JWT (JSON Web Tokens) 9.0.2
  - bcrypt 6.0.0 für Password Hashing
* **🌐 Middleware**: 
  - CORS 2.8.5 für Cross-Origin Requests
  - Body-Parser 1.20.2 für Request Parsing
* **🔧 Development**: 
  - Nodemon 3.1.10 für Auto-Restart
  - dotenv 16.0.3 für Environment Variables

### DevOps & Tools
* **📦 Package Manager**: npm mit lockfile
* **🔧 Build Tools**: Expo CLI und Metro Bundler
* **🌳 Version Control**: Git mit .gitignore
* **📝 Documentation**: Markdown mit Emoji-Support

## 📱 App-Architektur

### 📁 Frontend Structure
```
src/
├── components/          # Wiederverwendbare UI-Komponenten
│   ├── ui/             # Basic UI Elements (ProgressBar, WaveAnimation)
│   └── layout/         # Layout-spezifische Komponenten
├── screens/            # Screen-Komponenten
│   ├── home-screen.tsx         # Dashboard mit Tagesübersicht
│   ├── daily-log-screen.tsx    # Detaillierte Mahlzeiten-Logs
│   ├── profile-screen.tsx      # Benutzerprofile und Einstellungen
│   ├── barcode-scanner-screen.tsx # Camera-basierter Scanner
│   ├── hiit-timer-screen.tsx   # HIIT Training Timer
│   ├── login-screen.tsx        # Authentifizierung
│   └── ...
├── navigation.tsx      # React Navigation Setup
├── services/          # API und Storage Services
│   ├── storage-service.ts      # AsyncStorage Operations
│   ├── profile-api.ts          # User Profile API
│   ├── health-service.ts       # Health Data Integration
│   └── ...
├── context/           # React Context für State Management
├── theme/             # Theme System (Dark/Light Mode)
├── styles/            # Styled-Components Definitionen
├── types/             # TypeScript Type Definitions
└── utils/             # Helper Functions und Utilities
```

### 🗄️ Backend Structure
```
server/
├── controllers/       # Request Handler Logic
├── routes/           # API Endpoint Definitions
├── middleware/       # Authentication & Validation
├── config/           # Database & App Configuration
└── utils/            # Backend Utilities
```

### 🔄 State Management
* **Context API**: Globaler State für Theme und Date Context
* **Local State**: Component-spezifischer State mit useState/useEffect
* **AsyncStorage**: Persistierung von User-Daten und Logs
* **JWT Token**: Sichere Session-Verwaltung

## 🔐 Backend & API

### 🛡️ Authentication System
* **JWT-basierte Authentifizierung**: Sichere Token-Verwaltung
* **Password Hashing**: bcrypt für sichere Passwort-Speicherung
* **Protected Routes**: Middleware für authentifizierte Endpunkte

### 📊 API Endpoints
* **`POST /api/auth/login`**: Benutzer-Anmeldung
* **`POST /api/auth/register`**: Neue Benutzer-Registrierung
* **`GET /api/users/profile`**: Benutzerprofil abrufen
* **`POST /api/users/profile`**: Profil aktualisieren
* **`GET /api/daily-logs/:date`**: Tageslog für spezifisches Datum
* **`POST /api/daily-logs`**: Neuen Tageslog erstellen/aktualisieren

### 🗄️ Database Schema
* **Users**: Benutzerdaten, Authentifizierung, Profile
* **Daily_Logs**: Tägliche Ernährungs- und Aktivitätsdaten
* **Food_Items**: Lebensmittel-Datenbank mit Nährwerten
* **User_Goals**: Individuelle Ziele und Targets

## 🎨 UI/UX Features

### 🌊 Wave Animation System
* **WebView-basierte Implementierung**: Hochperformante CSS-Animationen
* **Multi-Layer Parallax**: 4 Wellen-Ebenen mit unterschiedlichen Geschwindigkeiten
* **Smooth Transitions**: CSS cubic-bezier für flüssige Level-Änderungen
* **Theme-Integration**: Automatische Farbspanpassung an App-Theme

### 🌓 Theme System
* **Dynamic Theming**: Vollständiger Dark/Light Mode Support
* **Styled-Components**: Konsistente Design-Token und Variablen
* **System Integration**: Automatic Theme Detection basierend auf Device Settings

### 📱 Responsive Design
* **Safe Area Handling**: React Native Safe Area Context Integration
* **Adaptive Layouts**: Flexbox-basierte responsive Komponenten
* **Cross-Platform Consistency**: Einheitliche UX auf iOS und Android

## 🔄 Updates & Roadmap

### 📋 Aktuelle Version: 1.0.0

**🎯 Implementierte Features:**
- ✅ Vollständiges Ernährungstracking mit Barcode-Scanner
- ✅ HIIT-Timer mit Audio/Haptic Feedback
- ✅ WebView-basierte Wave-Animationen
- ✅ JWT-Authentifizierung mit sicherem Backend
- ✅ Health-Integration (HealthKit/Google Fit)
- ✅ Dark/Light Mode mit Theme System
- ✅ BMI-Tracking und Goal Management

### 🚧 Geplante Features (v1.1.0)

**🍳 Erweiterte Ernährung:**
- Rezepte-System mit Nährwertberechnung
- Meal Planning und Vorbereitung
- Nutrition Label Scanner mit OCR

**🏃 Fitness-Erweiterungen:**
- Zusätzliche Timer-Modi (Tabata, Custom Intervals)
- Workout-Templates und -Historie
- Integration mit Fitness-Trackern

**📱 App-Verbesserungen:**
- Offline-Modus mit lokaler Synchronisation
- Erweiterte Exportfunktionen (PDF, CSV)
- Push-Notifications für Erinnerungen

**🤝 Soziale Features:**
- Fortschritts-Sharing
- Challenges und Achievements
- Community-Features

### 🔮 Langfristige Vision (v2.0.0)
- 🤖 KI-basierte Empfehlungen
- 📊 Erweiterte Analytics und Insights
- 🌐 Web-App Companion
- 🍎 Apple Watch App

## 🤝 Mitwirken

Beiträge sind herzlich willkommen! Detaillierte Informationen findest du in unserer [CONTRIBUTING.md](CONTRIBUTING.md).

### 📝 Contribution Guidelines
1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### 🐛 Bug Reports
Nutze die GitHub Issues für Bug Reports mit:
- Detaillierte Beschreibung
- Steps to Reproduce
- Expected vs Actual Behavior
- Screenshots/Videos falls möglich

## 📄 Lizenz

Dieses Projekt ist proprietär und unterliegt den Bedingungen in der [LICENSE.md](LICENSE.md).

## ✉️ Kontakt

Bei Fragen, Feedback oder Vorschlägen:

* **👨‍💻 Entwickler**: Jonas Laux
* **📧 E-Mail**: [jonas.laux@hotmail.com](mailto:jonas.laux@hotmail.com)
* **🐱 GitHub**: [jonax1337](https://github.com/jonax1337)
* **💼 LinkedIn**: [Jonas Laux](https://linkedin.com/in/jonaslaux)

---

**🎯 Viel Erfolg bei deinen Fitness- und Ernährungszielen! 💪🥗**

*Built with ❤️ using React Native, Expo, and modern web technologies.*
