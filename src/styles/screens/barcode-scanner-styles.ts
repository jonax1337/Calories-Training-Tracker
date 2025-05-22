import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../theme/theme-types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Erstellt und gibt die Styles zurück, basierend auf dem aktuellen Theme
export const createBarcodeScannerStyles = (theme: Theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: theme.spacing.m 
  },
  content: { 
    flex: 1 
  },
  instructionText: { 
    fontSize: theme.typography.fontSize.m, 
    textAlign: "center", 
    marginVertical: theme.spacing.m,
    fontFamily: theme.typography.fontFamily.regular
  },
  tabContainer: { 
    flexDirection: "row", 
    marginBottom: theme.spacing.m 
  },
  tabButton: {
    flex: 1,
    padding: theme.spacing.m,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabButtonText: { 
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium
  },
  scannerContainer: { 
    alignItems: "center", 
    marginBottom: theme.spacing.l 
  },
  previewWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: 320, // Anpassung auf ein Vielfaches von 8
    overflow: "hidden",
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: "absolute",
    top: "15%",
    left: "5%",
    width: "90%",
    height: "70%",
    borderWidth: 2,
  },
  debugInfo: {
    position: "absolute",
    bottom: theme.spacing.xs,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: theme.spacing.xs,
  },
  debugText: { 
    color: "white", 
    fontSize: theme.typography.fontSize.s, 
    textAlign: "center" 
  },
  torchButton: {
    position: "absolute",
    bottom: theme.spacing.m,
    left: "50%",
    transform: [{ translateX: -theme.spacing.xxl / 2 }],
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  rescanButton: {
    marginTop: theme.spacing.m,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.medium,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: theme.spacing.l 
  },
  barcodeInput: {
    flex: 1,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.m,
    marginRight: theme.spacing.s,
  },
  submitButton: {
    height: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.m,
    justifyContent: "center",
    borderRadius: theme.borderRadius.medium,
  },
  loadingContainer: { 
    alignItems: "center", 
    marginVertical: theme.spacing.l 
  },
  errorContainer: { 
    marginVertical: theme.spacing.m, 
    padding: theme.spacing.m, 
    borderRadius: theme.borderRadius.medium 
  },
  resultsContainer: { 
    flex: 1 
  },
  resultItem: { 
    padding: theme.spacing.m, 
    marginBottom: theme.spacing.xs, 
    borderRadius: theme.borderRadius.medium 
  },
  manualEntryButton: {
    marginTop: theme.spacing.m,
    height: theme.spacing.xxl,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.medium,
  },
});
