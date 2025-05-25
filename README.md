# 📊 Calories Training Tracker

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-007ACC?style=for-the-badge\&logo=node.js\&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-007ACC?style=for-the-badge\&logo=javascript\&logoColor=white)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge\&logo=expo\&logoColor=white)](https://expo.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-007ACC?style=for-the-badge\&logo=mysql\&logoColor=white)](https://nodejs.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE.md)

Eine moderne, reaktionsschnelle mobile Anwendung zur präzisen Verfolgung deiner Ernährung, Fitness und Gesundheitsziele mit intuitivem Design und umfangreichen Funktionen.



## 📚 Inhaltsverzeichnis

* [✨ Übersicht](#-übersicht)
* [🚀 Hauptfunktionen](#-hauptfunktionen)
* [🎯 Zielgruppe](#-zielgruppe)
* [💾 Installation & Setup](#-installation--setup)
* [▶️ Erste Schritte](#️-erste-schritte)
* [⚙️ Technologie-Stack](#️-technologie-stack)
* [📱 App-Architektur](#-app-architektur)
* [🔄 Updates & Roadmap](#-updates--roadmap)
* [🤝 Mitwirken](#-mitwirken)
* [📄 Lizenz](#-lizenz)
* [✉️ Kontakt](#️-kontakt)



## ✨ Übersicht

Calories Training Tracker ist eine umfassende Lösung für alle, die ihre Ernährung und Fitness optimal im Blick behalten möchten. Die App kombiniert präzises Ernährungstracking mit Aktivitätsaufzeichnung und visualisiert Fortschritte durch intuitive Grafiken und Dashboards.

**Herausragende Merkmale:**

* **Multipattform-Support**: Nahtlos auf iOS und Android durch React Native & Expo
* **Echtzeit-Tracking**: Genaue Erfassung von Kalorien, Makronährstoffen und Wasseraufnahme
* **Intelligente Barcode-Technologie**: Sofortiges Hinzufügen von Lebensmitteln durch Scannen
* **Fortschrittliche Visualisierungen**: Animierte Fortschrittsdarstellungen mit WebView-Technologie
* **Sichere Datensynchronisation**: JWT-basierte Authentifizierung mit Server-Backend
* **Personalisierbare Ziele**: Individuelle Anpassung an persönliche Ernährungs- und Fitnessbedürfnisse



## 🚀 Hauptfunktionen

### 🍎 Umfassendes Ernährungstracking

* **Nährwertanalyse**: Detaillierte Aufschlüsselung von Kalorien, Proteinen, Kohlenhydraten, Fetten
* **Barcode-Scanner**: Lebensmittel mit der Kamera erfassen und automatisch Nährwerte importieren
* **Portionsrechner**: Einfache Anpassung der Portionsgrößen mit automatischer Neuberechnung
* **Mahlzeitenprotokoll**: Chronologische Erfassung aller Mahlzeiten mit Kategorie- und Zeitangabe
* **Wassertracking**: Flüssigkeitszufuhr überwachen mit animierten Fortschrittsanzeigen

### 💪 Fitnessüberwachung

* **Aktivitätsverfolgung**: Training, Schritte und verbrannte Kalorien aufzeichnen
* **Gesundheitsintegration**: Verbindung mit HealthKit (iOS) und Google Fit (Android)
* **Trainingstagebuch**: Übungen, Gewichte und Wiederholungen speichern

### 📊 Personalisierte Analysen

* **Dashboard**: Tägliche, wöchentliche und monatliche Zusammenfassungen
* **Fortschrittsvisualisierung**: Animierte Wellendiagramme und Statistiken
* **Trendanalysen**: Langfristige Fortschritte und Muster erkennen



## 🎯 Zielgruppe

* Fitness-Enthusiasten, die ihre Ernährung optimieren möchten
* Menschen mit Gewichtszielen (Abnahme oder Aufbau)
* Sportler mit spezifischen Ernährungsanforderungen
* Gesundheitsbewusste Personen, die ihre Ernährung verbessern wollen
* Trainer und Coaches, die ihre Klienten unterstützen



## 💾 Installation & Setup

### Voraussetzungen

* Node.js (v16 oder höher)
* npm (v7 oder höher) oder Yarn
* Expo CLI (`npm install -g expo-cli`)
* iOS-Simulator/Android-Emulator oder physisches Gerät mit Expo Go

### Entwicklungsumgebung einrichten

1. Repository klonen:
   ```bash
   git clone https://github.com/jonax1337/calories_training_tracker.git
   cd calories_training_tracker
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Backend starten (falls benötigt):
   ```bash
   cd server
   npm install
   npm start
   ```

4. App starten:
   ```bash
   cd ..
   npm start
   ```

5. QR-Code mit Expo Go scannen oder App im Simulator öffnen



## ▶️ Erste Schritte

1. **Registrierung/Login**: Erstelle ein Konto oder melde dich an
2. **Profil einrichten**: Persönliche Daten und Ziele festlegen
3. **Dashboard erkunden**: Überblick über deine täglichen Statistiken
4. **Mahlzeit hinzufügen**: Manuell oder per Barcode-Scan
5. **Training aufzeichnen**: Aktivitäten erfassen und Fortschritte verfolgen



## ⚙️ Technologie-Stack

### Frontend
* **Framework**: React Native 0.79.2 mit Expo 53
* **Sprache**: TypeScript 5.8
* **UI-Komponenten**: 
  * Styled-components für Styling
  * React Native Reanimated für Animationen
  * React Native SVG für Vektorgrafiken
  * WebView für komplexe Animationen
* **Navigation**: React Navigation 7
* **Datenspeicherung**: AsyncStorage
* **Hardware-Integration**:
  * Expo Camera & Barcode Scanner
  * Expo Location & Sensors
  * Expo Haptics für taktiles Feedback

### Backend
* **Server**: Node.js mit Express
* **Datenbank**: MySQL
* **Authentifizierung**: JWT-Token
* **API-Integration**: Axios für HTTP-Requests
* **Externe APIs**: Open Food Facts für Produktdaten



## 📱 App-Architektur

* **Navigation**: Tab- und Stack-basierte Navigation mit React Navigation
* **State Management**: Context API und lokaler State
* **Komponenten-Struktur**: 
  * Funktionale Komponenten mit Hooks
  * Wiederverwendbare UI-Komponenten
  * Bildschirm-spezifische Komponenten
* **Styling**: Theming mit styled-components und dynamischem Dark/Light-Mode



## 🔄 Updates & Roadmap

### Aktuelle Version: 1.0.0

### Geplante Funktionen
* Erweitertes Rezepte-System mit Nährwertberechnung
* Soziale Komponente zum Teilen von Erfolgen
* KI-basierte Empfehlungen für Ernährung und Training
* Offline-Modus mit vollständiger Funktionalität
* Erweiterte Exportfunktionen für Daten



## 🤝 Mitwirken

Beiträge sind herzlich willkommen! Detaillierte Informationen findest du in unserer [CONTRIBUTING.md](CONTRIBUTING.md).



## 📄 Lizenz

Dieses Projekt ist proprietär und unterliegt den Bedingungen in der [LICENSE.md](LICENSE.md).



## ✉️ Kontakt

Bei Fragen, Feedback oder Vorschlägen:

* **Entwickler**: Jonas Laux
* **E-Mail**: [jonas.laux@hotmail.com](mailto:jonas.laux@hotmail.com)
* **GitHub**: [jonax1337](https://github.com/jonax1337)

Viel Erfolg bei deinen Fitness- und Ernährungszielen! 💪🥗
