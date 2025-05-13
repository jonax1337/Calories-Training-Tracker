import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screen imports
import HomeScreen from './screens/home-screen';
import ProfileScreen from './screens/profile-screen';
import BarcodeScannerScreen from './screens/barcode-scanner-screen';
import DailyLogScreen from './screens/daily-log-screen';
import SettingsScreen from './screens/settings-screen';
import FoodDetailScreen from './screens/food-detail-screen';

// Importiere Navigationstypen
import { 
  HomeTabScreenProps, 
  ProfileTabScreenProps, 
  JournalTabScreenProps,
  AddTabScreenProps,
  SettingsTabScreenProps
} from './types/navigation-types';

// Theme provider
import { ThemeProvider, useTheme } from './theme/theme-context';
import LoadingScreen from './components/ui/loading-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the combined navigator param list types
export type RootStackParamList = {
  // Stack screens
  TabNavigator: undefined;
  BarcodeScanner: { mealType?: string };
  FoodDetail: { barcode?: string; foodId?: string; mealType?: string };
  DailyLog: { date?: string };
  Settings: undefined;
  // Tab screens (for backwards compatibility)
  Home: undefined;
  Profile: undefined;
  Journal: undefined;
};

// Define the type for our tab navigator parameters
export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Add: { mealType?: string };
  Journal: undefined;
  Settings: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom Tab Navigator
function TabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.disabled,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.spacing.xs,
          height: 60 + insets.bottom, // Add safe area insets to the height
          paddingBottom: insets.bottom, // Add padding to bottom to fill safe area
        },
        tabBarItemStyle: {
          // Position elements within the tab bar correctly, accounting for the safe area
          paddingBottom: insets.bottom > 0 ? 0 : theme.spacing.xs, // Only add padding if not handled by safe area
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Journal':
              iconName = focused ? 'journal' : 'journal-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
      />
      <Tab.Screen 
        name="Journal" 
        component={DailyLogScreen as React.ComponentType<any>} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
      />
    </Tab.Navigator>
  );
}

// Main Navigation Component with Theme Loading
function NavigationContent() {
  const { theme, isThemeLoaded, isFontLoaded } = useTheme();
  
  // Show loading screen until theme and fonts are loaded
  if (!isThemeLoaded || !isFontLoaded) {
    return <LoadingScreen message="App wird geladen..." />;
  }
  
  return (
    <Stack.Navigator 
      initialRouteName="TabNavigator"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
        },
      }}
    >
      <Stack.Screen 
        name="TabNavigator" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BarcodeScanner" 
        component={BarcodeScannerScreen as React.ComponentType<any>} 
        options={({ route }) => {
          const { mealType } = route.params || {};
          let title = 'Produkt scannen';
          
          if (mealType) {
            const mealEmojis = {
              breakfast: '🥞',
              lunch: '🍝',
              dinner: '🍲',
              snack: '🍪'
            };
            
            const mealLabels = {
              breakfast: 'Frühstück',
              lunch: 'Mittagessen',
              dinner: 'Abendessen',
              snack: 'Snack'
            };
            
            const emoji = mealEmojis[mealType as keyof typeof mealEmojis] || '';
            const label = mealLabels[mealType as keyof typeof mealLabels] || '';
            
            title = `${emoji} ${label} hinzufügen`;
          }
          
          return { 
            title,
            animation: 'slide_from_bottom'
          };
        }} 
      />
      <Stack.Screen 
        name="FoodDetail" 
        component={FoodDetailScreen} 
        options={{ title: 'Lebensmittel-Details' }} 
      />
      <Stack.Screen 
        name="DailyLog" 
        component={DailyLogScreen as React.ComponentType<any>} 
        options={{ title: 'Tagesbericht', animation: 'slide_from_right' }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Einstellungen' }} 
      />
    </Stack.Navigator>
  );
}

// App Navigation Component
export function AppNavigation() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <NavigationContent />
      </NavigationContainer>
    </ThemeProvider>
  );
}
