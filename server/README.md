<div align="center">

# 💾 Backend Server - Calories Training Tracker 🔗

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![REST API](https://img.shields.io/badge/REST%20API-FF5733?style=for-the-badge&logo=api&logoColor=white)](https://restfulapi.net/)

**Der leistungsstarke Backend-Server für die Calories Training Tracker App**

</div>

## ✨ Überblick

Dieser Backend-Server bildet das Herzstück der Calories Training Tracker Anwendung. Er stellt eine robuste REST-API bereit, die alle Datenbankoperationen verarbeitet, Benutzerauthentifizierung ermöglicht und eine nahtlose Kommunikation mit der mobilen App gewährleistet.

### Hauptfunktionen:

- 🔒 **JWT-basierte Authentifizierung** für sichere Benutzerzugriffe
- 💾 **Vollständige Datenpersistenz** mit MySQL-Datenbank
- 🔄 **RESTful API-Endpunkte** für alle App-Funktionen
- 💡 **Effiziente Datenverarbeitung** mit optimierten Abfragen
- 📊 **Umfassende Datenvalidierung** für Datenkonsistenz

---

## 📡 API-Endpunkte

### 👤 Benutzerprofile

| Methode | Endpunkt | Beschreibung | Parameter/Body |
|---------|----------|-------------|-----------------|
| **GET** | `/api/users/:id` | Benutzerprofil nach ID abrufen | `id`: Benutzer-ID |
| **POST** | `/api/users` | Benutzerprofil erstellen/aktualisieren | `{ id, name, gender, weight, height, age, dailyCalorieGoal, dailyProteinGoal, dailyFatGoal, dailyCarbGoal, dailyWaterGoal }` |

### 🍽️ Lebensmittel

| Methode | Endpunkt | Beschreibung | Parameter/Body |
|---------|----------|-------------|-----------------|
| **GET** | `/api/food-items` | Alle Lebensmitteleinträge abrufen | - |
| **GET** | `/api/food-items/:id` | Lebensmittel nach ID abrufen | `id`: Lebensmittel-ID |
| **POST** | `/api/food-items` | Lebensmittel erstellen/aktualisieren | `{ id, name, calories, protein, carbs, fat, ... }` |
| **DELETE** | `/api/food-items/:id` | Lebensmittel löschen | `id`: Lebensmittel-ID |

### 📅 Tägliche Logs

| Methode | Endpunkt | Beschreibung | Parameter/Body |
|---------|----------|-------------|-----------------|
| **GET** | `/api/daily-logs` | Alle Logs eines Benutzers abrufen | `userId`: Benutzer-ID (Query-Parameter) |
| **GET** | `/api/daily-logs/:date` | Tageslog nach Datum abrufen | `date`: Datum (YYYY-MM-DD), `userId`: Benutzer-ID (Query) |
| **POST** | `/api/daily-logs` | Tageslog erstellen/aktualisieren | `{ userId, date, waterIntake, notes, foodEntries: [...] }` |

### ⭐ Favoriten

| Methode | Endpunkt | Beschreibung | Parameter/Body |
|---------|----------|-------------|-----------------|
| **GET** | `/api/favorites` | Favorisierte Lebensmittel eines Benutzers abrufen | `userId`: Benutzer-ID (Query-Parameter) |
| **POST** | `/api/favorites/toggle` | Favoritenstatus umschalten | `{ userId, foodItemId }` |

---

## 💻 Technische Einrichtung

### 📋 Voraussetzungen

- **Node.js** (v14 oder höher)
- **MySQL Server** (v5.7 oder höher)
- **npm** oder **yarn** als Paketmanager

### ⚙️ Installation

1. **In das Server-Verzeichnis navigieren**
   ```bash
   cd server
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Datenbank konfigurieren**
   - MySQL-Datenbank mit dem Namen `calories_tracker` erstellen
   - `.env`-Datei mit deinen MySQL-Anmeldedaten aktualisieren:
     ```
     DB_HOST=localhost
     DB_USER=dein_benutzername
     DB_PASSWORD=dein_passwort
     DB_NAME=calories_tracker
     PORT=3001
     JWT_SECRET=dein_geheimer_schluessel
     ```

4. **Datenbanktabellen initialisieren**
   ```bash
   npm run db:init
   ```

5. **Server starten**
   ```bash
   npm start
   ```
   
   Für die Entwicklung mit automatischem Neuladen:
   ```bash
   npm run dev
   ```

---

## 📓 Datenbankschema

Die Datenbank umfasst die folgenden Tabellen:

### 👤 users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  weight FLOAT NOT NULL,
  height FLOAT NOT NULL,
  age INT NOT NULL,
  daily_calorie_goal INT NOT NULL,
  daily_protein_goal INT NOT NULL,
  daily_fat_goal INT NOT NULL,
  daily_carb_goal INT NOT NULL,
  daily_water_goal INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 🍽️ food_items
```sql
CREATE TABLE food_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  calories INT NOT NULL,
  protein FLOAT NOT NULL,
  carbs FLOAT NOT NULL,
  fat FLOAT NOT NULL,
  barcode VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📅 daily_logs
```sql
CREATE TABLE daily_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  water_intake INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY user_date (user_id, date)
);
```

### 🍗 food_entries
```sql
CREATE TABLE food_entries (
  id VARCHAR(36) PRIMARY KEY,
  daily_log_id VARCHAR(36) NOT NULL,
  food_item_id VARCHAR(36) NOT NULL,
  quantity FLOAT NOT NULL,
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);
```

### ⭐ favorite_foods
```sql
CREATE TABLE favorite_foods (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  food_item_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE,
  UNIQUE KEY user_food (user_id, food_item_id)
);
```

---

## 🔗 Frontend-Integration

Für die Integration mit dem Frontend musst du den `storage-service.ts` anpassen, um API-Aufrufe anstelle von AsyncStorage zu verwenden. Hier ein Beispiel für die Implementierung:

```typescript
// Beispiel für die Implementierung von storage-service.ts mit API-Aufrufen
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthToken } from './auth-service';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Fügt den Auth-Token zu jeder Anfrage hinzu
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchUserProfile = async (userId: string) => {
  const response = await api.get(`/api/users/${userId}`);
  return response.data;
};

// Weitere API-Funktionen...
```

---

## 💡 Fehlerbehebung

### Häufige Probleme

1. **Verbindungsfehler zur Datenbank**
   - Überprüfe die Zugangsdaten in der `.env`-Datei
   - Stelle sicher, dass der MySQL-Server läuft
   - Prüfe, ob die Datenbank existiert

2. **Fehler bei der Authentifizierung**
   - Überprüfe, ob das `JWT_SECRET` in der `.env`-Datei korrekt ist
   - Stelle sicher, dass der Token im richtigen Format gesendet wird

3. **Probleme mit CORS**
   - Überprüfe die CORS-Konfiguration in `server.js`
   - Stelle sicher, dass die Anfrage-Herkunft erlaubt ist

---

## 📝 API-Tests

Du kannst die API-Endpunkte mit Tools wie [Postman](https://www.postman.com/) oder [Insomnia](https://insomnia.rest/) testen. Hier sind einige Beispielanfragen:

### Benutzer erstellen
```json
// POST /api/users
{
  "name": "Max Mustermann",
  "gender": "male",
  "weight": 75.5,
  "height": 180,
  "age": 30,
  "dailyCalorieGoal": 2500,
  "dailyProteinGoal": 150,
  "dailyFatGoal": 80,
  "dailyCarbGoal": 250,
  "dailyWaterGoal": 3000
}
```

### Tageslog erstellen
```json
// POST /api/daily-logs
{
  "userId": "user-uuid",
  "date": "2025-05-20",
  "waterIntake": 2500,
  "notes": "Guter Tag, habe alle Ziele erreicht.",
  "foodEntries": [
    {
      "foodItemId": "food-uuid",
      "quantity": 1,
      "mealType": "breakfast"
    }
  ]
}
```

---

<div align="center">

**Entwickelt mit ❤️ und ☕ von Deinem Backend-Team**

</div>
