<div align="center">

# 🍎 Calories Training Tracker 💪

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Eine umfassende mobile Anwendung zur Verfolgung deiner Ernährung, Fitness und Gesundheitsziele.**

</div>

## ✨ Highlights

- 📱 **Moderne mobile App** - Entwickelt mit React Native und Expo
- 📊 **Umfassendes Tracking** - Kalorien, Makronährstoffe, Wasser und Aktivitätsdaten
- 🔄 **Nahtlose Synchronisierung** - Zwischen mobilen Geräten und Backend-Server
- 🔒 **Sicheres Benutzerprofil** - JWT-basierte Authentifizierung
- 📷 **Barcode-Scanner** - Lebensmittel mit einem Scan hinzufügen

---

## 🌟 Features

### 📊 Ernährungstracking
- **Umfassende Nährwertanalyse**: Verfolge Kalorien, Protein, Kohlenhydrate, Fette und Wasseraufnahme
- **Barcode-Scanning**: Scanne Produktbarcodes, um automatisch Nährwertinformationen abzurufen
- **Tägliches Protokoll**: Führe ein detailliertes Protokoll über Mahlzeiten und Nährwertinformationen
- **Lebensmittelfavoriten**: Speichere häufig verwendete Lebensmittel für schnellen Zugriff

### 🏃‍♂️ Fitnesstracking
- **Gesundheits-App-Integration**: Verbindung mit Gesundheitsdaten des Geräts zur Verfolgung von Aktivitätsmetriken
- **Aktivitätsübersicht**: Tägliche und wöchentliche Zusammenfassung deiner Bewegungsaktivitäten

### 🎯 Ziele & Fortschritt
- **Individuelle Ziele**: Setze persönliche Ernährungs- und Aktivitätsziele
- **Fortschrittsvisualisierung**: Verfolge deinen Fortschritt mit intuitiven Diagrammen und Statistiken
- **Tägliche Zusammenfassung**: Übersichtliche Darstellung deines täglichen Fortschritts

---

## 🚀 Installation

### 📋 Voraussetzungen

- **Node.js** (LTS-Version)
- **npm** oder **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- iOS/Android-Simulator oder physisches Gerät

### ⚙️ Einrichtung

1. **Repository klonen**

```bash
git clone <repository-url>
cd calories_training_tracker
```

2. **Abhängigkeiten installieren**

```bash
npm install --legacy-peer-deps
```

3. **Backend-Server starten** (in einem separaten Terminal)

```bash
cd server
npm install
npm start
```

4. **Entwicklungsserver starten**

```bash
npm start
```

5. **App öffnen**  
   Öffne die App in deinem iOS/Android-Simulator oder scanne den QR-Code mit der Expo Go App auf deinem physischen Gerät

---

## 💻 Technische Implementierung

Diese App wurde mit modernen Technologien entwickelt:

### Frontend
- **React Native & Expo**: Für die Cross-Platform-Entwicklung
- **TypeScript**: Für typsichere Codeentwicklung
- **React Navigation**: Für das App-Routing und die Navigation
- **Expo Barcode Scanner**: Für die Barcode-Scanning-Funktionalität
- **AsyncStorage**: Für lokale Datenpersistenz
- **JWT Authentication**: Für sichere Benutzerauthentifizierung

### Backend & APIs
- **Node.js Express Server**: Für die Backend-API
- **MySQL Datenbank**: Für die Datenspeicherung
- **Open Food Facts API**: Für Produktinformationen
- **RESTful API**: Für die Kommunikation zwischen Client und Server

### Gesundheitsintegration
- **iOS HealthKit** / **Android Google Fit**: Für die Integration von Gesundheitsdaten

---

## 📱 Verwendung

1. **Startbildschirm**: Sieh dir deine tägliche Ernährungszusammenfassung und Schnellaktionen an
2. **Barcode-Scanner**: Scanne Lebensmittelprodukte, um sie deinem Tagesprotokoll hinzuzufügen
3. **Lebensmitteldetails**: Sieh dir Nährwertinformationen für Lebensmittel an und bearbeite sie
4. **Tägliches Protokoll**: Verfolge deine Nahrungsaufnahme über den Tag
5. **Profil**: Konfiguriere deine persönlichen Informationen und Ziele

---

## 🔄 Gesundheitsdatenintegration

Die App simuliert derzeit die Integration von Gesundheitsdaten. In einer Produktionsumgebung müsstest du implementieren:

- **Für iOS**: HealthKit-Integration
- **Für Android**: Google Fit API-Integration

---

## 👥 Beitragen

Beiträge sind willkommen! Bitte lies dir die Beitragsrichtlinien durch, bevor du Änderungen einreichst.

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zu dem Branch (`git push origin feature/AmazingFeature`)
5. Eröffne einen Pull Request

---

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die LICENSE-Datei für Details.

---