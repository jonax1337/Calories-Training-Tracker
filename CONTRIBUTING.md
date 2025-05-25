# 🤝 Beitragsrichtlinien für Calories Training Tracker

Vielen Dank für dein Interesse, zum Calories Training Tracker beizutragen! Diese App lebt von engagierten Mitwirkenden wie dir.

## 📋 Wie du helfen kannst

Es gibt viele Wege, zum Projekt beizutragen:

- **Code-Beiträge**: Neue Features, Bugfixes oder Performance-Optimierungen
- **Dokumentation**: Verbesserungen der Code-Kommentare, README oder Wiki-Seiten
- **Design**: UI/UX-Verbesserungen, Grafiken oder Animationen
- **Tests**: Erstellung oder Verbesserung von Testfällen
- **Feedback**: Bug-Reports oder Feature-Vorschläge

## 🚀 Entwicklungs-Workflow

### 1. Vorbereitung

1. **Fork das Repository** und klone deinen Fork:
   ```bash
   git clone https://github.com/dein-benutzername/calories_training_tracker.git
   cd calories_training_tracker
   ```
2. **Upstream hinzufügen**:
   ```bash
   git remote add upstream https://github.com/jonax1337/calories_training_tracker.git
   ```
3. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

### 2. Feature-Entwicklung

1. **Neuen Branch erstellen** mit beschreibendem Namen:
   ```bash
   git checkout -b feature/beschreibender-name
   ```
2. **Änderungen vornehmen** und regelmäßig committen:
   ```bash
   git add .
   git commit -m "feat: Beschreibung der Änderung"
   ```
3. **Upstream-Änderungen regelmäßig integrieren**:
   ```bash
   git pull upstream main
   ```
4. **Änderungen pushen**:
   ```bash
   git push origin feature/beschreibender-name
   ```

### 3. Pull Request einreichen

1. Auf GitHub zu deinem Fork navigieren
2. "Pull Request" erstellen
3. Änderungen ausführlich beschreiben
4. Warte auf Feedback und reagiere auf Code-Reviews

## 📏 Code-Richtlinien

### Allgemeine Prinzipien

- **Funktional und deklarativ**: Bevorzuge funktionale Programmiermuster statt Klassen
- **DRY (Don't Repeat Yourself)**: Vermeide Code-Duplizierung
- **KISS (Keep It Simple, Stupid)**: Halte den Code einfach und lesbar
- **Modularität**: Erstelle wiederverwendbare Komponenten und Funktionen

### TypeScript & React Native

- **TypeScript**: Verwende strikte Typisierung und vermeide any wo möglich
- **React Hooks**: Nutze funktionale Komponenten mit Hooks statt Klassenkomponenten
- **Immutabilität**: Behandle State als unveränderlich, nutze entsprechende Patterns
- **Performance**: Beachte React-Native-Performance-Praktiken (Memoization, usw.)

### Naming Conventions

- **Dateien**: Kebab-Case für Verzeichnisnamen (z.B. components/wave-animation)
- **Komponenten**: PascalCase für Komponentennamen (z.B. WaveAnimation.tsx)
- **Funktionen**: camelCase für Funktionen und Variablen
- **Konstanten**: SCREAMING_SNAKE_CASE für globale Konstanten

### Code-Stil

- **ESLint & Prettier**: Befolge die konfigurierten Linting-Regeln
- **Kommentare**: Dokumentiere komplexe Logik oder ungewöhnliche Entscheidungen
- **Commit-Messages**: Folge den Conventional Commits-Richtlinien

## 🧪 Tests und Qualitätssicherung

- **Manuelle Tests**: Teste deine Änderungen gründlich auf iOS und Android
- **Edge Cases**: Berücksichtige verschiedene Bildschirmgrößen und Zustände
- **Performance**: Achte auf Performance-Implikationen, besonders bei Animationen und Listen

## 📃 Pull-Request-Checkliste

Bevor du einen PR einreichst, stelle sicher, dass du Folgendes überprüft hast:

- [ ] Der Code folgt den Projektrichtlinien
- [ ] Alle Tests laufen erfolgreich
- [ ] Die Dokumentation wurde bei Bedarf aktualisiert
- [ ] Der Code wurde auf iOS und Android getestet
- [ ] Es gibt keine Console.log-Statements oder unbenutzte Imports
- [ ] Die PR hat einen beschreibenden Titel und aussagekräftige Beschreibung

## 🔍 Code-Review-Prozess

- Mindestens ein Maintainer wird deinen PR überprüfen
- Feedback kann Änderungsvorschläge, Fragen oder Genehmigung enthalten
- Nach Genehmigung wird dein PR in den Hauptbranch gemergt

## 🌟 Anerkennung

Alle Mitwirkenden werden in der CONTRIBUTORS.md-Datei (falls vorhanden) anerkannt und im GitHub-Repository hervorgehoben.

Bei Fragen zu diesen Richtlinien oder zum Beitragsprozess kontaktiere bitte:

- **Jonas Laux**
- **E-Mail**: jonas.laux@hotmail.com
- **GitHub**: jonax1337

Vielen Dank für deinen Beitrag zum Calories Training Tracker! 🚀
