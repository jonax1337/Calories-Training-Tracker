import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import Svg, { Circle, G } from 'react-native-svg';
import { createCircularTimerStyles } from '../../styles/components/ui/CircularTimerStyles';

interface CircularTimerProps {
  duration: number; // in seconds
  remainingTime: number; // in seconds
  size: number;
  strokeWidth: number;
  status: 'work' | 'rest' | 'prepare' | 'completed';
  currentCycle?: number;
  totalCycles?: number;
  isPaused?: boolean; // Hinzugefügt, um den Pausenstatus zu übermitteln
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  duration,
  remainingTime,
  size,
  strokeWidth,
  status,
  currentCycle = 0,
  totalCycles = 0,
  isPaused = false,
}) => {
  const { theme } = useTheme();
  const styles = createCircularTimerStyles(theme);
  
  // Animation für den Füllstand des Kreises
  const fillAnimation = useRef(new Animated.Value(0)).current;
  // Animation für die kontinuierliche Rotation
  const rotationAnimation = useRef(new Animated.Value(0)).current;
  
  // Referenzen zu den laufenden Animationen
  const fillAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const rotationAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Speichern der aktuellen Phase für Vergleiche
  const lastPhaseRef = useRef<string>(status);

  // Berechne die Geometrie des Kreises
  const circleConfig = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;
    return { radius, circumference, center };
  }, [size, strokeWidth]);

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'work':
        return theme.colors.nutrition.protein;
      case 'rest':
        return theme.colors.nutrition.calories;
      case 'prepare':
        return theme.colors.nutrition.fat;
      case 'completed':
        return theme.colors.nutrition.carbs;
      default:
        return theme.colors.primary;
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'work':
        return 'WORK';
      case 'rest':
        return 'REST';
      case 'prepare':
        return 'READY';
      case 'completed':
        return 'DONE';
      default:
        return '';
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Startet die kontinuierliche Rotationsanimation
  const startRotationAnimation = () => {
    // Stoppe vorherige Rotation, falls vorhanden
    if (rotationAnimationRef.current) {
      rotationAnimationRef.current.stop();
    }
    
    // Setze Rotation zurück auf 0
    rotationAnimation.setValue(0);
    
    // Rotation dauert genau so lange wie der gesamte Timer
    // Eine komplette Umdrehung = komplette Timer-Duration
    const rotationDurationMs = duration * 1000; // duration in Sekunden → Millisekunden
    
    rotationAnimationRef.current = Animated.loop(
      Animated.timing(rotationAnimation, {
        toValue: 1,
        duration: rotationDurationMs, // Exakt die Timer-Duration
        easing: Easing.bezier(0.4, 0, 0.4, 1),
        useNativeDriver: false, // Wichtig: false für SVG Transformationen
      })
    );
    
    rotationAnimationRef.current.start();
  };

  // Stoppt die Rotationsanimation
  const stopRotationAnimation = () => {
    if (rotationAnimationRef.current) {
      rotationAnimationRef.current.stop();
      rotationAnimationRef.current = null;
    }
  };
  
  // Berechne den Fortschritt und aktualisiere die Animationen
  useEffect(() => {
    const phaseChanged = lastPhaseRef.current !== status;
    lastPhaseRef.current = status;
    
    // Stoppe vorherige Füllanimation
    if (fillAnimationRef.current) {
      fillAnimationRef.current.stop();
    }
    
    // Pausenstatus verarbeiten
    if (isPaused) {
      // Pausiere die Rotationsanimation, wenn der Timer pausiert ist
      if (rotationAnimationRef.current) {
        rotationAnimationRef.current.stop();
      }
      return; // Keine weiteren Animationsupdates während der Pause
    }
    
    if (status === 'completed') {
      // Bei 'completed' direkter voller Kreis
      stopRotationAnimation();
      fillAnimation.setValue(1);
    } else {
      // FÜR ALLE ANDEREN STATUS: Normale Fortschritts-Berechnung
      const currentProgress = 1 - (remainingTime / duration);
      
      if (phaseChanged) {
        fillAnimation.setValue(0); // Reset bei Phasenwechsel
        if (remainingTime < duration) {
          startRotationAnimation(); // Starte Rotation nur wenn Timer läuft
        } else {
          stopRotationAnimation(); // Stoppe Rotation wenn Timer noch nicht gestartet
        }
      }
      
      if (remainingTime > 0 && remainingTime < duration) {
        // Timer läuft - kontinuierliche Animation
        const nextProgress = 1 - ((remainingTime - 1) / duration);
        
        // Starte/führe Rotation fort, falls noch nicht aktiv
        if (!rotationAnimationRef.current) {
          startRotationAnimation();
        }
        
        // Füllanimation
        fillAnimationRef.current = Animated.timing(fillAnimation, {
          toValue: nextProgress,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        });
        
        fillAnimationRef.current.start();
      } else {
        // Timer steht still (initial oder beendet)
        fillAnimation.setValue(currentProgress);
        if (remainingTime === 0) {
          stopRotationAnimation();
        }
      }
    }
    
    return () => {
      if (fillAnimationRef.current) {
        fillAnimationRef.current.stop();
      }
    };
  }, [status, remainingTime, duration, fillAnimation, rotationAnimation, isPaused]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      stopRotationAnimation();
    };
  }, []);
  
  // Berechne die stroke-dashoffset basierend auf dem Füllwert
  const strokeDashoffset = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circleConfig.circumference, 0],
  });
  
  // Berechne die Rotation in Grad
  const rotationDegrees = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 360],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG Circle Timer */}
      <Svg width={size} height={size}>
        {/* Statischer Hintergrundkreis */}
        <G rotation="-90" origin={`${circleConfig.center}, ${circleConfig.center}`}>
          <Circle
            cx={circleConfig.center}
            cy={circleConfig.center}
            r={circleConfig.radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </G>
        
        {/* Animierter Fortschrittskreis - IMMER gerendert für stabiles Layout */}
        <AnimatedG
          rotation={rotationDegrees}
          origin={`${circleConfig.center}, ${circleConfig.center}`}
        >
          <G rotation="-90" origin={`${circleConfig.center}, ${circleConfig.center}`}>
            <AnimatedCircle
              cx={circleConfig.center}
              cy={circleConfig.center}
              r={circleConfig.radius}
              stroke={getStatusColor()}
              strokeWidth={strokeWidth}
              strokeDasharray={circleConfig.circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </G>
        </AnimatedG>
      </Svg>

      {/* Center Text - KOMPLETT FESTE DIMENSIONEN */}
      <View style={styles.textContainer}>
        {/* Status Text - FESTE BREITE UND HÖHE */}
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {/* Timer Text - IMMER GERENDERT - KEINE BEDINGUNGEN */}
        <View style={styles.timerTextContainer}>
          <Text style={styles.timerText}>
            {formatTime(remainingTime)}
          </Text>
        </View>
        
        {/* Cycles Text - IMMER GERENDERT WENN totalCycles > 0 */}
        {totalCycles > 0 && (
          <View style={styles.cyclesTextContainer}>
            <Text style={styles.cyclesText}>
              {status !== 'completed' ? `${currentCycle}/${totalCycles}` : `${totalCycles}/${totalCycles}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Animierte Komponenten
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export default CircularTimer;