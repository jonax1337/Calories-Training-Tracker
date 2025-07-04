import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/themeTypes';

// Interface für die Styles des Feedback-Screens
export interface FeedbackStyles {
  container: object;
  scrollContent: object;
  stickyHeader: object;
  headerText: object;
  sectionTitle: object;
  sectionDescription: object;
  inputContainer: object;
  input: object;
  textArea: object;
  feedbackTypeContainer: object;
  feedbackTypeButton: object;
  feedbackTypeButtonSelected: object;
  feedbackTypeText: object;
  feedbackTypeTextSelected: object;
  submitButton: object;
  submitButtonText: object;
  successContainer: object;
  successText: object;
  errorText: object;
  contactSection: object;
  feedbackCategoryRow: object;
  feedbackCategoryText: object;
  attachmentsContainer: object;
  imageContainer: object;
  attachmentImage: object;
  removeImageButton: object;
  addImageButton: object;
  addImageButtonInner: object;
  addImageText: object;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createFeedbackStyles = (theme: Theme): FeedbackStyles => StyleSheet.create<FeedbackStyles>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  stickyHeader: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    height: 90, // Anpassbar basierend auf deinen Anforderungen
    justifyContent: 'flex-end' as const,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 1,
  },
  headerText: {
    color: 'white',
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.m,
  },
  inputContainer: {
    marginBottom: theme.spacing.m,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    height: 150,
    textAlignVertical: 'top' as const,
    marginTop: theme.spacing.xs,
  },
  feedbackTypeContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.m,
  },
  feedbackTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    aspectRatio: 1.5, // Macht den Button quadratisch
  },
  feedbackTypeButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  feedbackTypeText: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  feedbackTypeTextSelected: {
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginVertical: theme.spacing.l,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.m,
  },
  successContainer: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.m,
  },
  successText: {
    color: 'white',
    textAlign: 'center' as const,
    fontFamily: theme.typography.fontFamily.medium,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: theme.spacing.xs,
  },
  contactSection: {
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  feedbackCategoryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginVertical: theme.spacing.s,
  },
  feedbackCategoryText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginLeft: theme.spacing.s,
  },
  attachmentsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: theme.spacing.m,
  },
  imageContainer: {
    position: 'relative' as const,
    marginRight: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginRight: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  addImageButtonInner: {
    flex: 1, 
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addImageText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center' as const,
  },
});
