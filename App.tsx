import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppNavigation from './src/navigation';
import { useEffect } from 'react';
import { configureGoogleFitForAndroid, configureHealthKitForIOS } from './src/services/health-service';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SoundWebView from './src/components/webview/sound-webview';

export default function App() {
  // Initialize health services based on platform
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Configure HealthKit for iOS
      configureHealthKitForIOS();
    } else if (Platform.OS === 'android') {
      // Configure Google Fit for Android
      configureGoogleFitForAndroid();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <AppNavigation />
        {/* WebView für Sound-Erzeugung (unsichtbar) */}
        <SoundWebView />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});
