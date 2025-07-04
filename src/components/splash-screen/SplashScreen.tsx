import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useSplash } from '../../context/SplashContext';
import * as Haptics from 'expo-haptics';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const { theme } = useTheme();
  const { setSplashComplete } = useSplash();
  
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Für das Haptic Feedback
    const triggerPulseHaptic = (intensity: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(intensity);
      }
    };
    
    // Timer für Haptic Feedback bei beiden Pulsen
    // Timing genau auf die Höhepunkte der Pulsanimationen abgestimmt
    const hapticTimerFirst = setTimeout(() => {
      // Erster Puls - stärkeres Feedback
      triggerPulseHaptic(Haptics.ImpactFeedbackStyle.Medium);
    }, 950); // Nach Fade-in beim ersten Pulse-Höhepunkt
    
    const hapticTimerSecond = setTimeout(() => {
      // Zweiter Puls - etwas leichteres Feedback
      triggerPulseHaptic(Haptics.ImpactFeedbackStyle.Light);
    }, 1250); // Beim zweiten Pulse-Höhepunkt
    
    // Start the animation sequence - smoother and shorter
    Animated.sequence([
      // Elegant fade in and scale effect
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,  // Longer fade in
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic), // Smoother easing
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800, // Longer elegant scaling
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic), // Smoother easing
        }),
      ]),
      
      // More prominent pulse effect
      Animated.sequence([
        // Erstes Pulsieren (Haptic Feedback wird durch Timer ausgelöst)
        Animated.timing(logoScale, {
          toValue: 1.12, // More intense pulse
          duration: 150, // Faster pulse up
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin), // Smooth sine wave
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 150, // Faster pulse down
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin), // Smooth sine wave
        }),
        // Second pulse for more effect
        Animated.timing(logoScale, {
          toValue: 1.08, // Second smaller pulse
          duration: 120, // Faster
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 120, // Faster
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        })
      ]),
      
      // Longer hold
      Animated.delay(250),
      
      // Then fade out everything - smooth like butter
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 500, // Longer fade out
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic), // Smooth exit
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 600, // Longer bg fade
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic), // Smooth exit
        }),
      ]),
    
    ]).start(() => {
      // Update splash context to signal completion
      setSplashComplete(true);
      
      // Call the callback when animation is complete
      onAnimationComplete();
    });
    
    // Cleanup Timer
    return () => {
      clearTimeout(hapticTimerFirst);
      clearTimeout(hapticTimerSecond);
    };
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background, // Using theme background color
          opacity: backgroundOpacity
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale } // Removed rotation
            ]
          }
        ]}
      >
        <Image 
          source={require('../../../assets/splash-icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  }
});

export default SplashScreen;
