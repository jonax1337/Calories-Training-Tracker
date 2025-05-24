import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/theme-context';

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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<View>(null);

  // Berechne die Größen des Kreises einmal als Memo, damit sie sich nicht bei jedem Render ändern
  const circleConfig = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    return { radius, circumference };
  }, [size, strokeWidth]);
  
  // Calculate progress (1 -> 0)
  const progress = duration > 0 ? remainingTime / duration : 0;

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

  // Referenz zum Speichern der aktuellen Animation
  const currentAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Animate the progress continuously
  useEffect(() => {
    // Vorherige Animation stoppen, falls vorhanden
    if (currentAnimation.current) {
      currentAnimation.current.stop();
    }
    
    // Start with the current progress value
    animatedValue.setValue(1 - progress);
    
    // Animate to the next progress value smoothly (nur wenn verbleibende Zeit > 0)
    if (remainingTime > 0) {
      currentAnimation.current = Animated.timing(animatedValue, {
        toValue: 1,
        duration: remainingTime * 1000, // Convert to milliseconds
        easing: Easing.linear,
        useNativeDriver: true,
      });
      
      currentAnimation.current.start();
    }
    
    return () => {
      if (currentAnimation.current) {
        currentAnimation.current.stop();
      }
    };
  }, [remainingTime, duration, animatedValue, progress]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.circleContainer}>
        {/* Background Circle */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: theme.colors.border,
            position: 'absolute',
          }}
        />
        
        {/* Animated Progress Circle */}
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: getStatusColor(),
            position: 'absolute',
            borderLeftColor: 'transparent',
            borderBottomColor: 'transparent',
            transform: [
              { rotateZ: '-90deg' },
              {
                rotateZ: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        />
        
        {/* Second half of the progress circle */}
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderRightColor: getStatusColor(),
            borderTopColor: getStatusColor(),
            position: 'absolute',
            transform: [
              { rotateZ: '-90deg' },
              {
                rotateZ: animatedValue.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['0deg', '180deg', '180deg'],
                }),
              },
            ],
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 0.5001, 1],
              outputRange: [1, 1, 0, 0],
            }),
          }}
        />
      </View>

      {/* Center Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: getStatusColor(), fontFamily: theme.typography.fontFamily.bold }]}>
          {getStatusText()}
        </Text>
        <Text style={[styles.timerText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {formatTime(remainingTime)}
        </Text>
        {totalCycles > 0 && (
          <Text style={[styles.cyclesText, { color: theme.colors.textLight, fontFamily: theme.typography.fontFamily.medium }]}>
            {status !== 'completed' ? `${currentCycle}/${totalCycles}` : `${totalCycles}/${totalCycles}`}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cyclesText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default CircularTimer;
