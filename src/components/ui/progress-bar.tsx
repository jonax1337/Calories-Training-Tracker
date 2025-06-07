import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/theme-context';

interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

function ProgressBar({
  current,
  target,
  label,
  color = '#4CAF50',
  height = 12,
  showPercentage = true
}: ProgressBarProps) {
  const theme = useTheme();
  
  // Prüfen, ob der aktuelle Wert das Ziel überschreitet
  const isOverTarget = current > target;
  
  // Calculate actual percentage (not capped at 100%)
  const percentage = Math.round((current / target) * 100);
  
  // Animierter Wert für die Breite des Fortschrittsbalkens
  const widthAnim = useRef(new Animated.Value(0)).current;
  
  // Effekt, um den Balken zu animieren, wenn sich der Prozentsatz ändert
  // Balkenbreite auf maximal 100% beschränken, auch wenn der Prozentsatz höher ist
  const displayPercentage = Math.min(percentage, 100);
  
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: displayPercentage, // Für die Animation beschränken wir auf 100%
      duration: 800, // Längere Animation für einen sanfteren Effekt
      useNativeDriver: false, // Breite kann nicht mit dem Native Driver animiert werden
      easing: Easing.out(Easing.ease) // Sanfte Beschleunigung/Verzögerung
    }).start();
  }, [displayPercentage, widthAnim]);

  // Bildschirmbreite in Prozent für die Animation
  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp' // Stellt sicher, dass wir nie über 100% hinausgehen
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[
          styles.label, 
          { 
            fontFamily: theme.theme.typography.fontFamily.medium, 
            color: theme.theme.colors.text 
          }
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.values, 
          { 
            fontFamily: theme.theme.typography.fontFamily.regular, 
            color: isOverTarget ? theme.theme.colors.error : theme.theme.colors.textLight 
          }
        ]}>
          {current} / {target} {showPercentage && `(${percentage}%)`}
        </Text>
      </View>
      
      <View style={[
        styles.progressBackground, 
        { 
          height, 
          backgroundColor: theme.theme.colors.surfaceVariant,
          borderRadius: theme.theme.borderRadius.small
        }
      ]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { 
              width: widthInterpolated, // Animierte Breite
              height,
              backgroundColor: isOverTarget ? theme.theme.colors.error : color,
              borderRadius: theme.theme.borderRadius.small
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
  },
  values: {
    fontSize: 14,
  },
  progressBackground: {
    overflow: 'hidden',
  },
  progressFill: {
  },
});

export default ProgressBar;
