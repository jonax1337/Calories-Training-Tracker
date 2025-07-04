import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/themeTypes';

export const createDateNavigationHeaderStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.xs,
  },
  dateButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    position: 'relative',
  },
  dateContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  dateText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    color: theme.colors.text,
  },
  dateTextToday: {
    color: theme.colors.primary,
  },
  streakBadge: {
    position: 'absolute',
    top: -10,
    right: -20,
    borderRadius: theme.borderRadius.medium,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    backgroundColor: theme.colors.primary + '75',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs / 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    marginRight: theme.spacing.xs / 2,
  },
  streakNumber: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    marginRight: theme.spacing.xs,
    color: theme.colors.text,
  },
});