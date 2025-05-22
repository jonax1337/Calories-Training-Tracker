import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeType } from './theme-types';
import { getThemeByType, lightTheme } from './theme-config';
import * as Font from 'expo-font';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

interface ThemeContextProps {
  theme: Theme;
  themeType: ThemeType;
  isDarkMode: boolean;
  isPinkMode: boolean;
  setTheme: (themeType: ThemeType) => void;
  isThemeLoaded: boolean;
  isFontLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: lightTheme,
  themeType: 'light',
  isDarkMode: false,
  isPinkMode: false,
  setTheme: () => {},
  isThemeLoaded: false,
  isFontLoaded: false,
});

// Storage key for theme preference
const THEME_PREFERENCE_KEY = 'theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme() as 'light' | 'dark';
  
  // State for theme and loading status
  const [themeType, setThemeType] = useState<ThemeType>('light');
  const [theme, setThemeObject] = useState<Theme>(lightTheme);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  // Load saved theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeType = await AsyncStorage.getItem(THEME_PREFERENCE_KEY) as ThemeType | null;
        
        // If there's a saved preference, use it; otherwise, use system preference
        const initialThemeType = savedThemeType || systemColorScheme || 'light';
        setThemeType(initialThemeType);
        setThemeObject(getThemeByType(initialThemeType));
        setIsThemeLoaded(true);
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to light theme if there's an error
        setThemeType('light');
        setThemeObject(lightTheme);
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
          'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
          'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
        });
        setIsFontLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Set font loaded to true anyway to prevent app from hanging
        setIsFontLoaded(true);
      }
    };

    loadFonts();
  }, []);

  // Function to change theme
  const setTheme = async (newThemeType: ThemeType) => {
    setThemeType(newThemeType);
    setThemeObject(getThemeByType(newThemeType));
    
    // Save theme preference to AsyncStorage
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newThemeType);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Context value
  const contextValue: ThemeContextProps = {
    theme,
    themeType,
    isDarkMode: themeType === 'dark',
    isPinkMode: themeType === 'pink',
    setTheme,
    isThemeLoaded,
    isFontLoaded,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for accessing the theme context
export const useTheme = () => useContext(ThemeContext);