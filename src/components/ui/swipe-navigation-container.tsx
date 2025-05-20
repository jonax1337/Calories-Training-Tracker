import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation';

type SwipeNavigationContainerProps = {
  children: React.ReactNode;
  currentTab: keyof TabParamList;
};

/**
 * Ein Container, der Swipe-Navigation zwischen Tabs ermöglicht.
 * Wrap den Screen-Inhalt mit diesem Container, um Swipe-Gesten zu ermöglichen.
 */
export default function SwipeNavigationContainer({ 
  children,
  currentTab
}: SwipeNavigationContainerProps) {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  
  // Definiere die Reihenfolge der Tabs für die Navigation
  const tabOrder: (keyof TabParamList)[] = ['Home', 'Journal', 'Profile', 'Settings'];
  
  // Finde den aktuellen Tab-Index
  const currentIndex = tabOrder.indexOf(currentTab);

  // Funktion zum Navigieren zum nächsten Tab
  const navigateToNextTab = () => {
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1];
      // Typensichererer Aufruf der Navigate-Funktion
      switch(nextTab) {
        case 'Home':
          navigation.navigate('Home');
          break;
        case 'Journal':
          navigation.navigate('Journal');
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        case 'Settings':
          navigation.navigate('Settings');
          break;
      }
    }
  };

  // Funktion zum Navigieren zum vorherigen Tab
  const navigateToPreviousTab = () => {
    if (currentIndex > 0) {
      const prevTab = tabOrder[currentIndex - 1];
      // Typensichererer Aufruf der Navigate-Funktion
      switch(prevTab) {
        case 'Home':
          navigation.navigate('Home');
          break;
        case 'Journal':
          navigation.navigate('Journal');
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        case 'Settings':
          navigation.navigate('Settings');
          break;
      }
    }
  };

  // Horizontale Swipe-Geste
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd((event) => {
      // Minimale Swipe-Distanz für die Erkennung (50px)
      const SWIPE_THRESHOLD = 50;
      
      // Wenn nach links gewischt (negative X-Bewegung)
      if (event.translationX < -SWIPE_THRESHOLD) {
        navigateToNextTab();
      } 
      // Wenn nach rechts gewischt (positive X-Bewegung)
      else if (event.translationX > SWIPE_THRESHOLD) {
        navigateToPreviousTab();
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
