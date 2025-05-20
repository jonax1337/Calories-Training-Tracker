import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screen imports
import HomeScreen from './screens/home-screen';
import ProfileScreen from './screens/profile-screen';
import BarcodeScannerScreen from './screens/barcode-scanner-screen';
import DailyLogScreen from './screens/daily-log-screen';
import SettingsScreen from './screens/settings-screen';
import FoodDetailScreen from './screens/food-detail-screen';
import LoginScreen from './screens/login-screen';
import RegisterScreen from './screens/register-screen';

// Auth service
import { isAuthenticated } from './services/auth-service';
import { resetAuthState } from './services/reset-auth';

// Importiere Navigationstypen
import { 
  HomeTabScreenProps, 
  ProfileTabScreenProps, 
  JournalTabScreenProps,
  AddTabScreenProps,
  SettingsTabScreenProps
} from './types/navigation-types';

// Swipe Handler for Tab Navigation
import SwipeHandler from './components/navigation/swipe-handler';

// Theme provider
import { ThemeProvider, useTheme } from './theme/theme-context';
import LoadingScreen from './components/ui/loading-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define the combined navigator param list types
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  // Main app screens
  TabNavigator: undefined;
  BarcodeScanner: { mealType?: string };
  FoodDetail: { barcode?: string; foodId?: string; mealType?: string; foodItem?: any };
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

// Tab Screen wrappers that enable swipe navigation
function HomeTabContent({ navigation, route }: HomeTabScreenProps) {
  return <SwipeHandler currentTab="Home"><HomeScreen navigation={navigation} route={route} /></SwipeHandler>;
}

function JournalTabContent({ navigation, route }: JournalTabScreenProps) {
  return <SwipeHandler currentTab="Journal"><DailyLogScreen navigation={navigation} route={route} /></SwipeHandler>;
}

function ProfileTabContent({ navigation, route }: ProfileTabScreenProps) {
  return <SwipeHandler currentTab="Profile"><ProfileScreen navigation={navigation} route={route} /></SwipeHandler>;
}

function SettingsTabContent({ navigation, route }: SettingsTabScreenProps) {
  return <SwipeHandler currentTab="Settings"><SettingsScreen navigation={navigation} route={route} /></SwipeHandler>;
}

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
              iconName = focused ? 'fast-food' : 'fast-food-outline';
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
        component={HomeTabContent} 
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalTabContent} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileTabContent} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsTabContent} 
      />
    </Tab.Navigator>
  );
}

// Auth Stack Navigator (Login & Register screens)
function AuthStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
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
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Registrieren' }}
      />
    </Stack.Navigator>
  );
}

// Main App Stack Navigator (Protected routes)
function AppStack() {
  const { theme } = useTheme();
  
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
              breakfast: 'ud83eudd95',
              lunch: 'ud83cudf5d',
              dinner: 'ud83cudf72',
              snack: 'ud83cudf6a'
            };
            
            const mealNames = {
              breakfast: 'Fru00fchstu00fcck',
              lunch: 'Mittagessen',
              dinner: 'Abendessen',
              snack: 'Snack'
            };
            
            const emoji = mealEmojis[mealType as keyof typeof mealEmojis] || '';
            const mealName = mealNames[mealType as keyof typeof mealNames] || mealType;
            
            title = `${emoji} ${mealName} hinzufu00fcgen`;
          }
          
          return { 
            title,
            headerBackTitle: 'Zuru00fcck'
          };
        }} 
      />
      <Stack.Screen 
        name="FoodDetail" 
        component={FoodDetailScreen as React.ComponentType<any>} 
        options={({ route }) => ({
          title: route.params?.foodItem ? route.params.foodItem.name : 'Nahrungsmittel-Details',
          headerBackTitle: 'Zuru00fcck'
        })}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Journal"
        component={DailyLogScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen as React.ComponentType<any>}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Main Navigation Component with Authentication Flow
function NavigationContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsLoggedIn(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Only for development: Reset auth state if needed
    // resetAuthState().then(() => console.log('Auth state reset for development'));
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isLoggedIn ? <AppStack /> : <AuthStack />;
}

// Importiere DateProvider
import { DateProvider } from './context/date-context';

// App Navigation Component
export default function AppNavigation() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DateProvider>
          <NavigationContainer>
            <NavigationContent />
          </NavigationContainer>
        </DateProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
