/**
 * Theme types for the app
 */

export type ThemeType = 'light' | 'dark' | 'pink';

export interface Colors {
  primary: string;
  primaryLight: string;  // Light variant of primary color
  secondary: string;
  secondaryLight: string;  // Light variant of secondary color
  accent: string;       // Accent color for highlights
  accentLight: string;  // Light variant of accent color
  background: string;
  card: string;
  text: string;
  textLight: string;    // Light variant of text color for subtitles
  border: string;
  notification: string;
  shadow: string;      // Shadow color for elevation effects
  error: string;
  errorLight: string;   // Light variant of error color
  success: string;
  successLight: string; // Light variant of success color
  warning: string;
  warningLight: string; // Light variant of warning color
  info: string;
  infoLight: string;    // Light variant of info color
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
  elevation: {
    level1: string;
    level2: string;
    level3: string;
  };
}

export interface Spacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

export interface BorderRadius {
  tiny: number;     // Sehr kleine Abrundung für kleine Elemente
  small: number;   // Kleine Abrundung für Buttons und Tags
  medium: number;  // Mittlere Abrundung für Cards und Inputs
  large: number;   // Große Abrundung für große Karten und Dialoge
  extraLarge: number; // Extra große Abrundung für spezielle UI-Elemente
  round: number;   // Kreisförmige Elemente
  // Abwärtskompatibilität beibehalten
  s: number;
  m: number;
  l: number;
  xl: number;
}

export interface Typography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
}

export interface Theme {
  dark: boolean;
  type: ThemeType;
  colors: Colors;
  spacing: Spacing;
  borderRadius: BorderRadius;
  typography: Typography;
}
