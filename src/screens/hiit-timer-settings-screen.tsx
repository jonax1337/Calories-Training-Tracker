import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HIITSettings, RootStackParamList } from '../navigation';
import SliderWithInput from '../components/ui/slider-with-input';
import { createHIITTimerSettingsStyles } from '../styles/screens/hiit-timer-settings-styles';

// Navigation Types
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type HIITTimerSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'HIITTimerSettings'>;

const defaultSettings: HIITSettings = {
  workDuration: 30,
  restDuration: 15,
  prepareDuration: 5,
  cycles: 8,
};

const HIITTimerSettingsScreen: React.FC<HIITTimerSettingsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = createHIITTimerSettingsStyles(theme);
  const insets = useSafeAreaInsets();
  
  // Get settings from route params or use defaults
  const initialSettings = route.params?.settings || defaultSettings;
  const [settings, setSettings] = useState<HIITSettings>(initialSettings);

  // Handle settings input changes
  const updateSetting = (key: keyof HIITSettings, value: number) => {
    setSettings((prev: HIITSettings) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save settings and navigate to timer screen
  const startTimer = () => {
    navigation.navigate('HIITTimer', { settings });
  };

  
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <ScrollView style={styles.scrollContent}>
        <View style={[styles.settingsContainer, { paddingBottom: Math.max(theme.spacing.xxl, insets.bottom + theme.spacing.l) }]}>
          
          <SliderWithInput
            label="Arbeit"
              minValue={1}
              maxValue={180}
              middleValue={60}
              step={1}
              value={settings.workDuration}
              onValueChange={(value) => updateSetting('workDuration', value)}
              allowDecimals={false}
              unit="Sekunden"
            />
          
          <SliderWithInput
            label="Pause"
              minValue={1}
              maxValue={120}
              middleValue={60}
              step={1}
              value={settings.restDuration}
              onValueChange={(value) => updateSetting('restDuration', value)}
              allowDecimals={false}
              unit="Sekunden"
            />
          
          <SliderWithInput
            label="Vorbereitung"
              minValue={1}
              maxValue={30}
              middleValue={15}
              step={1}
              value={settings.prepareDuration}
              onValueChange={(value) => updateSetting('prepareDuration', value)}
              allowDecimals={false}
              unit="Sekunden"
            />
          
          <SliderWithInput
            label="Anzahl der Zyklen"
              minValue={1}
              middleValue={10}
              maxValue={20}
              step={1}
              value={settings.cycles}
              onValueChange={(value) => updateSetting('cycles', value)}
              allowDecimals={false}
              unit="Zyklen"
            />
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={startTimer}
          >
            <Text style={styles.actionButtonText}>
              Timer starten
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HIITTimerSettingsScreen;
