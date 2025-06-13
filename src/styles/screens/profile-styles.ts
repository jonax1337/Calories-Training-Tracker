import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface fu00fcr Styles
interface ProfileStyles {
  container: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  datePickerContainer: ViewStyle;
  modalButtons: ViewStyle;
  modalButton: ViewStyle;
  stickyHeader: ViewStyle;
  headerText: TextStyle;
   scrollContent: ViewStyle;
  sectionTitle: TextStyle;
  sectionDescription: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  textInput: TextStyle;
  rowInputs: ViewStyle;
  halfInput: ViewStyle;
  thirdInput: ViewStyle;
  activityContainer: ViewStyle;
  activityButton: ViewStyle;
  selectedActivityButton: ViewStyle;
  activityButtonContent: ViewStyle;
  activityButtonLabel: TextStyle;
  activityButtonDescription: TextStyle;
  selectedActivityText: TextStyle;
  permissionButton: ViewStyle;
  permissionGrantedButton: ViewStyle;
  permissionButtonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  connectButton: ViewStyle;
  connectButtonText: TextStyle;
  permissionInfo: TextStyle;
  sliderContainer: ViewStyle;
  sliderLabelContainer: ViewStyle;
  sliderValueText: TextStyle;
  sliderLabelText: TextStyle;
  sliderValueContainer: ViewStyle;
  sliderLabelsContainer: ViewStyle;
  modalCloseButton: ViewStyle;
}

// Erstellt und gibt die Styles zuru00fcck, basierend auf dem aktuellen Theme
export const createProfileStyles = (theme: Theme): ProfileStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.l,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  datePickerContainer: {
    width: '100%',
    marginBottom: theme.spacing.m,
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
  headerText: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    paddingVertical: theme.spacing.s,
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    color: theme.colors.textLight,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.s,
    marginBottom: theme.spacing.l,
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.m,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  thirdInput: {
    width: '31%',
  },
  activityContainer: {
    marginBottom: theme.spacing.m,
  },
  activityButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  selectedActivityButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activityButtonContent: {
    padding: theme.spacing.s,
  },
  activityButtonLabel: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  activityButtonDescription: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  selectedActivityText: {
    color: 'white',
  },
  permissionButton: {
    backgroundColor: theme.colors.info,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  permissionGrantedButton: {
    backgroundColor: theme.colors.success,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.xxl,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: 'white',
  },
  connectButton: {
    marginVertical: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    alignItems: 'center',
    borderRadius: theme.borderRadius.medium,
  },
  connectButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: 'white',
  },
  permissionInfo: {
    fontSize: theme.typography.fontSize.s,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.m,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sliderValueText: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  sliderLabelText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  sliderValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
  },
  sliderLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  modalCloseButton: {
    position: 'absolute',
    top: theme.spacing.m,
    right: theme.spacing.m,
    zIndex: 1,
  },
});
