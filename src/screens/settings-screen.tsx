import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { ThemeType } from '../theme/theme-types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../services/auth-service';
import { createSettingsStyles } from '../styles/screens/settings-styles';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, themeType, setTheme } = useTheme();
  const insets = useSafeAreaInsets(); // Safe Area Insets für Notch und Navigation Bar
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createSettingsStyles(theme);

  // Handle user logout
  const handleLogout = async () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              // The app will automatically navigate to the login screen
              // because of the auth check in NavigationContent
              console.log('User logged out successfully');
            } else {
              Alert.alert('Fehler', 'Beim Abmelden ist ein Fehler aufgetreten.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Theme options
  const themeOptions: Array<{ type: ThemeType; label: string; description: string }> = [
    {
      type: 'light',
      label: 'Hell',
      description: 'Klassisches helles Theme mit blauen Akzenten',
    },
    {
      type: 'dark',
      label: 'Dunkel',
      description: 'Augenschonendes dunkles Theme mit blauen Akzenten',
    },
    {
      type: 'pink',
      label: 'Pink',
      description: 'Süßes, farbenfrohe Pink-Theme mit abgerundeten Elementen',
    },
  ];

  // Render a theme option
  const renderThemeOption = (option: typeof themeOptions[0]) => (
    <TouchableOpacity
      key={option.type}
      style={[
        styles.themeOption,
        {
          borderColor: themeType === option.type ? theme.colors.primary : theme.colors.border,
          borderWidth: themeType === option.type ? 2 : 1,
        },
      ]}
      onPress={() => setTheme(option.type)}
    >
      <View 
        style={[
          styles.themeColorPreview, 
          { 
            backgroundColor: option.type === 'light' 
              ? '#F5F7FA' 
              : option.type === 'dark' 
              ? '#121212' 
              : '#FFF5F8',
          }
        ]}
      >
        <View 
          style={[
            styles.themeColorAccent, 
            { 
              backgroundColor: option.type === 'light' 
                ? '#3498DB' 
                : option.type === 'dark' 
                ? '#3498DB' 
                : '#FF4081',
              borderRadius: option.type === 'pink' ? 10 : 4,
            }
          ]} 
        />
      </View>
      <View style={styles.themeTextContainer}>
        <Text style={styles.themeLabel}>
          {option.label}
        </Text>
        <Text style={styles.themeDescription}>
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
        {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { paddingTop: insets.top }
      ]}>
        <Text style={styles.headerText}>
          Einstellungen
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ 
          padding: theme.spacing.m,
          paddingTop: theme.spacing.m,
          paddingBottom: Math.max(theme.spacing.xs, insets.bottom) // Entweder Standard-Padding oder Safe Area
        }}
      >
      <Text style={styles.sectionTitle}>
        Theme-Einstellungen
      </Text>
      <Text style={styles.sectionDescription}>
        Wähle dein bevorzugtes App-Theme aus
      </Text>
      
      {themeOptions.map(renderThemeOption)}
      
      <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>
        Konto
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Abmelden
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: theme.spacing.m }]}>
        App-Informationen
      </Text>
      
      <Text style={styles.sectionDescription}>Diese App befindet sich in der Beta-Phase. Danke für dein Feedback! 
        <Text style={{ color: theme.colors.primary }}> Version: 0.0.1 (Beta)</Text>
      </Text>
      
      </ScrollView>
      </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert
