import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/theme-context';
import { getTodayFormatted } from '../../utils/date-utils';

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
  const styles = createStyles(theme);

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

// Styles mit Theming erstellen
const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  headerText: { 
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.text
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 16 
  },
  todayButton: {
    backgroundColor: theme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center'
  },
  todayButtonText: { 
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center'
  },
  closeButtonText: { 
    fontFamily: theme.typography.fontFamily.medium,
    color: '#ffffff'
  }
});

export default CalendarModal;
