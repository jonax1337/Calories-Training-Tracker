import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/themeTypes';

export const createLoadingScreenStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  message: {
    fontSize: theme.typography.fontSize.m,
    marginTop: theme.spacing.m,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
  },
});