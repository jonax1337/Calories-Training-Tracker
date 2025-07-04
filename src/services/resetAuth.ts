import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth token keys
const AUTH_TOKEN_KEY = 'auth_token';
const USER_ID_KEY = 'user_id';

// Function to reset authentication state
export const resetAuthState = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
    console.log('Auth tokens cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear auth tokens:', error);
    return false;
  }
};
