import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface HomeStyles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  inputContainer: ViewStyle;
  inputWithUnit: ViewStyle;
  input: TextStyle;
  unitText: TextStyle;
  modalButtons: ViewStyle;
  modalButton: ViewStyle;
  cancelButton: ViewStyle;
  saveButton: ViewStyle;
  stickyHeader: ViewStyle;
  scrollContent: ViewStyle;
  scrollContentContainer: ViewStyle;
  dateHeader: TextStyle;
  summaryCard: ViewStyle;
  cardTitle: TextStyle;
  cardHeaderRow: ViewStyle;
  cheatDayButton: ViewStyle;
  cheatDayButtonActive: ViewStyle;
  cheatDayText: TextStyle;
  cheatDayTextActive: TextStyle;
  waterContainer: ViewStyle;
  waterButtonsContainer: ViewStyle;
  waterButton: ViewStyle;
  waterButtonText: TextStyle;
  nutritionReportHeaderRow: ViewStyle;
  nutritionReportButton: ViewStyle;
  nutritionReportButtonText: TextStyle;
  weightContainer: ViewStyle;
  weightHeaderRow: ViewStyle;
  weightHistoryButton: ViewStyle;
  weightHistoryButtonText: TextStyle;
  weightControlsContainer: ViewStyle;
  weightMainRow: ViewStyle;
  weightButton: ViewStyle;
  weightButtonSmall: ViewStyle;
  weightDisplay: ViewStyle;
  weightText: TextStyle;
  weightSmallRow: ViewStyle;
  weightSmallLabel: TextStyle;
  statRow: ViewStyle;
  stat: ViewStyle;
  statValue: TextStyle;
  statLabel: TextStyle;
  actionsContainer: ViewStyle;
  actionButton: ViewStyle;
  actionButtonText: TextStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createHomeStyles = (theme: Theme): HomeStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.m,
    color: theme.colors.textLight,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    elevation: 5,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  inputWithUnit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderRadius: theme.borderRadius.small,
    fontFamily: theme.typography.fontFamily.medium,
    padding: theme.spacing.s,
    paddingRight: 40,
    fontSize: theme.typography.fontSize.l,
  },
  unitText: {
    position: 'absolute',
    right: 12,
    alignSelf: 'center',
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 16,
    opacity: 0.7,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.small,
  },
  cancelButton: {
    backgroundColor: theme.colors.error + '20',
  },
  saveButton: {
    backgroundColor: theme.colors.primary + '20',
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
    borderRadius: theme.borderRadius.m,
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    marginTop: -theme.spacing.m,
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
  waterContainer: {
    height: theme.spacing.xl * 5,
    marginVertical: theme.spacing.s,
  },
  waterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  waterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing.xs,
    minWidth: 60,
    flex: 1,
    maxWidth: 120,
  },
  waterButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    color: "white",
    fontSize: theme.typography.fontSize.s,
    textAlign: 'center',
  },
  nutritionReportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: -theme.spacing.m,
  },
  nutritionReportButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
  },
  weightContainer: {
    marginBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weightHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: -theme.spacing.m,
  },
  weightHistoryButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: 'white',
  },
  weightControlsContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  weightMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weightButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 99,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  weightButtonSmall: {
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 99,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  weightDisplay: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  weightText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 24,
    color: theme.colors.text,
  },
  weightSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  weightSmallLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: theme.colors.textLight,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
  },
  stat: {
    alignItems: 'center',
    padding: theme.spacing.s,
    minWidth: 100,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  actionsContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.m,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.m,
  },
});
