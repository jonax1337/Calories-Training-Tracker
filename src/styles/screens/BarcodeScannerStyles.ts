import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../theme/themeTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    borderBottomColor: theme.colors.border,
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
    borderBottomWidth: 2,
  },
  tabButtonText: { 
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold
  },
  scannerContainer: { 
    alignItems: "center", 
    marginBottom: theme.spacing.l 
  },
  previewWrapper: {
    marginTop: theme.spacing.xs,
    width: SCREEN_WIDTH - theme.spacing.m * 2,
    height: SCREEN_HEIGHT * 0.5,
    overflow: "hidden",
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  scanOverlay: {
    position: "absolute",
    top: "10%",
    left: "5%",
    width: "90%",
    height: "70%",
    borderWidth: 2,
    borderRadius: theme.borderRadius.small,
  },
  // Einfache Blur overlays für den Bereich außerhalb des Scan-Rahmens
  blurOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "10%",
  },
  blurOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "20%",
  },
  blurOverlayLeft: {
    position: "absolute",
    top: "10%",
    left: 0,
    width: "5%",
    height: "70%",
  },
  blurOverlayRight: {
    position: "absolute",
    top: "10%",
    right: 0,
    width: "5%",
    height: "70%",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.5,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  successOverlay: {
    position: "absolute",
    top: "30%",
    left: "35%",
    width: "30%",
    height: "30%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  errorOverlay: {
    position: "absolute",
    top: "35%",
    left: "35%",
    width: "30%",
    height: "30%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.large,
    shadowColor: theme.colors.error,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  successText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: "center",
  },
  errorIcon: {
    fontSize: theme.typography.fontSize.xxxl,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: "center",
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
    borderRadius: theme.borderRadius.large,
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  rescanButtonContainer: {
    position: "absolute",
    bottom: theme.spacing.xl,
    left: "20%",
    right: "20%",
    zIndex: 1000,
  },
  rescanButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.large,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  rescanButtonText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: theme.spacing.s 
  },
  barcodeInput: {
    flex: 1,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.m,
    borderColor: theme.colors.border,
    borderWidth: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.m,
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
    borderRadius: theme.borderRadius.medium,
    borderColor: theme.colors.error,
    borderWidth: 1,
    textAlign: "center",
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.m,
  },
  resultItem: { 
    padding: theme.spacing.m, 
    marginBottom: theme.spacing.xs, 
    borderRadius: theme.borderRadius.medium 
  },
  manualEntryButton: {
    marginTop: theme.spacing.xs, // Verringerter Abstand nach oben
    height: theme.spacing.xxl,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.medium,
  },
  // Container für die Suchergebnisse
  searchResultsContainer: {
    height: 500, // Höhe reduziert für bessere Balance
  },
  // FlatList Style für die Ergebnisse
  resultsList: {
    flexGrow: 1,
    borderRadius: theme.borderRadius.medium,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});