import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme-types';

export const createProgressBarStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.s,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  values: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginBottom:theme.spacing.xs
  },
  valuesError: {
    color: theme.colors.error,
  },
  progressBackground: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
  },
  progressFill: {
    // Animated styles will be applied inline
  },
});