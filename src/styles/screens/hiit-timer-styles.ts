import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface HIITTimerStyles {
  container: ViewStyle;
  settingsScroll: ViewStyle;
  settingsContainer: ViewStyle;
  settingsTitle: TextStyle;
  settingRow: ViewStyle;
  settingLabel: TextStyle;
  settingInput: TextStyle;
  timerContainer: ViewStyle;
  timerControls: ViewStyle;
  controlsRow: ViewStyle;
  controlButton: ViewStyle;
  actionButton: ViewStyle;
  actionButtonText: TextStyle;
  linkButton: ViewStyle;
  linkButtonText: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createHIITTimerStyles = (theme: Theme): HIITTimerStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  settingsScroll: {
    flex: 1,
  },
  settingsContainer: {
    padding: theme.spacing.m,
  },
  settingsTitle: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.l,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.m,
    flex: 1,
  },
  settingInput: {
    width: 80,
    height: 45,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.typography.fontSize.m,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  timerControls: {
    marginTop: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    maxWidth: 280,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButton: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.l,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
  },
  linkButton: {
    padding: theme.spacing.m,
  },
  linkButtonText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
  },
});
