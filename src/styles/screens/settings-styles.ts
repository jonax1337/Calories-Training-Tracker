import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface SettingsStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
  scrollContent: ViewStyle;
  sectionTitle: TextStyle;
  sectionDescription: TextStyle;
  themeOption: ViewStyle;
  themeColorPreview: ViewStyle;
  themeColorAccent: ViewStyle;
  themeTextContainer: ViewStyle;
  themeLabel: TextStyle;
  themeDescription: TextStyle;
  infoCard: ViewStyle;
  infoHeader: ViewStyle;
  infoVersion: TextStyle;
  infoText: TextStyle;
  logoutButton: ViewStyle;
  logoutText: TextStyle;
  // Wassererinnerungen
  settingCard: ViewStyle;
  settingRow: ViewStyle;
  settingLabel: TextStyle;
  settingValue: TextStyle;
  switchContainer: ViewStyle;
  sliderContainer: ViewStyle;
  sliderValueText: TextStyle;
  timeRangeContainer: ViewStyle;
  timeValue: TextStyle;
  timeLabel: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createSettingsStyles = (theme: Theme): SettingsStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xs,
    zIndex: 10,
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerText: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    paddingVertical: theme.spacing.s,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.s,
    marginBottom: theme.spacing.l,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeColorPreview: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.small,
  },
  themeColorAccent: {
    width: 30,
    height: 30,
  },
  themeTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  themeLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    color: theme.colors.text,
  },
  themeDescription: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.s,
    color: theme.colors.onSurface,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  infoHeader: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.s,
  },
  infoVersion: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
  },
  infoText: {
    lineHeight: 24,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.l,
    marginTop: theme.spacing.s,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
  },
  settingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.m,
    marginVertical: theme.spacing.s,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.text,
    flex: 1,
    marginVertical: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  settingValue: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.primary,
    marginRight: theme.spacing.s,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderContainer: {
    marginVertical: theme.spacing.s,
  },
  sliderValueText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: theme.spacing.s,
  },
  timeValue: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  timeLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: theme.spacing.xs/2, // Half of xs instead of xxs
  },
});
