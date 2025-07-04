import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../../theme/theme-context';
import { getTodayFormatted, formatToLocalISODate } from '../../utils/date-utils';
import { createDateNavigationHeaderStyles } from '../../styles/components/ui/date-navigation-header-styles';

// TypeScript Interface für die Props
interface DateNavigationHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onCalendarOpen: () => void;
  style?: object;
  streakDays?: number;
}

/**
 * Eine wiederverwendbare Komponente für die Navigation zwischen Daten
 * @param selectedDate - Das aktuell ausgewählte Datum im Format YYYY-MM-DD
 * @param onDateChange - Callback, der bei Änderung des Datums aufgerufen wird
 * @param onCalendarOpen - Callback, der beim Öffnen des Kalenders aufgerufen wird
 * @param style - Optionale zusätzliche Styles für den Container
 */
function DateNavigationHeader({ 
  selectedDate, 
  onDateChange,
  onCalendarOpen,
  style,
  streakDays = 0
}: DateNavigationHeaderProps) {
  // Theme aus dem Kontext holen
  const { theme } = useTheme();

  // Styles mit aktuellem Theme initialisieren
  const styles = createDateNavigationHeaderStyles(theme);

  // Zum vorherigen Tag navigieren
  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    onDateChange(formatToLocalISODate(prevDate));
  };

  // Zum nächsten Tag navigieren
  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    onDateChange(formatToLocalISODate(nextDate));
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        onPress={goToPreviousDay} 
        hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
      >
        <ChevronLeft 
          size={theme.typography.fontSize.xxl} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onCalendarOpen} style={styles.dateButton}>
        <View style={styles.dateContainer}>
          <Text style={[
            styles.dateText,
            selectedDate === getTodayFormatted() && styles.dateTextToday
          ]}>
            {new Date(selectedDate).toLocaleDateString('de-DE', { 
              weekday: 'long', 
              day: 'numeric',
              month: 'long', 
              year: 'numeric'
            })}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={goToNextDay}
        hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
      >
        <ChevronRight size={theme.typography.fontSize.xxl} color={theme.colors.primary}/>
      </TouchableOpacity>
    </View>
  );
}

export default DateNavigationHeader;
