import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, TouchableOpacity, ScrollView, Alert, Switch, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { ThemeType } from '../theme/theme-types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../services/auth-service';
import * as NotificationsService from '../services/notifications-service';
import { createSettingsStyles } from '../styles/screens/settings-styles';
import { useFocusEffect } from '@react-navigation/native';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, themeType, setTheme } = useTheme();
  const insets = useSafeAreaInsets(); // Safe Area Insets für Notch und Navigation Bar
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createSettingsStyles(theme);

  // State für Wassererinnerungen - simplifiziert
  const [isWaterReminderEnabled, setIsWaterReminderEnabled] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isScreenVisible, setIsScreenVisible] = useState(true); // Start visible
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(0);
  
  // Lade Wassererinnerungseinstellungen beim ersten Render
  useEffect(() => {
    const loadWaterSettings = async () => {
      try {
        // Lade Wassererinnerungseinstellungen (nur aktiviert/deaktiviert)
        const waterConfig = await NotificationsService.loadWaterReminderSettings();
        setIsWaterReminderEnabled(waterConfig.enabled);

        // Überprüfe Benachrichtigungsberechtigungen
        const hasPermission = await NotificationsService.checkAndRequestPermissions();
        setHasNotificationPermission(hasPermission);
      } catch (error) {
        console.error('Fehler beim Laden der Wassererinnerungseinstellungen:', error);
      }
    };

    loadWaterSettings();
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const currentTime = Date.now();
      const timeSinceLastFocus = currentTime - lastFocusTime.current;
      
      // Only trigger animations on tab navigation (quick successive focus events)
      // Stack navigation typically has longer delays between focus events
      if (!isInitialMount.current && timeSinceLastFocus < 1000) {
        // This is likely a tab navigation - hide content briefly, then show with animation
        setIsScreenVisible(false);
        const timer = setTimeout(() => {
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }, 50);
        
        lastFocusTime.current = currentTime;
        return () => {
          clearTimeout(timer);
        };
      } else {
        // First mount or stack navigation return - no animation disruption
        if (isInitialMount.current) {
          isInitialMount.current = false;
          setAnimationKey(prev => prev + 1);
        }
        lastFocusTime.current = currentTime;
      }
      
      return () => {};
    }, [])
  );

  // Aktualisiere Wassererinnerungsstatus
  const handleWaterReminderToggle = async (value: boolean) => {
    try {
      if (value && !hasNotificationPermission) {
        // Wenn Benutzer Erinnerungen aktivieren möchte, aber keine Berechtigung hat
        const hasPermission = await NotificationsService.checkAndRequestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Benachrichtigungen deaktiviert',
            'Bitte aktiviere Benachrichtigungen in den Geräteeinstellungen, um Wassererinnerungen zu erhalten.',
            [{ text: 'OK' }]
          );
          return;
        }
        setHasNotificationPermission(true);
      }

      setIsWaterReminderEnabled(value);
      await NotificationsService.toggleWaterReminders(value);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Wassererinnerungsstatus:', error);
      Alert.alert('Fehler', 'Die Einstellung konnte nicht gespeichert werden.');
    }
  };
  


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

      {isScreenVisible && (
        <>
        <Animatable.View 
          key={`theme-title-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={50}
        >
          <Text style={styles.sectionTitle}>
            Theme-Einstellungen
          </Text>
        </Animatable.View>
        <Animatable.View 
          key={`theme-description-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={100}
        >
          <Text style={styles.sectionDescription}>
            Wähle dein bevorzugtes App-Theme aus
          </Text>
        </Animatable.View>
      
        <Animatable.View 
          key={`theme-options-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={150}
        >
          {themeOptions.map(renderThemeOption)}
        </Animatable.View>
      
        <Animatable.View 
          key={`account-title-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={200}
        >
          <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>
            Konto
          </Text>
        </Animatable.View>

        <Animatable.View 
          key={`logout-button-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={250}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Abmelden
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View 
          key={`notifications-title-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={300}
        >
          <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>
            Benachrichtigungen
          </Text>
        </Animatable.View>
        <Animatable.View 
          key={`notifications-description-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={350}
        >
          <Text style={styles.sectionDescription}>
            Erhalte intelligente Erinnerungen.
          </Text>
        </Animatable.View>

        <Animatable.View 
          key={`notifications-settings-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={400}
        >
          <View style={[styles.settingCard, { marginTop: 0 }]}>
            {/* Wassererinnerungen An/Aus */}
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Wassererinnerungen</Text>
              </View>
              <Switch
                value={isWaterReminderEnabled}
                onValueChange={handleWaterReminderToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'android' ? theme.colors.surface : ''}
              />
            </View>
          </View>
        </Animatable.View>

        <Animatable.View 
          key={`app-info-title-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={450}
        >
          <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>
            App-Informationen & Feedback
          </Text>
        </Animatable.View>
      
        <Animatable.View 
          key={`app-info-description-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={500}
        >
          <Text style={[styles.sectionDescription, { marginBottom: theme.spacing.s }]}>Diese App befindet sich in der Beta-Phase. Wir freuen uns über dein Feedback!
          </Text>
        </Animatable.View>

        <Animatable.View 
          key={`feedback-link-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={550}
        >
          <Text style={[styles.sectionDescription, { marginBottom: 0 }]}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Feedback')}
            >
              <Text style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>Feedback geben</Text>
            </TouchableOpacity>
          </Text>
        </Animatable.View>
        </>
        )}
      
      </ScrollView>
      </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert