import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateForDisplay, formatToLocalISODate } from '../../utils/date-utils';
import { useTheme } from '../../theme/theme-context';

interface DateSelectorProps {
  date: string; // ISO format date string (YYYY-MM-DD)
  onDateChange: (newDate: string) => void;
  containerStyle?: ViewStyle;
  showToday?: boolean; // Option to show a "Today" button
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  date, 
  onDateChange, 
  containerStyle, 
  showToday = true 
}) => {
  const { theme } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedDate = new Date(date);
  
  // Format today for comparison to see if current date is selected
  const today = formatToLocalISODate();
  const isToday = date === today;

  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    onDateChange(formatToLocalISODate(prevDate));
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    onDateChange(formatToLocalISODate(nextDate));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      onDateChange(formatToLocalISODate(selectedDate));
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={handlePreviousDay}
        style={[styles.arrowButton, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => setShowDatePicker(true)}
        style={[styles.dateButton, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Text style={[styles.dateText, { 
          color: theme.colors.text,
          fontFamily: theme.typography.fontFamily.medium 
        }]}>
          {formatDateForDisplay(date)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.colors.text} style={styles.calendarIcon} />
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={handleNextDay}
        style={[styles.arrowButton, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
      </TouchableOpacity>

      {showToday && (
        <TouchableOpacity
          onPress={handleToday}
          style={[styles.todayButton, { 
            backgroundColor: isToday ? theme.colors.primary : theme.colors.surfaceVariant,
            opacity: isToday ? 0.5 : 1
          }]}
          disabled={isToday}
        >
          <Text style={[styles.todayText, { 
            color: isToday ? 'white' : theme.colors.text,
            fontFamily: theme.typography.fontFamily.medium 
          }]}>
            Heute
          </Text>
        </TouchableOpacity>
      )}

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
          maximumDate={new Date(2100, 11, 31)} // Set a reasonable maximum date
          minimumDate={new Date(2000, 0, 1)}  // Set a reasonable minimum date
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerHeaderButton, { color: theme.colors.primary }]}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerHeaderButton, { color: theme.colors.primary }]}>Fertig</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDatePickerChange}
                maximumDate={new Date(2100, 11, 31)}
                minimumDate={new Date(2000, 0, 1)}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  todayButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  todayText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerHeaderButton: {
    fontSize: 16,
    padding: 8,
  },
  picker: {
    height: 200,
  },
});

export default DateSelector;
