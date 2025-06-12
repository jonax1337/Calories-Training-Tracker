import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import { createProgressBarStyles } from '../../styles/components/ui/progress-bar-styles';

interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  isCheatDay?: boolean; // Neue Option für Cheat Days
}

function ProgressBar({
  current,
  target,
  label,
  color = '#4CAF50',
  height = 12,
  showPercentage = true,
  isCheatDay = false // Standardmäßig kein Cheat Day
}: ProgressBarProps) {
  const { theme } = useTheme();
  const styles = createProgressBarStyles(theme);
  
  // Prüfen, ob der aktuelle Wert das Ziel überschreitet
  // Bei Cheat Days ignorieren wir die Überschreitung
  const isOverTarget = current > target && !isCheatDay;
  
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
        <Text style={styles.label}>
          {label}
        </Text>
        <Text style={[
          styles.values,
          isOverTarget && styles.valuesError
        ]}>
          {current} / {target} {showPercentage && `(${percentage}%)`}
        </Text>
      </View>
      
      <View style={[
        styles.progressBackground, 
        { 
          height,
          borderRadius: theme.borderRadius.small
        }
      ]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { 
              width: widthInterpolated, // Animierte Breite
              height,
              backgroundColor: isOverTarget ? theme.colors.error : color,
              borderRadius: theme.borderRadius.small
            }
          ]} 
        />
      </View>
    </View>
  );
}

export default ProgressBar;
