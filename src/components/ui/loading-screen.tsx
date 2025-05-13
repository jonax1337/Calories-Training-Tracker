import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/theme-context';

interface LoadingScreenProps {
  message?: string;
}

function LoadingScreen({ message = 'Wird geladen...' }: LoadingScreenProps) {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.background }
      ]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text 
        style={[
          styles.message, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium,
            marginTop: theme.spacing.m,
          }
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default LoadingScreen;
