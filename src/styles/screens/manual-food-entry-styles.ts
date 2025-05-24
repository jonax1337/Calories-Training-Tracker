import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface ManualFoodEntryStyles {
  container: ViewStyle;
  scrollContent: ViewStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  textInput: TextStyle;
  nutritionInputContainer: ViewStyle;
  nutritionHeader: TextStyle;
  servingsContainer: ViewStyle;
  servingsLabel: TextStyle;
  servingsInput: TextStyle;
  servingHeader: ViewStyle;
  servingsAmount: TextStyle;
  slider: ViewStyle;
  sliderLabels: ViewStyle;
  mealContainer: ViewStyle;
  mealButtonsRow: ViewStyle;
  mealButton: ViewStyle;
  selectedMealButton: ViewStyle;
  mealButtonText: TextStyle;
  selectedMealButtonText: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createManualFoodEntryStyles = (theme: Theme): ManualFoodEntryStyles => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
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
    marginBottom: theme.spacing.m,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.medium,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.s,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  nutritionInputContainer: {
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.card,
  },
  nutritionHeader: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xs,
    width: 60,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
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
  mealContainer: {
    marginVertical: theme.spacing.m,
  },
  mealButtonsRow: {
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
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.s,
  },
  selectedMealButton: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  mealButtonText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
  },
  selectedMealButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.m,
  },
  addButtonText: {
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.l,
    textAlign: 'center',
  },
});
