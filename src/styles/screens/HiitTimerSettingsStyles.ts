import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/themeTypes';

export const createHIITTimerSettingsStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  settingsContainer: {
    padding: theme.spacing.m,
  },
  headerText: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.s,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  settingContainer: {
    marginBottom: theme.spacing.m,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.m,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  actionButton: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.l,
    elevation: 2,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
  },
});