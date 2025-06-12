import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/theme-types';

// TypeScript Interface für Intro Styles
interface IntroStyles {
  container: ViewStyle;
  scrollContainer: ViewStyle;
  progressContainer: ViewStyle;
  progressDot: ViewStyle;
  stepContainer: ViewStyle;
  stepIcon: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  label: TextStyle;
  input: ViewStyle;
  navigationContainer: ViewStyle;
  navButton: ViewStyle;
  leftButtonContainer: ViewStyle;
  rightButtonContainer: ViewStyle;
  backButton: ViewStyle;
  nextButton: ViewStyle;
  buttonText: TextStyle;
  infoContainer: ViewStyle;
  infoText: TextStyle;
  pickerContainer: ViewStyle;
  sliderContainer: ViewStyle;
  sliderValueContainer: ViewStyle;
  sliderValue: TextStyle;
  activityOption: ViewStyle;
  activityText: ViewStyle;
  activityTitle: TextStyle;
  activityDescription: TextStyle;
  goalOption: ViewStyle;
  goalOptionsContainer: ViewStyle;
  goalText: ViewStyle;
  goalTitle: TextStyle;
  goalDescription: TextStyle;
  summaryContainer: ViewStyle;
  summaryRow: ViewStyle;
  summaryLabel: TextStyle;
  summaryValue: TextStyle;
  activityCardIconContainer: ViewStyle;
}

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createIntroStyles = (theme: Theme): IntroStyles => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 80, // Mehr Platz unten für die Navigationsbuttons
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 20,
    paddingTop: 20,
  },
  stepIcon: {
    marginBottom: 16,
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 10,
    textAlign: 'center',
    color: theme.colors.text,
  },
  description: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.textLight,
  },
  label: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    alignSelf: 'flex-start',
    marginBottom: 8,
    color: theme.colors.text,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 15,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.medium,
  },
  leftButtonContainer: {
    alignSelf: 'flex-start',
  },
  rightButtonContainer: {
    alignSelf: 'flex-end',
  },
  backButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    marginHorizontal: 10,
  },
  infoContainer: {
    width: '100%',
    padding: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: `${theme.colors.primary}15`,
  },
  infoText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: 18,
    color: theme.colors.text,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: theme.colors.card,
  },
  sliderContainer: {
    width: '100%',
    marginTop: 16,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    marginBottom: 6,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  activityText: {
    marginLeft: 10,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 2,
    color: theme.colors.text,
  },
  activityDescription: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    marginBottom: 6,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  goalOptionsContainer: {
    width: '100%',
    marginTop: 15,
  },
  goalText: {
    marginLeft: 10,
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 2,
    color: theme.colors.text,
  },
  goalDescription: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  summaryContainer: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    marginBottom: 20,
    backgroundColor: theme.colors.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  activityCardIconContainer: {
    width: 30,
    height: 30,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});