import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/theme-context';
import { getTodayFormatted, formatToLocalISODate } from '../../utils/date-utils';

// TypeScript Interface für die Props
interface DateNavigationHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onCalendarOpen: () => void;
  style?: object;
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
  style 
}: DateNavigationHeaderProps) {
  // Theme aus dem Kontext holen
  const { theme } = useTheme();

  // Styles mit aktuellem Theme initialisieren
  const styles = createStyles(theme);

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
        <Text style={[
          styles.dateText, 
          { 
            color: selectedDate === getTodayFormatted() ? theme.colors.primary : theme.colors.text
          }
        ]}>
          {new Date(selectedDate).toLocaleDateString('de-DE', { 
            weekday: 'long', 
            day: 'numeric',
            month: 'long', 
            year: 'numeric'
          })}
        </Text>
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

// Styles mit Theming erstellen
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dateButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
  },
  dateText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
  }
});

export default DateNavigationHeader;
