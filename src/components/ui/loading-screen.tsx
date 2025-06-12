import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import { createLoadingScreenStyles } from '../../styles/components/ui/loading-screen-styles';

interface LoadingScreenProps {
  message?: string;
}

function LoadingScreen({ message = 'Wird geladen...' }: LoadingScreenProps) {
  const { theme } = useTheme();
  const styles = createLoadingScreenStyles(theme);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

export default LoadingScreen;
