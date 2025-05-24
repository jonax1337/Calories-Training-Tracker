import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface TrainingStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
  scrollContent: ViewStyle;
  sectionTitle: TextStyle;
  sectionDescription: TextStyle;
  emptyStateContainer: ViewStyle;
  emptyStateText: TextStyle;
  timerButton: ViewStyle;
  timerButtonText: TextStyle;
  timerIcon: ViewStyle;
  startTimerButton: ViewStyle;
  startTimerButtonText: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createTrainingStyles = (theme: Theme): TrainingStyles => StyleSheet.create({
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
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
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
    padding: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.s,
    marginBottom: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  timerButtonText: {
    fontSize: theme.typography.fontSize.s,
    marginLeft: theme.spacing.xs,
  },
  timerIcon: {
    marginRight: theme.spacing.xs / 2,
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  startTimerButtonText: {
    fontSize: theme.typography.fontSize.m,
  },
});
