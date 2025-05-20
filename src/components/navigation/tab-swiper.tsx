import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, LogBox, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { TabParamList } from '../../navigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// GestureHandler muss früh genug initialisiert werden
if (Platform.OS !== 'web') {
  // LogBox-Warnung für GestureHandlerRootView ignorieren
  LogBox.ignoreLogs(['GestureHandlerRootView']);
}

type TabSwiperProps = {
  children: React.ReactNode;
};

// Tab-Reihenfolge definieren (muss der tatsächlichen Reihenfolge in navigation.tsx entsprechen)
const TAB_ORDER: (keyof TabParamList)[] = [
  'Home',
  'Journal',
  'Profile',
  'Settings'
];

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.2; // 20% der Bildschirmbreite als Schwellenwert

export default function TabSwiper({ children }: TabSwiperProps) {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const route = useRoute();
  const currentRouteName = route.name as keyof TabParamList;
  
  // Animierte Werte
  const translateX = useSharedValue(0);
  const isSwipingRef = useRef(false);

  // Finde den Index des aktuellen Tabs
  const currentTabIndex = TAB_ORDER.findIndex(tab => tab === currentRouteName);

  // Hilfsfunktion zur Navigation zum nu00e4chsten/vorherigen Tab
  const navigateToTab = useCallback((direction: 'next' | 'prev') => {
    if (currentTabIndex === -1) return;
    
    const targetIndex = direction === 'next' 
      ? Math.min(currentTabIndex + 1, TAB_ORDER.length - 1)
      : Math.max(currentTabIndex - 1, 0);
    
    // u00dcberpru00fcfen, ob wir tatsu00e4chlich zu einem anderen Tab navigieren ku00f6nnen
    if (targetIndex !== currentTabIndex) {
      const targetTab = TAB_ORDER[targetIndex];
      navigation.navigate(targetTab as any);
    }
  }, [currentTabIndex, navigation]);

  // Zuru00fccksetzen der Animation, wenn sich die Route u00e4ndert
  useEffect(() => {
    translateX.value = withTiming(0, { duration: 250 });
  }, [currentRouteName, translateX]);

  // Swipe-Geste konfigurieren
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isSwipingRef.current = true;
      console.log('[TabSwiper] Swipe started');
    })
    .onUpdate((event) => {
      // Horizontales Swiping begrenzen
      translateX.value = event.translationX;
      console.log(`[TabSwiper] Swipe update: ${event.translationX}`);
    })
    .onEnd((event) => {
      if (!isSwipingRef.current) return;
      
      isSwipingRef.current = false;
      console.log(`[TabSwiper] Swipe ended: ${event.translationX}, threshold: ${SWIPE_THRESHOLD}`);
      
      // u00dcberpru00fcfen, ob der Schwellenwert u00fcberschritten wurde
      if (event.translationX > SWIPE_THRESHOLD) {
        // Nach rechts swipen (vorheriger Tab)
        console.log('[TabSwiper] Navigating to previous tab');
        runOnJS(navigateToTab)('prev');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Nach links swipen (nu00e4chster Tab)
        console.log('[TabSwiper] Navigating to next tab');
        runOnJS(navigateToTab)('next');
      }
      
      // Animation zuru00fccksetzen
      translateX.value = withTiming(0, { duration: 300 });
    })
    .activeOffsetX([-10, 10]); // Aktiviert die Geste nur, wenn die Bewegung horizontal ist

  // Animierten Stil fu00fcr die Elemente erstellen
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Debugging-Ausgabe
  console.log(`[TabSwiper] Rendering for route ${currentRouteName}, index: ${currentTabIndex}`);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
