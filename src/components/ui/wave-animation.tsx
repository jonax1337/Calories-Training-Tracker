import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, cancelAnimation, withDelay } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/theme-context';

interface WaveAnimationProps {
  fillPercentage: number; // 0 to 100
  color?: string;
  text?: string;
  icon?: React.ReactNode;
}

const WaveAnimation = ({
  fillPercentage,
  color = '#2196F3',
  text,
  icon
}: WaveAnimationProps) => {
  const theme = useTheme();
  const windowWidth = Dimensions.get('window').width;
  
  // Sicherstellen, dass der Füllstand zwischen 0 und 100% liegt
  const actualFillPercentage = Math.min(Math.max(fillPercentage, 0), 100);
  
  // Animation-Werte für die Wellenposition und den Füllstand
  const waveOffset1 = useSharedValue(0);
  const waveOffset2 = useSharedValue(windowWidth / 2); // Versetzt starten
  const fillLevel = useSharedValue(100 - actualFillPercentage);
  
  // Ref to track if animations have been initialized
  const animationsInitialized = useRef(false);
  
  // Animation des Füllstands beim Update
  useEffect(() => {
    // Animation des Füllstands wird bei jeder Änderung aktualisiert
    fillLevel.value = withTiming(
      100 - actualFillPercentage, 
      { duration: 800, easing: Easing.out(Easing.cubic) }
    );
  }, [actualFillPercentage]);
  
  // Wellen-Animation starten (endlos laufend) - nur beim Mounting
  useEffect(() => {
    if (!animationsInitialized.current) {
      // Cleanup any existing animations to prevent conflicts
      cancelAnimation(waveOffset1);
      cancelAnimation(waveOffset2);
      
      // Set initial values
      waveOffset1.value = 0;
      waveOffset2.value = windowWidth / 2;
      
      // Start the first wave animation with a smooth infinite loop
      waveOffset1.value = withRepeat(
        withTiming(windowWidth, { 
          duration: 15000, // Longer duration for smoother movement
          easing: Easing.linear // Linear easing for constant speed
        }),
        -1, // infinite repeat
        false // don't reverse
      );
      
      // Start the second wave animation with different timing for variety
      waveOffset2.value = withDelay(
        100, // Small delay for more natural-looking waves
        withRepeat(
          withTiming(windowWidth, { 
            duration: 18000, // Different duration for more variation
            easing: Easing.linear // Linear easing for constant speed
          }),
          -1, // infinite repeat
          false // don't reverse
        )
      );
      
      animationsInitialized.current = true;
    }
    
    // Cleanup function
    return () => {
      cancelAnimation(waveOffset1);
      cancelAnimation(waveOffset2);
    };
  }, []);
  

  
  // Animierter Style für die erste Welle
  const wave1Style = useAnimatedStyle(() => {
    // We use modulo to keep the value within range but avoid visual jumps
    const translateX = -(waveOffset1.value % windowWidth);
    
    return {
      transform: [{ translateX }],
      // Y-Position wird durch Top gesetzt: Je niedriger der fillLevel, desto weiter oben ist die Welle
      top: `${fillLevel.value - 20}%`
    };
  });
  
  // Animierter Style für die zweite Welle
  const wave2Style = useAnimatedStyle(() => {
    // We use modulo to keep the value within range but avoid visual jumps
    const translateX = -(waveOffset2.value % windowWidth);
    
    return {
      transform: [{ translateX }],
      // Y-Position wird durch Top gesetzt: Je niedriger der fillLevel, desto weiter oben ist die Welle
      top: `${fillLevel.value - 20}%`
    };
  });
  
  // Animierter Style für die Höhe des Wassers (bleibt unverändert)
  const waterLevelStyle = useAnimatedStyle(() => {
    return {
      height: `${100 - fillLevel.value}%`
    };
  });
  
  return (
    <View style={[styles.container, { borderRadius: theme.theme.borderRadius.medium }]}>
      {/* Container für den gesamten Inhalt mit fester Höhe */}
      <View style={styles.contentContainer}>
        {/* Der Wasser-Container mit animierter Höhe */}
        <Animated.View style={[styles.waterContainer, waterLevelStyle]}>
          {/* Hintergrundfarbe für das Wasser */}
          <View style={[styles.waterBackground, { backgroundColor: `${color}0 ` }]} />
        </Animated.View>

        {/* Wellen sind nicht im waterContainer, sondern im Haupt-Container, damit ihre Position absolut gesteuert werden kann */}
        <Animated.View style={[styles.waveContainer, wave1Style]}>
          <Svg height="220" width={windowWidth * 2} style={styles.wave}>
            <Path
              d={`M0,15 
                 C${windowWidth*0.2},35 ${windowWidth*0.4},5 ${windowWidth*0.6},20 
                 C${windowWidth*0.8},35 ${windowWidth},10 ${windowWidth*1.2},25 
                 C${windowWidth*1.4},40 ${windowWidth*1.6},15 ${windowWidth*1.8},20 
                 C${windowWidth*1.9},15 ${windowWidth*2},20 ${windowWidth*2},15 
                 L${windowWidth*2},220 L0,220 Z`}
              fill={`${color}90`}
            />
          </Svg>
        </Animated.View>
        
        <Animated.View style={[styles.waveContainer, wave2Style]}>
          <Svg height="220" width={windowWidth * 2} style={styles.wave}>
            <Path
              d={`M0,25 
                 C${windowWidth*0.25},5 ${windowWidth*0.35},30 ${windowWidth*0.5},15 
                 C${windowWidth*0.6},5 ${windowWidth*0.8},30 ${windowWidth},15 
                 C${windowWidth*1.2},5 ${windowWidth*1.4},20 ${windowWidth*1.6},15 
                 C${windowWidth*1.8},10 ${windowWidth*1.9},20 ${windowWidth*2},25 
                 L${windowWidth*2},220 L0,220 Z`}
              fill={`${color}60`}
            />
          </Svg>
        </Animated.View>
        
        {/* Text overlay */}
        {(text || icon) && (
          <View style={styles.content}>
            {text && (
              <Text style={[
                styles.text, 
                { 
                  fontFamily: theme.theme.typography.fontFamily.bold,
                  color: theme.theme.colors.text,
                  textShadowColor: theme.theme.dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
                }
              ]}>
                {text}
              </Text>
            )}
            {icon}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  waterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  waterBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  waveContainer: {
    position: 'absolute',
    width: '100%',
    height: 220, // Extrem vergrößerte Höhe für deutlich mehr sichtbare Wellen
    left: 0,
    bottom: -170, // Sehr viel tiefer positioniert für viel mehr sichtbare Wellen nach unten
    zIndex: 5, // Über dem Wasserhintergrund aber unter dem Text
  },
  wave: {
    position: 'absolute',
    bottom: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    // Keine feste Farbdefinition hier, wird u00fcber den Style-Prop gesetzt
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default WaveAnimation;
