import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Styles
interface HomeStyles {
  container: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  inputContainer: ViewStyle;
  input: TextStyle;
  modalButtons: ViewStyle;
  modalButton: ViewStyle;
  stickyHeader: ViewStyle;
  scrollContent: ViewStyle;
  dateHeader: TextStyle;
  summaryCard: ViewStyle;
  cardTitle: TextStyle;
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.s,
    fontSize: theme.typography.fontSize.l,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.m,
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.s,
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
