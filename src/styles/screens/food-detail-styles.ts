import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface FoodDetailStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
  scrollContent: ViewStyle;
  scrollContentContainer: ViewStyle;
  topSpacer: ViewStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  cardTitleWithBrand: TextStyle;
  brandInfoContainer: ViewStyle;
  brandText: TextStyle;
  portionInfoContainer: ViewStyle;
  portionInfoTitle: TextStyle;
  portionInfoDescription: TextStyle;
  nutritionContainer: ViewStyle;
  mealSelectionCard: ViewStyle;
  imagePlaceholder: ViewStyle;
  placeholderText: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  textInput: TextStyle;
  brandContainer: ViewStyle;
  brandLabel: TextStyle;
  barcodeContainer: ViewStyle;
  barcodeLabel: TextStyle;
  barcodeText: TextStyle;
  servingsContainer: ViewStyle;
  servingsLabel: TextStyle;
  servingsInput: TextStyle;
  servingHeader: ViewStyle;
  servingsAmount: TextStyle;
  slider: ViewStyle;
  sliderLabels: ViewStyle;
  sectionContainer: ViewStyle;
  sectionTitle: TextStyle;
  mealTypeContainer: ViewStyle;
  mealButton: ViewStyle;
  mealButtonSelected: ViewStyle;
  mealButtonUnselected: ViewStyle;
  selectedMealButton: ViewStyle;
  mealButtonText: TextStyle;
  mealButtonTextSelected: TextStyle;
  selectedMealButtonText: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  label: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createFoodDetailStyles = (theme: Theme): FoodDetailStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    width: '100%',
    zIndex: 10,
  },
  headerText: {
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.l,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingRight: theme.spacing.m,
    paddingLeft: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  topSpacer: {
    marginTop: theme.spacing.m,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  servingHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  servingsAmount: {
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
  },
  slider: {
    height: 40,
    alignSelf: 'stretch',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  loadingContainer: {
    padding: theme.spacing.m,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
  },
  errorContainer: {
    padding: theme.spacing.l,
    alignItems: 'center',
    marginTop: theme.spacing.l,
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.error,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  cardTitleWithBrand: {
    marginBottom: theme.spacing.s,
  },
  brandInfoContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.small,
  },
  brandText: {
    color: theme.colors.textLight,
    marginBottom: 0,
    fontFamily: theme.typography.fontFamily.medium,
  },
  portionInfoContainer: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.small,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  portionInfoTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: theme.spacing.xs,
  },
  portionInfoDescription: {
    color: theme.colors.text,
    opacity: 0.7,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing.xs,
  },
  nutritionContainer: {
    marginBottom: theme.spacing.s,
  },
  mealSelectionCard: {
    marginTop: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    fontSize: theme.typography.fontSize.m,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.regular,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m,
  },
  placeholderText: {
    color: '#888',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.s,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  brandLabel: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    marginRight: theme.spacing.xs,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  barcodeLabel: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    marginRight: theme.spacing.xs,
  },
  barcodeText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: 'monospace',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  servingsLabel: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    marginRight: theme.spacing.xs,
  },
  servingsInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
    width: 60,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  sectionContainer: {
    marginVertical: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealButton: {
    minWidth: '47%',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    marginBottom: theme.spacing.s,
  },
  mealButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  mealButtonUnselected: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  selectedMealButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  mealButtonText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  mealButtonTextSelected: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  selectedMealButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.xl,
  },
  addButtonText: {
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    textAlign: 'center',
  },
});
