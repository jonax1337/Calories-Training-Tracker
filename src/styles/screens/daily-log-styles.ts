import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface fu00fcr Styles
interface DailyLogStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  scrollContent: ViewStyle;
  dateHeader: TextStyle;
  summaryCard: ViewStyle;
  summaryTitle: TextStyle;
  summaryContent: ViewStyle;
  summaryItem: ViewStyle;
  summaryValue: TextStyle;
  summaryLabel: TextStyle;
  waterCard: ViewStyle;
  waterHeader: ViewStyle;
  waterTitle: TextStyle;
  waterValue: TextStyle;
  waterButtons: ViewStyle;
  waterButton: ViewStyle;
  waterButtonText: TextStyle;
  sectionTitle: TextStyle;
  mealCategoryCard: ViewStyle;
  mealCategoryContent: ViewStyle;
  mealCategoryTitle: TextStyle;
  mealCategorySubtitle: TextStyle;
  mealCategoryCalories: TextStyle;
  addFoodButton: ViewStyle;
  addFoodButtonText: TextStyle;
  mealList: ViewStyle;
  mealSection: ViewStyle;
  mealTypeHeader: TextStyle;
  foodEntryCard: ViewStyle;
  foodEntryHeader: ViewStyle;
  foodName: TextStyle;
  brandText: TextStyle;
  servingContainer: ViewStyle;
  servingText: TextStyle;
  nutritionContainer: ViewStyle;
  nutritionItem: ViewStyle;
  nutritionValue: TextStyle;
  nutritionLabel: TextStyle;
  removeButton: ViewStyle;
  removeButtonText: TextStyle;
  viewButton: ViewStyle;
  viewButtonText: TextStyle;
  messageText: TextStyle;
  mealHeader: ViewStyle;
  mealHeaderText: TextStyle;
  mealCountText: TextStyle;
  mealCaloriesText: TextStyle;
  accordionButton: ViewStyle;
}

// Erstellt und gibt die Styles zuru00fcck, basierend auf dem aktuellen Theme
export const createDailyLogStyles = (theme: Theme): DailyLogStyles => StyleSheet.create({
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
  scrollContent: {
    flex: 1,
  },
  dateHeader: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  summaryCard: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.m,
    marginBottom: theme.spacing.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.s,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  waterCard: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  waterTitle: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  waterValue: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    padding: theme.spacing.s,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.medium,
  },
  waterButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  addFoodButton: {
    padding: theme.spacing.m,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
  },
  addFoodButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: 'white',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  mealCategoryCard: {
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealSection: {
    marginBottom: theme.spacing.m,
  },
  mealCategoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCategoryTitle: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  mealCategorySubtitle: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  mealCategoryCalories: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  mealList: {
    marginTop: theme.spacing.m,
  },
  mealTypeHeader: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: 4,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  foodEntryCard: {
    padding: theme.spacing.m,
    marginVertical: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  foodName: {
    fontSize: theme.typography.fontSize.m,
    flex: 1,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  brandText: {
    fontSize: theme.typography.fontSize.m,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  servingContainer: {
    marginBottom: theme.spacing.s,
  },
  servingText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  nutritionValue: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
  },
  nutritionLabel: {
    fontSize: theme.typography.fontSize.s,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  removeButton: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.small,
  },
  removeButtonText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
  },
  viewButton: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.small,
    marginTop: theme.spacing.xs,
  },
  viewButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
  },
  messageText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    padding: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  mealHeaderText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    color: theme.colors.text,
  },
  mealCountText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.xs,
  },
  mealCaloriesText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  accordionButton: {
    padding: theme.spacing.xs,
  },
});
