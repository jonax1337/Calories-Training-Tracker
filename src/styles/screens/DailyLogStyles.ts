import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/themeTypes';

// TypeScript Interface fu00fcr Styles
interface DailyLogStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentContainer: ViewStyle;
  dateHeader: TextStyle;
  summaryCard: ViewStyle;
  summaryHeaderRow: ViewStyle;
  summaryTitle: TextStyle;
  summaryContent: ViewStyle;
  summaryItem: ViewStyle;
  summaryValue: TextStyle;
  summaryLabel: TextStyle;
  cheatDayButton: ViewStyle;
  cheatDayButtonActive: ViewStyle;
  cheatDayText: TextStyle;
  cheatDayTextActive: TextStyle;
  waterCard: ViewStyle;
  waterHeader: ViewStyle;
  waterTitle: TextStyle;
  waterValue: TextStyle;
  waterButtons: ViewStyle;
  waterButton: ViewStyle;
  waterButtonText: TextStyle;
  sectionTitle: TextStyle;
  mealCategoryCard: ViewStyle;
  mealCategoryCardExpanded: ViewStyle;
  mealCategoryContent: ViewStyle;
  mealCategoryTitle: TextStyle;
  mealCategorySubtitle: TextStyle;
  mealCategoryCalories: TextStyle;
  mealCategoryLeftSection: ViewStyle;
  mealCategoryRightSection: ViewStyle;
  mealTitleContainer: ViewStyle;
  scanIcon: TextStyle;
  addFoodButton: ViewStyle;
  addFoodButtonText: TextStyle;
  addEntryButton: ViewStyle;
  addEntryButtonText: TextStyle;
  addEntryContainer: ViewStyle;
  mealList: ViewStyle;
  mealSection: ViewStyle;
  mealSectionContainer: ViewStyle;
  mealTypeHeader: TextStyle;
  accordionContent: ViewStyle;
  accordionContentLast: ViewStyle;
  noEntriesContainer: ViewStyle;
  noEntriesText: TextStyle;
  lastFoodEntryContainer: ViewStyle;
  lastSwipeActionContainerLeft: ViewStyle;
  lastSwipeActionContainerRight: ViewStyle;
  foodEntryCard: ViewStyle;
  foodEntryContainer: ViewStyle;
  foodEntryHeader: ViewStyle;
  foodEntryLeftSection: ViewStyle;
  foodEntryRightSection: ViewStyle;
  foodName: TextStyle;
  foodServing: TextStyle;
  foodCalories: TextStyle;
  brandText: TextStyle;
  servingContainer: ViewStyle;
  servingText: TextStyle;
  nutritionContainer: ViewStyle;
  nutritionItem: ViewStyle;
  nutritionValue: TextStyle;
  nutritionLabel: TextStyle;
  removeButton: ViewStyle;
  removeButtonText: TextStyle;
  editButton: ViewStyle;
  editButtonText: TextStyle;
  swipeActionContainer: ViewStyle;
  swipeActionButton: ViewStyle;
  swipeActionContent: ViewStyle;
  swipeActionText: TextStyle;
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
  scrollContentContainer: {
    padding: 16,
    paddingTop: 16,
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
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  cheatDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    marginTop: -theme.spacing.s,
  },
  cheatDayButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  cheatDayText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
  },
  cheatDayTextActive: {
    color: 'white',
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
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
  },
  addEntryButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    color: 'white',
  },
  addEntryContainer: {
    padding: theme.spacing.m,
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.s,
  },
  mealCategoryCard: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealCategoryCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  mealSection: {
    marginBottom: theme.spacing.m,
  },
  mealSectionContainer: {
    marginBottom: theme.spacing.m,
  },
  accordionContent: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
    paddingBottom: 0,
  },
  accordionContentLast: {
    marginBottom: 0,
    borderBottomLeftRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
  },
  mealCategoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCategoryLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCategoryRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scanIcon: {
    marginEnd: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
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
    marginRight: 8,
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
  foodEntryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.card,
    minHeight: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  foodEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  foodEntryLeftSection: {
    flex: 1,
  },
  foodEntryRightSection: {
    alignItems: 'flex-end',
  },
  foodName: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  foodServing: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    fontSize: 12,
  },
  foodCalories: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.primary,
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
  editButton: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.accent + '20',
    borderRadius: theme.borderRadius.small,
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.accent,
  },
  swipeActionContainer: {
    width: 80,
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  swipeActionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  swipeActionContent: {
    alignItems: 'center',
  },
  swipeActionText: {
    color: 'white',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 4,
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
  noEntriesContainer: {
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEntriesText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  lastFoodEntryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
  },
  lastSwipeActionContainerLeft: {
    borderBottomLeftRadius: theme.borderRadius.medium,
  },
  lastSwipeActionContainerRight: {
    borderBottomRightRadius: theme.borderRadius.medium,
  },
});
