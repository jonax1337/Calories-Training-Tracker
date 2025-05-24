import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import Svg, { Circle, G } from 'react-native-svg';

interface CircularTimerProps {
  duration: number; // in seconds
  remainingTime: number; // in seconds
  size: number;
  strokeWidth: number;
  status: 'work' | 'rest' | 'prepare' | 'completed';
  currentCycle?: number;
  totalCycles?: number;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  duration,
  remainingTime,
  size,
  strokeWidth,
  status,
  currentCycle = 0,
  totalCycles = 0,
}) => {
  const { theme } = useTheme();
  
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
        return theme.colors.primary;
      case 'rest':
        return theme.colors.success;
      case 'prepare':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.info;
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
        easing: Easing.linear,
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
    
    let targetValue = 0;
    
    if (status === 'completed') {
      // Bei 'completed' direkter voller Kreis
      targetValue = 1;
      stopRotationAnimation(); // Stoppe Rotation
      fillAnimation.setValue(targetValue);
    } else if (status === 'prepare' && remainingTime === duration) {
      // Bei 'prepare' und noch nicht gestartet
      targetValue = 0;
      stopRotationAnimation(); // Keine Rotation bei prepare
      fillAnimation.setValue(targetValue);
    } else {
      // Timer läuft - starte/führe Animationen fort
      const currentProgress = 1 - (remainingTime / duration);
      
      if (phaseChanged) {
        fillAnimation.setValue(0); // Reset bei Phasenwechsel
        startRotationAnimation(); // Starte Rotation neu
      }
      
      if (remainingTime > 0) {
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
          useNativeDriver: false, // Wichtig: false für SVG
        });
        
        fillAnimationRef.current.start();
      } else {
        // Timer beendet
        fillAnimation.setValue(1);
        stopRotationAnimation();
      }
    }
    
    return () => {
      if (fillAnimationRef.current) {
        fillAnimationRef.current.stop();
      }
    };
  }, [status, remainingTime, duration, fillAnimation, rotationAnimation]);

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

  // Bestimme, ob wir Timer-Inhalte anzeigen sollen
  const shouldShowTimerContent = status === 'completed' || status !== 'prepare' || remainingTime < duration;

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
        
        {/* Animierter Fortschrittskreis mit kontinuierlicher Rotation */}
        {shouldShowTimerContent && (
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
        )}
      </Svg>

      {/* Center Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: getStatusColor(), fontFamily: theme.typography.fontFamily.bold }]}>
          {getStatusText()}
        </Text>
        
        {shouldShowTimerContent && (
          <Text style={[styles.timerText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
            {formatTime(remainingTime)}
          </Text>
        )}
        
        {totalCycles > 0 && (
          <Text style={[styles.cyclesText, { color: theme.colors.textLight, fontFamily: theme.typography.fontFamily.medium }]}>
            {status !== 'completed' ? `${currentCycle}/${totalCycles}` : `${totalCycles}/${totalCycles}`}
          </Text>
        )}
      </View>
    </View>
  );
};

// Animierte Komponenten
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5,
  },
  cyclesText: {
    fontSize: 18,
    textAlign: 'center',
  },
});

export default CircularTimer;