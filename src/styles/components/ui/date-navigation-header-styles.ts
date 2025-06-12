import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme-types';

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
});