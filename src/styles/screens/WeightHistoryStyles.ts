import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/themeTypes';

// TypeScript Interface für Styles
interface WeightHistoryStyles {
  container: ViewStyle;
  content: ViewStyle;
  contentContainer: ViewStyle;
  timeRangeSelector: ViewStyle;
  timeRangeButton: ViewStyle;
  timeRangeButtonActive: ViewStyle;
  timeRangeText: TextStyle;
  timeRangeTextActive: TextStyle;
  statsCard: ViewStyle;
  cardTitle: TextStyle;
  statsRow: ViewStyle;
  statItem: ViewStyle;
  statLabel: TextStyle;
  statValue: TextStyle;
  statValueContainer: ViewStyle;
  noDataContainer: ViewStyle;
  noDataText: TextStyle;
  loadingContainer: ViewStyle;
  chartContainer: ViewStyle;
  trendIconDown: TextStyle;
  trendIconUp: TextStyle;
  trendIconNeutral: TextStyle;
  chartStyle: ViewStyle;
  chartTitle: TextStyle;
}

export const createWeightHistoryStyles = (theme: Theme): WeightHistoryStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  timeRangeButton: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  timeRangeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeRangeText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  timeRangeTextActive: {
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
  },
  statValue: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
  },
  loadingContainer: {
    marginVertical: 40,
  },
  chartContainer: {
    marginVertical: theme.spacing.s,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
  },
  trendIconDown: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.l
  },
  trendIconUp: {
    color: theme.colors.warning,
    fontSize: theme.typography.fontSize.l
  },
  trendIconNeutral: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.l
  },
  chartStyle: {
    marginVertical: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    padding: 16
  }
});