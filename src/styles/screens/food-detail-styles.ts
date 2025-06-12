import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface FoodDetailStyles {
  container: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
  scrollContent: ViewStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  imagePlaceholder: ViewStyle;
  placeholderText: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  textInput: TextStyle;
  brandContainer: ViewStyle;
  brandLabel: TextStyle;
  brandText: TextStyle;
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
  selectedMealButton: ViewStyle;
  mealButtonText: TextStyle;
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
    marginTop: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
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
    marginBottom: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.medium,
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
  brandText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
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
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.s,
    display: 'none',
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
