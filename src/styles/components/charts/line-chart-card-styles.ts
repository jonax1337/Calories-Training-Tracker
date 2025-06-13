import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme-types';

export const createLineChartCardStyles = (theme: Theme) => StyleSheet.create({
  chartCard: {
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.m,
    marginVertical: theme.spacing.s,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'left',
    paddingTop: theme.spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  legendContainer: {
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.s,
    marginVertical: theme.spacing.xs,
  },
  legendColor: {
    width: theme.spacing.s,
    height: theme.spacing.s,
    borderRadius: theme.spacing.s / 2,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
});