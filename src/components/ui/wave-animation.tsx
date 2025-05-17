import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
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
  const waveOffset2 = useSharedValue(0);
  const fillLevel = useSharedValue(100 - actualFillPercentage);
  
  // Wellen-Animation starten (endlos laufend)
  useEffect(() => {
    // Animation der ersten Welle
    waveOffset1.value = 0;
    waveOffset1.value = withRepeat(
      withTiming(windowWidth, { 
        duration: 4000, 
        easing: Easing.inOut(Easing.ease)
      }),
      -1, // unendlich wiederholen
      false // nicht umkehren
    );
    
    // Animation der zweiten Welle (leicht versetzt)
    waveOffset2.value = windowWidth / 2;
    waveOffset2.value = withRepeat(
      withTiming(windowWidth * 1.5, { 
        duration: 5000, 
        easing: Easing.inOut(Easing.ease)
      }),
      -1, // unendlich wiederholen
      false // nicht umkehren
    );
    
    // Animation des Füllstands beim Update
    fillLevel.value = withTiming(
      100 - actualFillPercentage, 
      { duration: 800, easing: Easing.out(Easing.cubic) }
    );
  }, [actualFillPercentage, windowWidth]);
  
  // Animierter Style für die erste Welle
  const wave1Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -waveOffset1.value % windowWidth }]
    };
  });
  
  // Animierter Style für die zweite Welle
  const wave2Style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -waveOffset2.value % windowWidth }]
    };
  });
  
  // Animierter Style für die Höhe des Wassers
  const waterLevelStyle = useAnimatedStyle(() => {
    return {
      height: `${100 - fillLevel.value}%`
    };
  });
  
  return (
    <View style={[styles.container, { borderRadius: theme.theme.borderRadius.medium }]}>
      {/* Der Wasser-Container mit animierter Höhe */}
      <Animated.View style={[styles.waterContainer, waterLevelStyle]}>
        {/* Hintergrundfarbe für das Wasser */}
        <View style={[styles.waterBackground, { backgroundColor: `${color}40` }]} />

        {/* Wellen-Container der sich über dem festen Wasserhintergrund bewegt */}
        <View style={styles.wavesWrapper}>
          {/* Erste animierte Welle */}
          <Animated.View style={[styles.waveContainer, wave1Style]}>
            <Svg height="50" width={windowWidth * 2} style={styles.wave}>
              <Path
                d={`M0,10 
                   C${windowWidth/4},30 ${windowWidth/2},0 ${windowWidth},10 
                   C${windowWidth + windowWidth/4},25 ${windowWidth + windowWidth/2},5 ${windowWidth*2},10 
                   L${windowWidth*2},50 L0,50 Z`}
                fill={`${color}90`}
              />
            </Svg>
          </Animated.View>
          
          {/* Zweite animierte Welle (mit versetzter Animation) */}
          <Animated.View style={[styles.waveContainer, wave2Style]}>
            <Svg height="50" width={windowWidth * 2} style={styles.wave}>
              <Path
                d={`M0,15 
                   C${windowWidth/4},0 ${windowWidth/2},20 ${windowWidth},15 
                   C${windowWidth + windowWidth/4},5 ${windowWidth + windowWidth/2},15 ${windowWidth*2},10 
                   L${windowWidth*2},50 L0,50 Z`}
                fill={`${color}60`}
              />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
      
      {/* Text overlay */}
      {(text || icon) && (
        <View style={styles.content}>
          {text && (
            <Text style={[styles.text, { fontFamily: theme.theme.typography.fontFamily.bold }]}>
              {text}
            </Text>
          )}
          {icon}
        </View>
      )}
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
  waterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    overflow: 'hidden',
  },
  waterBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wavesWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,  // Wichtig: Die Wellen erstrecken sich über den gesamten Container
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    bottom: -5,  // Leicht nach unten versetzt, um Lücken zu vermeiden
    left: 0,
    width: '100%',
    height: 50,
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
    color: '#333',
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default WaveAnimation;
