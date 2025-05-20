import React, { useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Tab-Reihenfolge definieren
const TAB_ORDER = ['Home', 'Journal', 'Profile', 'Settings'];

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.2; // 20% der Bildschirmbreite als Schwellenwert

type SwipeHandlerProps = {
  children: React.ReactNode;
  currentTab: string;
};

export default function SwipeHandler({ children, currentTab }: SwipeHandlerProps) {
  const navigation = useNavigation<any>();

  // Finde den Index des aktuellen Tabs
  const currentTabIndex = TAB_ORDER.indexOf(currentTab);

  // Hilfsfunktion zur Navigation zum nächsten/vorherigen Tab
  const navigateToTab = useCallback((direction: 'next' | 'prev') => {
    console.log(`[SwipeHandler] Navigate ${direction} from ${currentTab}`);
    
    if (currentTabIndex === -1) return;
    
    const targetIndex = direction === 'next' 
      ? Math.min(currentTabIndex + 1, TAB_ORDER.length - 1)
      : Math.max(currentTabIndex - 1, 0);
    
    // Überprüfen, ob wir tatsächlich zu einem anderen Tab navigieren können
    if (targetIndex !== currentTabIndex) {
      const targetTab = TAB_ORDER[targetIndex];
      console.log(`[SwipeHandler] Navigating to ${targetTab}`);
      navigation.navigate(targetTab);
    }
  }, [currentTabIndex, navigation, currentTab]);

  // Swipe-Geste konfigurieren
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      console.log(`[SwipeHandler] Swipe ended: ${event.translationX}, threshold: ${SWIPE_THRESHOLD}`);
      
      // Überprüfen, ob der Schwellenwert überschritten wurde
      if (event.translationX > SWIPE_THRESHOLD) {
        // Nach rechts swipen (vorheriger Tab)
        console.log('[SwipeHandler] Navigating to previous tab');
        runOnJS(navigateToTab)('prev');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Nach links swipen (nächster Tab)
        console.log('[SwipeHandler] Navigating to next tab');
        runOnJS(navigateToTab)('next');
      }
    })
    .activeOffsetX([-20, 20]); // Aktiviert die Geste nur bei deutlicher horizontaler Bewegung

  // Wichtig: Verhindere Ereignis-Bubbling, indem du ein View mit flex: 1 hinzufügst
  // GestureDetector benötigt diese Struktur für korrekte Funktionsweise
  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
}
