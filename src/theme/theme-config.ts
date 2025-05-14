import { Colors, Theme, ThemeType } from './theme-types';

// Common spacing values
const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Common border radius values
const borderRadius = {
  tiny: 2,
  small: 4,
  medium: 8,
  large: 16,
  extraLarge: 24,
  round: 9999,
  // Backward compatibility
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
};

// Extra rounded border radius for pink theme
const pinkBorderRadius = {
  tiny: 6,
  small: 10,
  medium: 16,
  large: 24,
  extraLarge: 32,
  round: 9999,
  // Backward compatibility
  s: 10,
  m: 16,
  l: 24,
  xl: 32,
};

// Typography configuration
const typography = {
  fontFamily: {
    regular: 'SpaceGrotesk-Regular',
    medium: 'SpaceGrotesk-Medium',
    bold: 'SpaceGrotesk-Bold',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
  },
};

// Light theme colors
const lightColors: Colors = {
  primary: '#3498DB',
  primaryLight: '#ebf5fb',
  secondary: '#03A9F4',
  secondaryLight: '#E1F5FE',
  accent: '#FF9800',
  accentLight: '#FFF3E0',
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#212121',
  textLight: '#757575',
  border: '#E0E0E0',
  notification: '#FF5722',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#F44336',
  errorLight: '#FFEBEE',
  success: '#4FD1C5',
  successLight: '#E6FFFA',
  warning: '#FFC107',
  warningLight: '#FFF8E1',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  onSurface: '#212121',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  elevation: {
    level1: 'rgba(0, 0, 0, 0.05)',
    level2: 'rgba(0, 0, 0, 0.08)',
    level3: 'rgba(0, 0, 0, 0.12)',
  },
};

// Dark theme colors
const darkColors: Colors = {
  primary: '#3498DB',
  primaryLight: '#1B4F72',
  secondary: '#29B6F6',
  secondaryLight: '#0D47A1',
  accent: '#FFA726',
  accentLight: '#BF360C',
  background: '#121212',
  card: '#1E1E1E',
  text: '#F5F5F5',
  textLight: '#B0BEC5',
  border: '#333333',
  notification: '#FF7043',
  shadow: 'rgba(0, 0, 0, 0.3)',
  error: '#EF5350',
  errorLight: '#5D1F1F',
  success: '#4FD1C5',
  successLight: '#1D4B45',
  warning: '#FFCA28',
  warningLight: '#4E3C00',
  info: '#42A5F5',
  infoLight: '#0D47A1',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  onSurface: '#E0E0E0',
  disabled: '#757575',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.7)',
  elevation: {
    level1: 'rgba(0, 0, 0, 0.2)',
    level2: 'rgba(0, 0, 0, 0.25)',
    level3: 'rgba(0, 0, 0, 0.3)',
  },
};

// Pink (girly) theme colors
const pinkColors: Colors = {
  primary: '#EC407A',
  primaryLight: '#FCE4EC',
  secondary: '#AB47BC',
  secondaryLight: '#F3E5F5',
  accent: '#FF4081',
  accentLight: '#FF80AB',
  background: '#FFF4F7',
  card: '#FFFFFF',
  text: '#442C2E',
  textLight: '#7E5760',
  border: '#FADADD',
  notification: '#F48FB1',
  shadow: 'rgba(236, 64, 122, 0.2)',
  error: '#E91E63',
  errorLight: '#FCE4EC',
  success: '#EC407A',
  successLight: '#FCE4EC',
  warning: '#F8BBD0',
  warningLight: '#F8E3EA',
  info: '#CE93D8',
  infoLight: '#F3E5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FFF4F7',
  onSurface: '#442C2E',
  disabled: '#FDBDC8',
  placeholder: '#C48B9F',
  backdrop: 'rgba(236, 64, 122, 0.3)',
  elevation: {
    level1: 'rgba(236, 64, 122, 0.05)',
    level2: 'rgba(236, 64, 122, 0.08)',
    level3: 'rgba(236, 64, 122, 0.12)',
  },
};

// Create the theme configurations
export const lightTheme: Theme = {
  dark: false,
  type: 'light',
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
};

export const darkTheme: Theme = {
  dark: true,
  type: 'dark',
  colors: darkColors,
  spacing,
  borderRadius,
  typography,
};

export const pinkTheme: Theme = {
  dark: false,
  type: 'pink',
  colors: pinkColors,
  spacing,
  borderRadius: pinkBorderRadius, // Extra rounded corners for pink theme
  typography,
};

// Function to get a theme based on type
export function getThemeByType(themeType: ThemeType): Theme {
  switch (themeType) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'pink':
      return pinkTheme;
    default:
      return lightTheme;
  }
}
