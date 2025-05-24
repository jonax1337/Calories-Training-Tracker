import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HIITSettings, RootStackParamList } from '../navigation';

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
  const insets = useSafeAreaInsets();
  
  // Get settings from route params or use defaults
  const initialSettings = route.params?.settings || defaultSettings;
  const [settings, setSettings] = useState<HIITSettings>(initialSettings);

  // Handle settings input changes
  const updateSetting = (key: keyof HIITSettings, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setSettings((prev: HIITSettings) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  // Save settings and navigate to timer screen
  const startTimer = () => {
    navigation.navigate('HIITTimer', { settings });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: theme.spacing.xs,
    },
    scrollContent: {
      flex: 1,
    },
    settingsContainer: {
      padding: theme.spacing.m,
    },
    headerText: {
      fontSize: theme.typography.fontSize.xl,
      textAlign: 'center',
      marginVertical: theme.spacing.s,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    settingLabel: {
      fontSize: theme.typography.fontSize.m,
      flex: 1,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.text,
    },
    settingInput: {
      width: 80,
      height: 45,
      textAlign: 'center',
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      fontSize: theme.typography.fontSize.m,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.medium,
    },
    actionButton: {
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      borderRadius: theme.borderRadius.medium,
      marginTop: theme.spacing.l,
      elevation: 2,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
    },
    actionButtonText: {
      fontSize: theme.typography.fontSize.m,
      textAlign: 'center',
      color: 'white',
      fontFamily: theme.typography.fontFamily.bold,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      <ScrollView style={styles.scrollContent}>
        <View style={styles.settingsContainer}>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Arbeit (Sekunden)
            </Text>
            <TextInput
              style={styles.settingInput}
              value={settings.workDuration.toString()}
              onChangeText={(text) => updateSetting('workDuration', text)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Pause (Sekunden)
            </Text>
            <TextInput
              style={styles.settingInput}
              value={settings.restDuration.toString()}
              onChangeText={(text) => updateSetting('restDuration', text)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Vorbereitung (Sekunden)
            </Text>
            <TextInput
              style={styles.settingInput}
              value={settings.prepareDuration.toString()}
              onChangeText={(text) => updateSetting('prepareDuration', text)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              Anzahl der Zyklen
            </Text>
            <TextInput
              style={styles.settingInput}
              value={settings.cycles.toString()}
              onChangeText={(text) => updateSetting('cycles', text)}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          
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
