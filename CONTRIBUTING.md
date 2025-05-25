# 🤝 Contributing Guidelines - Calories Training Tracker

Willkommen beim Calories Training Tracker! Wir freuen uns über Ihr Interesse, zu diesem innovativen React Native Projekt beizutragen. Diese App kombiniert modernste Technologien zur Erstellung einer umfassenden Gesundheits- und Fitness-Tracking-Lösung.

## 📋 Beitragsmöglichkeiten

### 🛠️ **Code-Contributions**
- **Frontend Development**: React Native 0.79.2 + Expo 53.0.9 + TypeScript 5.8.3
- **Backend Development**: Node.js + Express + MySQL + JWT Authentication
- **UI/UX Improvements**: Styled-Components Theming, Wave Animations, Responsive Design
- **Performance Optimizations**: Bundle-Size, Animation Performance, Memory Management

### 📚 **Dokumentation**
- Code-Kommentare und JSDoc Dokumentation
- API-Dokumentation für Backend-Endpoints
- Component-Dokumentation mit Storybook (geplant)
- User Guide und Tutorial-Updates

### 🎨 **Design & UX**
- UI-Komponenten mit Styled-Components
- Dark/Light Mode Theme Enhancements
- Accessibility (a11y) Verbesserungen
- Animation-Optimierungen (WebView Wave System)

### 🧪 **Testing & Quality Assurance**
- Unit Tests mit Jest
- Integration Tests für API-Endpoints
- E2E Tests mit Detox (geplant)
- Performance Testing und Profiling

### 🐛 **Bug Reports & Feature Requests**
- Detaillierte Bug-Berichte mit Reproduktions-Schritten
- Feature-Vorschläge mit Use-Case-Beschreibungen
- Performance-Issues und Optimierungs-Vorschläge

## 🏗️ Projektstruktur & Architektur

### Frontend (React Native + Expo)
```
src/
├── components/          # Reusable UI Components
│   ├── ui/             # Basic Elements (ProgressBar, WaveAnimation)
│   └── layout/         # Layout Components
├── screens/            # Screen Components
├── navigation.tsx      # React Navigation Setup
├── services/          # API Services & Storage
├── context/           # React Context (Theme, Date)
├── theme/             # Theme System (Dark/Light Mode)
├── styles/            # Styled-Components Definitions
├── types/             # TypeScript Type Definitions
└── utils/             # Helper Functions & Utilities
```

### Backend (Node.js + Express)
```
server/
├── controllers/       # Request Handlers
├── routes/           # API Route Definitions
├── middleware/       # Auth & Validation Middleware
├── config/           # Database & App Configuration
└── utils/            # Backend Utilities
```

## 🚀 Entwicklungs-Setup

### 📋 **Systemanforderungen**
- **Node.js**: v16.0.0+
- **npm**: v7.0.0+ (oder Yarn)
- **Expo CLI**: `npm install -g @expo/cli`
- **MySQL**: v8.0+ (für Backend-Entwicklung)

### 🛠️ **Lokale Entwicklungsumgebung**

1. **Repository Setup**:
   ```bash
   # Fork das Repository und klone deinen Fork
   git clone https://github.com/[dein-username]/calories_training_tracker.git
   cd calories_training_tracker
   
   # Upstream Remote hinzufügen
   git remote add upstream https://github.com/jonax1337/calories_training_tracker.git
   ```

2. **Frontend Setup**:
   ```bash
   # Dependencies installieren
   npm install
   
   # Expo Development Server starten
   npm start
   ```

3. **Backend Setup** (optional für API-Entwicklung):
   ```bash
   cd server
   npm install
   
   # .env Datei erstellen und konfigurieren
   cp .env.example .env
   # Bearbeite .env mit deinen MySQL-Credentials
   
   # MySQL Datenbank erstellen
   mysql -u root -p
   CREATE DATABASE calories_tracker;
   
   # Development Server starten
   npm run dev
   ```

4. **Testing Setup**:
   ```bash
   # Tests ausführen
   npm test
   
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   ```

## 📏 Code-Standards & Guidelines

### 🎯 **TypeScript Best Practices**
- **Strict Typing**: Verwende explizite Typen, vermeide `any`
- **Interface over Type**: Prefer interfaces für Objekt-Definitionen
- **Functional Components**: Nutze function keyword für React Components
- **Hook Usage**: useState, useEffect, useCallback, useMemo optimal einsetzen

### 🎨 **React Native Patterns**
```typescript
// ✅ Good: Functional Component with TypeScript
interface Props {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

export function CustomButton({ title, onPress, isLoading = false }: Props) {
  return (
    <StyledButton onPress={onPress} disabled={isLoading}>
      <ButtonText>{isLoading ? 'Loading...' : title}</ButtonText>
    </StyledButton>
  );
}

// ❌ Avoid: Class Components
export class CustomButton extends React.Component<Props> { ... }
```

### 🎨 **Styling Guidelines**
```typescript
// ✅ Good: Styled-Components with Theme
const StyledButton = styled.TouchableOpacity<{ variant?: 'primary' | 'secondary' }>`
  background-color: ${({ theme, variant }) => 
    variant === 'secondary' ? theme.colors.secondary : theme.colors.primary};
  padding: ${({ theme }) => theme.spacing.medium}px;
  border-radius: ${({ theme }) => theme.borderRadius.medium}px;
`;

// ❌ Avoid: Inline Styles für wiederverwendbare Komponenten
<TouchableOpacity style={{ backgroundColor: '#007AFF', padding: 16 }}>
```

### 📁 **File Naming Conventions**
- **Components**: `PascalCase.tsx` (z.B. `WaveAnimation.tsx`)
- **Screens**: `kebab-case-screen.tsx` (z.B. `home-screen.tsx`)
- **Utilities**: `kebab-case.ts` (z.B. `date-utils.ts`)
- **Types**: `kebab-case-types.ts` (z.B. `navigation-types.ts`)

### 🔧 **Import Guidelines**
```typescript
// ✅ Good: Geordnete Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';

import { CustomButton } from '../components/ui/custom-button';
import { useTheme } from '../theme/theme-context';
import { formatDate } from '../utils/date-utils';
import type { UserProfile } from '../types/user-types';

// ❌ Avoid: Ungeordnete oder relative Imports ohne Gruppierung
```

## 🧪 Testing & Quality

### 📋 **Test Checkliste**
- [ ] **Unit Tests**: Kritische Utility-Funktionen getestet
- [ ] **Component Tests**: UI-Komponenten mit verschiedenen Props
- [ ] **Integration Tests**: API-Endpoints und Service-Functions
- [ ] **Manual Testing**: iOS und Android Device/Simulator
- [ ] **Performance Testing**: Animationen, große Listen, Memory Leaks

### 🔍 **Code Review Kriterien**
- **Funktionalität**: Code erfüllt Requirements
- **Performance**: Keine unnötigen Re-Renders oder Memory Leaks
- **Accessibility**: ARIA-Labels, Screen Reader Support
- **Error Handling**: Graceful Error Handling und User Feedback
- **Security**: Keine hardcoded Secrets oder Vulnerabilities

## 🔄 Git Workflow

### 🌿 **Branch Naming**
```bash
# Features
feature/barcode-scanner-improvements
feature/dark-mode-theme-system

# Bug Fixes
fix/water-tracking-animation-lag
fix/profile-screen-crash-ios

# Hotfixes
hotfix/authentication-token-expiry

# Refactoring
refactor/styled-components-theme-structure
```

### 📝 **Commit Message Guidelines**
Folge den [Conventional Commits](https://www.conventionalcommits.org/) Standards:

```bash
# Features
feat(auth): add JWT token refresh mechanism
feat(ui): implement WebView-based wave animations

# Bug Fixes
fix(profile): resolve BMI calculation overflow
fix(navigation): prevent back navigation on auth screens

# Documentation
docs(readme): update installation instructions
docs(api): add JSDoc for authentication endpoints

# Styling
style(theme): update dark mode color palette
style(components): improve button spacing consistency

# Refactoring
refactor(services): extract common API error handling
refactor(types): consolidate user-related type definitions

# Performance
perf(animations): optimize wave animation rendering
perf(lists): implement FlatList virtualization
```

## 📋 Pull Request Process

### ✅ **PR Checkliste**
Stelle sicher, dass dein Pull Request diese Kriterien erfüllt:

- [ ] **Code Quality**
  - [ ] TypeScript strict mode ohne Errors
  - [ ] ESLint und Prettier Rules befolgt
  - [ ] Keine Console.log statements oder unused imports
  - [ ] Proper error handling implementiert

- [ ] **Testing**
  - [ ] Neue Features haben entsprechende Tests
  - [ ] Alle existierenden Tests bestehen
  - [ ] Manual testing auf iOS und Android durchgeführt
  - [ ] Performance impact evaluiert

- [ ] **Documentation**
  - [ ] Code-Kommentare für komplexe Logik
  - [ ] README updates bei neuen Features
  - [ ] API documentation für neue endpoints

- [ ] **Design & UX**
  - [ ] UI follows design system consistency
  - [ ] Dark/Light mode support
  - [ ] Responsive design für verschiedene Screen-Größen
  - [ ] Accessibility guidelines befolgt

### 📋 **PR Template**
```markdown
## 🎯 Beschreibung
Kurze Beschreibung der Änderungen und deren Motivation.

## 🔄 Änderungen
- [ ] Feature: ...
- [ ] Fix: ...
- [ ] Refactor: ...

## 🧪 Testing
- [ ] iOS Simulator getestet
- [ ] Android Emulator getestet
- [ ] Unit Tests hinzugefügt/aktualisiert
- [ ] Performance impact evaluiert

## 📱 Screenshots
(Screenshots von UI-Änderungen)

## ⚠️ Breaking Changes
(Falls vorhanden, Liste der Breaking Changes)

## 📋 Checklist
- [ ] Code follows project guidelines
- [ ] Self-review of the code performed
- [ ] Tests added/updated and passing
- [ ] Documentation updated
```

## 🔍 Code Review Process

### 👥 **Review Team**
- **Primary Maintainer**: [@jonax1337](https://github.com/jonax1337)
- **Review Response Time**: Innerhalb von 48 Stunden
- **Approval Requirements**: Mindestens 1 Maintainer Approval

### 📋 **Review Fokus**
- **Architecture**: Passt die Änderung zur App-Architektur?
- **Performance**: Keine Performance-Regression?
- **Security**: Sichere Implementierung ohne Vulnerabilities?
- **UX**: Consistent mit Design System und User Experience?

## 🎯 Spezielle Beitragsbereiche

### 🌊 **Wave Animation System**
- WebView-basierte CSS Animationen
- Performance-Optimierung für smooth 60fps
- Multi-Layer Parallax Effekte
- Theme-Integration für Dark/Light Mode

### 🔐 **Authentication & Security**
- JWT Token Management
- Secure Password Hashing (bcrypt)
- API Endpoint Protection
- Input Validation & Sanitization

### 📱 **Health Integration**
- HealthKit (iOS) Integration
- Google Fit (Android) Integration
- Health Data Privacy Compliance
- Cross-Platform Health API Abstraction

### ⏱️ **HIIT Timer System**
- High-Precision Timer Implementation
- Audio/Haptic Feedback Integration
- Configurable Workout Patterns
- Background Timer Support

## 🌟 Anerkennung & Credits

Alle Contributors werden in der [CONTRIBUTORS.md](CONTRIBUTORS.md) anerkannt und im GitHub Repository highlighted. Besondere Beiträge werden im Release Notes erwähnt.

## 📞 Support & Kontakt

Bei Fragen zum Contributing-Prozess oder technischen Problemen:

- **💬 GitHub Issues**: Für öffentliche Diskussionen und Bug Reports
- **📧 Direct Contact**: jonas.laux@hotmail.com
- **🐱 GitHub**: [@jonax1337](https://github.com/jonax1337)

## 📄 Code of Conduct

Wir erwarten von allen Contributors:
- **Respektvolle Kommunikation** in Issues und PRs
- **Konstruktives Feedback** während Code Reviews
- **Inclusive Environment** für alle Skill-Level
- **Focus auf Code Quality** und User Experience

---

**🚀 Vielen Dank für Ihr Interesse am Calories Training Tracker!**

*Jeder Beitrag, ob groß oder klein, hilft dabei, diese App zu verbessern und die Community zu stärken.*
