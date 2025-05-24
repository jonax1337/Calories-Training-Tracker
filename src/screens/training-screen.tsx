import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createTrainingStyles } from '../styles/screens/training-styles';

// Import navigation types
import { TrainingTabScreenProps } from '../types/navigation-types';

function TrainingScreen({ navigation }: TrainingTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets for handling notches and navigation bars
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createTrainingStyles(theme);
  
  // State für Loading
  const [isLoading, setIsLoading] = useState(false);

  // Focus-Effekt: Aktualisiert den Screen, wenn er in den Fokus kommt
  useFocusEffect(
    React.useCallback(() => {
      // Hier können Daten geladen werden, wenn der Screen angezeigt wird
      return () => {
        // Cleanup bei Verlassen des Screens
      };
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {/* Header */}
      <View style={styles.stickyHeader}>
        <Text style={styles.headerText}>Training</Text>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {isLoading ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>Daten werden geladen...</Text>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Hier werden bald deine Trainingseinheiten angezeigt.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default TrainingScreen;
