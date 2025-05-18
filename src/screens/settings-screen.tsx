import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { ThemeType } from '../theme/theme-types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../services/auth-service';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme, themeType, setTheme } = useTheme();
  const insets = useSafeAreaInsets(); // Safe Area Insets für Notch und Navigation Bar

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
          backgroundColor: theme.colors.surface,
          borderColor: themeType === option.type ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.borderRadius.m,
          marginBottom: theme.spacing.m, // 2 Grid-Punkte (16px)
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
            borderRadius: theme.borderRadius.s,
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
        <Text 
          style={[
            styles.themeLabel, 
            { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.l,
            }
          ]}
        >
          {option.label}
        </Text>
        <Text 
          style={[
            styles.themeDescription, 
            { 
              color: theme.colors.onSurface,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
            }
          ]}
        >
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }
      ]}>
        <Text style={[styles.headerText, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
          Einstellungen
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ 
          padding: theme.spacing.m, // 2 Grid-Punkte (16px)
          paddingTop: theme.spacing.m, // 2 Grid-Punkte (16px)
          paddingBottom: Math.max(theme.spacing.m, insets.bottom) // Entweder Standard-Padding oder Safe Area
        }}
      >
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginBottom: theme.spacing.m, // 2 Grid-Punkte (16px)
          }
        ]}
      >
        Theme-Einstellungen
      </Text>
      <Text 
        style={[
          styles.sectionDescription, 
          { 
            color: theme.colors.onSurface,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.l,
          }
        ]}
      >
        Wähle dein bevorzugtes App-Theme aus
      </Text>
      
      {themeOptions.map(renderThemeOption)}
      
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l, // 3 Grid-Punkte (24px)
            marginBottom: theme.spacing.m, // 2 Grid-Punkte (16px)
          }
        ]}
      >
        App-Informationen
      </Text>
      
      <View 
        style={[
          styles.infoCard, 
          { 
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.m,
            padding: theme.spacing.m, // 2 Grid-Punkte (16px)
          }
        ]}
      >
        <Text 
          style={[
            styles.infoText, 
            { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.m,
            }
          ]}
        >
          Version: 1.0.0
        </Text>
        <Text 
          style={[
            styles.infoText, 
            { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.m,
              marginTop: theme.spacing.s,
            }
          ]}
        >
          Entwickelt mit React Native und Expo
        </Text>
      </View>

      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.m,
          }
        ]}
      >
        Konto
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.errorLight,
          padding: theme.spacing.m,
          borderRadius: theme.borderRadius.medium,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.l,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}
        onPress={handleLogout}
      >
        <Text style={{
          color: theme.colors.error,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m,
        }}>
          Abmelden
        </Text>
      </TouchableOpacity>
      
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionDescription: {
    marginBottom: 24,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  themeColorPreview: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeColorAccent: {
    width: 30,
    height: 30,
  },
  themeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  themeLabel: {
    fontWeight: 'bold',
  },
  themeDescription: {
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoText: {
    lineHeight: 24,
  },
});
