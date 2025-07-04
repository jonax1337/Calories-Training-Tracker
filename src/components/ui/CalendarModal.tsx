import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { getTodayFormatted } from '../../utils/dateUtils';
import { createCalendarModalStyles } from '../../styles/components/ui/CalendarModalStyles';

// TypeScript Interface für die Props
interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

/**
 * Eine wiederverwendbare Kalendermodal-Komponente zur Datumsauswahl.
 * @param isVisible - Bestimmt, ob der Modal sichtbar ist
 * @param onClose - Callback, der beim Schließen des Modals aufgerufen wird
 * @param selectedDate - Das aktuell ausgewählte Datum im Format YYYY-MM-DD
 * @param onDateSelect - Callback, der bei Auswahl eines Datums aufgerufen wird
 */
function CalendarModal({ isVisible, onClose, selectedDate, onDateSelect }: CalendarModalProps) {
  // Theme aus dem Kontext holen
  const { theme } = useTheme();

  // Styles mit aktuellem Theme initialisieren
  const styles = createCalendarModalStyles(theme);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={styles.modalContainer}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>
              Datum auswählen
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <Calendar
            onDayPress={(day) => {
              onDateSelect(day.dateString);
              onClose();
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: theme.colors.primary }
            }}
            theme={{
              calendarBackground: theme.colors.card,
              textSectionTitleColor: theme.colors.text,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.text,
              textDisabledColor: theme.colors.border,
              monthTextColor: theme.colors.text,
              arrowColor: theme.colors.primary,
              textDayFontFamily: theme.typography.fontFamily.regular,
              textMonthFontFamily: theme.typography.fontFamily.medium,
              textDayHeaderFontFamily: theme.typography.fontFamily.medium
            }}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                onDateSelect(getTodayFormatted());
                onClose();
              }}
            >
              <Text style={styles.todayButtonText}>
                Heute
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>
                Schließen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default CalendarModal;
