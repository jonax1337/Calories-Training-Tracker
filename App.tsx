import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppNavigation from './src/navigation';
import { useEffect, useState } from 'react';
import { configureGoogleFitForAndroid, configureHealthKitForIOS } from './src/services/health-service';
import * as NotificationsService from './src/services/notifications-service';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SoundWebView from './src/components/webview/sound-webview';
import SplashScreen from './src/components/splash-screen/splash-screen';
import { ThemeProvider } from './src/theme/theme-context';
import { SplashProvider } from './src/context/splash-context';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Handle splash screen completion
  const handleSplashComplete = () => {
    // Splash Screen ausblenden
    setIsSplashVisible(false);
  };
  
  // Initialize health services based on platform
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Configure HealthKit for iOS
      configureHealthKitForIOS();
    } else if (Platform.OS === 'android') {
      // Configure Google Fit for Android
      configureGoogleFitForAndroid();
    }
    
    // Benachrichtigungen konfigurieren
    const setupNotifications = async () => {
      try {
        // Benachrichtigungshandler konfigurieren
        NotificationsService.configureNotifications();
        
        // Prüfe, ob Wassererinnerungen aktiviert sind
        const waterSettings = await NotificationsService.loadWaterReminderSettings();
        
        if (waterSettings.enabled) {
          // Wenn aktiviert, plane Erinnerungen
          await NotificationsService.scheduleWaterReminders(waterSettings);
        }
      } catch (error) {
        console.error('Fehler beim Initialisieren der Benachrichtigungen:', error);
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SplashProvider>
          <View style={styles.container}>
            <StatusBar style="auto" />
            <AppNavigation />
            {/* WebView für Sound-Erzeugung (unsichtbar) */}
            <SoundWebView />
            {isSplashVisible && (
              <SplashScreen onAnimationComplete={handleSplashComplete} />
            )}
          </View>
        </SplashProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});
