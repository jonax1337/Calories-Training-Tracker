import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme-types';

export const createSoundWebViewStyles = (theme: Theme) => StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
});