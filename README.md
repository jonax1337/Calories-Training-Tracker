# 📊 Calories Training Tracker

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/) [![React Native](https://img.shields.io/badge/React%20Native-0.71-blue.svg)](https://reactnative.dev/) [![Expo](https://img.shields.io/badge/Expo-47.0.0-lightgrey.svg)](https://expo.dev/) [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

Eine umfassende mobile Anwendung zur Verfolgung deiner Ernährung, Fitness und Gesundheitsziele.

---

## 📚 Inhaltsverzeichnis

* [✨ Highlights](#-highlights)
* [🚀 Features](#-features)
* [💾 Installation](#-installation)

  * [Voraussetzungen](#voraussetzungen)
  * [Setup](#setup)
* [▶️ Nutzung](#️-nutzung)
* [⚙️ Technische Implementierung](#️-technische-implementierung)

  * [Frontend](#frontend)
  * [Backend & APIs](#backend--apis)
  * [Gesundheitsintegration](#gesundheitsintegration)
* [🛠️ Konfiguration](#️-konfiguration)
* [🤝 Beitragen](#-beitragen)
* [📄 Lizenz](#-lizenz)
* [✉️ Kontakt](#️-kontakt)

---

## ✨ Highlights

* **Cross-Platform**: React Native & Expo für iOS und Android
* **Ganzheitliches Tracking**: Kalorien, Makronährstoffe, Wasseraufnahme und Aktivität
* **Echtzeit-Synchronisation**: Mobile App ↔️ Backend-Server
* **Sichere Authentifizierung**: JWT-basiert
* **Barcode-Scanner**: Lebensmittel per Scan hinzufügen

---

## 🚀 Features

### Ernährungstracking

* Detaillierte Nährwertanalyse: Kalorien, Proteine, Kohlenhydrate, Fette und Wasser
* Barcode-Scanning via Expo Barcode Scanner
* Tägliches Mahlzeitenprotokoll mit Favoriten-Liste

### Fitnesstracking

* Integration mit HealthKit (iOS) und Google Fit (Android)
* Übersichtliche Aktivitätsstatistiken (täglich, wöchentlich)

### Ziele & Fortschritt

* Individuelle Ernährungs- und Aktivitätsziele
* Fortschrittsdiagramme mit intuitiven Grafiken
* Tägliche Zusammenfassung als Dashboard

---

## 💾 Installation

### Voraussetzungen

* Node.js (LTS)
* npm oder Yarn
* Expo CLI (`npm install -g expo-cli`)
* iOS/Android-Simulator oder physisches Gerät

### Setup

1. Repository klonen:

   ```bash
   git clone https://github.com/jonax1337/calories_training_tracker.git
   cd calories_training_tracker
   ```
2. Abhängigkeiten installieren (Client):

   ```bash
   npm install --legacy-peer-deps
   ```
3. Backend einrichten und starten:

   ```bash
   cd server
   npm install
   npm start
   ```
4. Entwicklungsserver (Client) starten:

   ```bash
   cd ..
   npm start
   ```
5. App im Simulator öffnen oder QR-Code mit Expo Go scannen

---

## ▶️ Nutzung

1. **Startbildschirm**: Tägliche Zusammenfassung und Schnellaktionen
2. **Barcode-Scanner**: Produkt scannen und Nährwerte hinzufügen
3. **Lebensmitteldetails**: Nährwert bearbeiten oder Favorit speichern
4. **Tägliches Protokoll**: Mahlzeitenübersicht durch den Tag
5. **Profil**: Persönliche Daten, Ziele und Einstellungen bearbeiten

---

## ⚙️ Technische Implementierung

### Frontend

* React Native & Expo
* TypeScript
* React Navigation
* AsyncStorage für lokale Daten
* Expo Barcode Scanner

### Backend & APIs

* Node.js + Express Server
* MySQL Datenbank
* Open Food Facts API
* RESTful API-Endpunkte

### Gesundheitsintegration

* iOS: HealthKit
* Android: Google Fit

---

## 🛠️ Konfiguration

Lege im `server/.env` folgende Variablen an:

```dotenv
DB_HOST=your_database_host
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=calories_tracker
JWT_SECRET=your_jwt_secret
```

Um API-Schlüssel (z. B. Open Food Facts) hinzuzufügen, erstelle zusätzliche Umgebungsvariablen und lade sie im Server-Code.

---

## 🤝 Beitragen

Beiträge sind jederzeit willkommen! Bitte folge:

1. Fork das Repository
2. `git checkout -b feature/MeinFeature`
3. Änderungen committen (`git commit -m "feat: Beschreibung"`)
4. Push (`git push origin feature/MeinFeature`)
5. Pull Request öffnen

Siehe auch die [Contributing Guidelines](CONTRIBUTING.md), wenn vorhanden.

---

## 📄 Lizenz

Dieses Projekt ist proprietär lizenziert. Siehe [LICENSE](LICENSE.md) für Details.

---

## ✉️ Kontakt

Bei Fragen oder Feedback:

* **Autor**: Jonas Laux
* **E-Mail**: [jonas.laux@hotmail.com](mailto:jonas.laux@hotmail.com)
* **GitHub**: [jonax1337](https://github.com/jonax1337)

Viel Spaß beim Tracken und Trainieren! 🚀
