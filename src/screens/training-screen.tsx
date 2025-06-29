import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createTrainingStyles } from '../styles/screens/training-styles';
import { Ionicons } from '@expo/vector-icons';

// Import navigation types
import { TrainingTabScreenProps } from '../types/navigation-types';
import { AlarmClock, Timer } from 'lucide-react-native';

function TrainingScreen({ navigation }: TrainingTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets for handling notches and navigation bars
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createTrainingStyles(theme);
  
  // State für Loading
  const [isLoading, setIsLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isScreenVisible, setIsScreenVisible] = useState(false); // Start hidden until first focus
  const [hasBeenFocused, setHasBeenFocused] = useState(false); // Track if screen was ever focused
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(0);

  // Focus-Effekt: Aktualisiert den Screen, wenn er in den Fokus kommt
  useFocusEffect(
    useCallback(() => {
      // Hier können Daten geladen werden, wenn der Screen angezeigt wird
      
      const currentTime = Date.now();
      const timeSinceLastFocus = currentTime - lastFocusTime.current;
      
      // Mark screen as focused at least once
      if (!hasBeenFocused) {
        setHasBeenFocused(true);
      }
      
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
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }
        lastFocusTime.current = currentTime;
      }
      
      return () => {};
    }, [hasBeenFocused])
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
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {isScreenVisible && (
          <>
            {isLoading ? (
              <Animatable.View 
                key={`loading-${animationKey}`}
                animation="fadeInUp" 
                duration={600} 
                delay={50}
                style={styles.emptyStateContainer}
              >
                <Text style={styles.emptyStateText}>Daten werden geladen...</Text>
              </Animatable.View>
            ) : (
              <Animatable.View 
                key={`empty-state-${animationKey}`}
                animation="fadeInUp" 
                duration={600} 
                delay={100}
                style={styles.emptyStateContainer}
              >
                <Text style={styles.emptyStateText}>
                  Hier werden bald deine Trainingseinheiten angezeigt.
                </Text>
                <Animatable.View
                  key={`timer-button-${animationKey}`}
                  animation="fadeInUp"
                  duration={600}
                  delay={150}
                >
                  <TouchableOpacity 
                    style={[styles.startTimerButton, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
                    onPress={() => navigation.getParent()?.navigate('HIITTimerSettings')}
                  >
                    <AlarmClock size={theme.typography.fontSize.xl} color="white" style={{ marginRight: 8 }} />
                    <Text style={[styles.startTimerButtonText, { color: 'white', fontFamily: theme.typography.fontFamily.bold }]}>
                      HIIT Timer starten
                    </Text>
                  </TouchableOpacity>
                </Animatable.View>
              </Animatable.View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default TrainingScreen;
