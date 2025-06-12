import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme-types';

export const createWaveAnimationStyles = (theme: Theme) => StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  iconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
});