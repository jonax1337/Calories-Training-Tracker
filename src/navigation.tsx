import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { House, Utensils, Dumbbell, User, Settings, Apple, UserRound, BicepsFlexed } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screen imports
import HomeScreen from './screens/home-screen';
import ProfileScreen from './screens/profile-screen';
import BarcodeScannerScreen from './screens/barcode-scanner-screen';
import DailyLogScreen from './screens/daily-log-screen';
import SettingsScreen from './screens/settings-screen';
import FoodDetailScreen from './screens/food-detail-screen';
import LoginScreen from './screens/login-screen';
import RegisterScreen from './screens/register-screen';
import TrainingScreen from './screens/training-screen';
import HIITTimerScreen from './screens/hiit-timer-screen';
import HIITTimerSettingsScreen from './screens/hiit-timer-settings-screen';
import ManualFoodEntryScreen from './screens/manual-food-entry-screen';

// Types for HIIT Timer
export interface HIITSettings {
  workDuration: number;
  restDuration: number;
  prepareDuration: number;
  cycles: number;
}

// Auth service
import { isAuthenticated } from './services/auth-service';
import { resetAuthState } from './services/reset-auth';

// Theme provider
import { ThemeProvider, useTheme } from './theme/theme-context';
import LoadingScreen from './components/ui/loading-screen';

// Define the combined navigator param list types
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  // Main app screens
  TabNavigator: undefined;
  BarcodeScanner: { mealType?: string };
  FoodDetail: { barcode?: string; foodId?: string; mealType?: string; foodItem?: any; selectedDate?: string; manualEntry?: boolean; existingEntryId?: string; servingAmount?: number };
  ManualFoodEntry: { mealType?: string; selectedDate?: string };
  DailyLog: { date?: string };
  Settings: undefined;
  HIITTimer: { settings?: HIITSettings };
  HIITTimerSettings: { settings?: HIITSettings };
  // Tab screens (for backwards compatibility)
  Home: undefined;
  Profile: undefined;
  Food: undefined;
};

// Define the type for our tab navigator parameters
export type TabParamList = {
  Home: undefined;
  Profile: undefined;
  Food: undefined;
  Training: undefined;
  Settings: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const SwipeTab = createMaterialTopTabNavigator<TabParamList>();

// Custom Tab Bar Component
function CustomTabBar({ state, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [localIndex, setLocalIndex] = useState(state.index);
  
  // Sync local state with navigator state
  useEffect(() => {
    setLocalIndex(state.index);
  }, [state.index]);
  
  // Mit Lucide arbeiten wir mit Komponenten statt Namen
  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? theme.colors.primary : theme.colors.disabled;
    const strokeWidth = 1.5;
    const size = theme.typography.fontSize.xxl;
    
    switch (routeName) {
      case 'Home':
        return <House size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Food':
        return <Apple size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Training':
        return <BicepsFlexed size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Profile':
        return <UserRound size={size} color={color} strokeWidth={strokeWidth} />;
      case 'Settings':
        return <Settings size={size} color={color} strokeWidth={strokeWidth} />;
      default:
        return <House size={size} color={color} strokeWidth={strokeWidth} />;
    }
  };
  
  const tabLabels = {
    Home: 'Home',
    Food: 'Food',
    Training: 'Training',
    Profile: 'Profile',
    Settings: 'Settings',
  };
  
  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: theme.colors.card,
        borderTopColor: theme.colors.border,
        height: 70 + insets.bottom,
        paddingBottom: insets.bottom,
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = localIndex === index;
        const label = tabLabels[route.name as keyof typeof tabLabels];
        
        const onPress = () => {
          // Update local state immediately for instant feedback
          setLocalIndex(index);
          
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Use jumpTo for instant navigation without animation
            navigation.jumpTo(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={route.name}
            testID={`${route.name}-tab`}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.6}
          >
            {getTabIcon(route.name, isFocused)}
            <Text style={[
              styles.tabLabel,
              {
                color: isFocused ? theme.colors.primary : theme.colors.disabled,
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tab Navigator with Swipe Support
function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <SwipeTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        tabBarShowLabel: false,
        tabBarIndicatorStyle: { opacity: 0 },
        lazy: false, // Load all screens immediately
      }}
      tabBarPosition="bottom"
    >
      <SwipeTab.Screen name="Home" component={HomeScreen as any} options={{ lazy: false }} />
      <SwipeTab.Screen name="Food" component={DailyLogScreen as any} options={{ lazy: false }} />
      <SwipeTab.Screen name="Training" component={TrainingScreen as any} options={{ lazy: false }} />
      <SwipeTab.Screen name="Profile" component={ProfileScreen as any} options={{ lazy: false }} />
      <SwipeTab.Screen name="Settings" component={SettingsScreen as any} options={{ lazy: false }} />
    </SwipeTab.Navigator>
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
        // Standard-Zurück-Button anpassen
        headerBackTitle: 'Zurück',
        headerBackTitleStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m,
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
        options={{ title: 'Registrieren', headerBackTitle: 'Login' }}
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
        // Standard-Zurück-Button anpassen
        headerBackTitle: 'Zurück',
        headerBackTitleStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: theme.typography.fontSize.m,
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
              lunch: '🌮',
              dinner: '🍽️',
              snack: '🍪'
            };
            
            const mealLabels = {
              breakfast: 'Frühstück',
              lunch: 'Mittagessen',
              dinner: 'Abendessen',
              snack: 'Snacks'
            };
            
            const emoji = mealEmojis[mealType as keyof typeof mealEmojis] || '';
            const label = mealLabels[mealType as keyof typeof mealLabels] || '';
            
            title = `${emoji} ${label}`;
          }
          
          return { 
            title,
            animation: 'slide_from_bottom',
          };
        }} 
      />
      <Stack.Screen 
        name="FoodDetail" 
        component={FoodDetailScreen} 
        options={{
            title: 'Lebensmittel-Details',
          }}
      />
      <Stack.Screen 
        name="DailyLog" 
        component={DailyLogScreen as React.ComponentType<any>} 
        options={{
          title: 'Tagesbericht', 
          animation: 'slide_from_right',
          headerBackTitle: 'Übersicht'
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          title: 'Einstellungen',
          headerBackTitle: 'Zurück'
        }} 
      />
      <Stack.Screen 
        name="HIITTimerSettings" 
        component={HIITTimerSettingsScreen} 
        options={{
          title: 'Einstellungen',
          animation: 'slide_from_bottom',
          headerBackTitle: 'Zurück'
        }} 
      />
      <Stack.Screen 
        name="HIITTimer" 
        component={HIITTimerScreen} 
        options={{
          title: 'Timer',
          animation: 'slide_from_right',
          headerBackTitle: 'Einstellungen'
        }}
      />
      <Stack.Screen 
        name="ManualFoodEntry" 
        component={ManualFoodEntryScreen} 
        options={({ route }) => {

          return {
            title: 'Lebensmittel hinzufügen',
            animation: 'slide_from_right',
          };
        }}
      />
    </Stack.Navigator>
  );
}

// Main Navigation Component with Authentication Flow
function NavigationContent() {
  const { theme, isThemeLoaded, isFontLoaded } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  // Check authentication status on mount and periodically
  useEffect(() => {
    const checkAuth = async () => {
      // Comment out the next line when you don't want to force logout on app start
      // await resetAuthState();
      
      const authStatus = await isAuthenticated();
      setIsLoggedIn(authStatus);
    };
    
    // Initial check
    checkAuth();
    
    // Set up interval to check auth status every 2 seconds
    // This helps detect when the user has logged in via the login/register screens
    const authCheckInterval = setInterval(checkAuth, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(authCheckInterval);
  }, []);
  
  // Show loading screen until theme, fonts, and auth state are loaded
  if (!isThemeLoaded || !isFontLoaded || isLoggedIn === null) {
    return <LoadingScreen message="App wird geladen..." />;
  }
  
  // Return either Auth Stack or App Stack based on login status
  return isLoggedIn ? <AppStack /> : <AuthStack />;
}

// Importiere DateProvider
import { DateProvider } from './context/date-context';

// App Navigation Component
export default function AppNavigation() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <ThemeProvider>
          <DateProvider>
            <NavigationContent />
          </DateProvider>
        </ThemeProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    marginTop: 2,
  },
});