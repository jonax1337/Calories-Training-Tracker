import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/themeTypes';

// TypeScript Interface für Auth Styles
interface AuthStyles {
  container: ViewStyle;
  scrollContent: ViewStyle;
  loginScrollContent: ViewStyle;
  header: ViewStyle;
  form: ViewStyle;
  inputGroup: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  footerText: TextStyle;
  footerLink: TextStyle;
  footerRow: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createAuthStyles = (theme: Theme): AuthStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xs,
  },
  // Spezielles Style fu00fcr den Login-Screen mit vertikaler Zentrierung
  loginScrollContent: {
    flexGrow: 1,
    padding: theme.spacing.xs,
    justifyContent: 'center', // Vertikal zentrieren
  },
  header: {
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: theme.spacing.l,
  },
  label: {
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.medium
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium
  },
  footerText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.regular,
    marginRight: theme.spacing.xs
  },
  footerLink: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.m
  },
  errorContainer: {
    backgroundColor: `${theme.colors.errorLight}`,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.medium
  },
});
