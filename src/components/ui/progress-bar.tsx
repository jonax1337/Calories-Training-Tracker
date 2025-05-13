import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  // Calculate percentage (capped at 100%)
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  
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
            color: theme.theme.colors.textLight 
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
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${percentage}%`, 
              height,
              backgroundColor: color,
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
