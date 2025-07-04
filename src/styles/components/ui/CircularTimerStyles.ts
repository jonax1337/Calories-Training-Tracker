import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/themeTypes';

export const createCircularTimerStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  // Exakte feste Dimensionen - keine Layout Shifts mehr
  statusTextContainer: {
    width: 100,        // Exakte Breite
    height: 35,        // Exakte Höhe
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
  },
  timerTextContainer: {
    width: 120,        // Exakte Breite für "00:00"
    height: 55,        // Exakte Höhe
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xs,
  },
  timerText: {
    fontSize: 36,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    color: theme.colors.text,
  },
  cyclesTextContainer: {
    width: 80,         // Exakte Breite für "0/0"
    height: 30,        // Exakte Höhe
    justifyContent: 'center',
    alignItems: 'center',
  },
  cyclesText: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    color: theme.colors.textLight,
  },
});