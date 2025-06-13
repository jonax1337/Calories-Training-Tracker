import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/theme-context';
import { createDatePickerStyles } from '../../styles/components/ui/date-picker-styles';

interface DatePickerProps {
  label: string;
  value: Date;
  onValueChange: (date: Date) => void;
  ageLabel?: boolean;
  minDate?: Date;
  maxDate?: Date;
  customButtonText?: string;
  customModalTitle?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onValueChange,
  ageLabel = false,
  minDate = new Date(1900, 0, 1),
  maxDate = new Date(),
  customButtonText = 'Ändern',
  customModalTitle = 'Datum auswählen',
}) => {
  const { theme } = useTheme();
  const styles = createDatePickerStyles(theme);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // Plattformspezifisches Verhalten - auf Android brauchen wir keinen Modal

  // Funktion zum Berechnen des Alters aus dem Geburtsdatum
  const calculateAge = (birthdate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  };
  
  // Funktionen für den Datepicker
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      // Auf Android öffnen wir direkt den nativen DatePicker ohne Modal
      setShowDatePicker(true);
    } else {
      // Auf iOS/Web verwenden wir unseren Custom Modal
      setTempDate(value);
      setShowDatePicker(true);
    }
  };
  
  const cancelDatePicker = () => {
    setShowDatePicker(false);
    setTempDate(null);
  };
  
  const confirmDatePicker = () => {
    if (tempDate) {
      onValueChange(tempDate);
    }
    setShowDatePicker(false);
  };
  
  // Callback für Android DatePicker
  const onAndroidDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') {
      // User canceled the picker
      return;
    }
    if (selectedDate) {
      onValueChange(selectedDate);
    }
  };

  // DatePicker Komponente - plattformspezifisch
  const renderDatePicker = () => {
    // Für Android: Nativer Dialog ohne Modal
    if (Platform.OS === 'android') {
      if (showDatePicker) {
        return (
          <DateTimePicker
            testID="datePickerAndroid"
            value={value}
            mode="date"
            display="default" // Nativer Android Date Picker
            onChange={onAndroidDateChange}
            maximumDate={maxDate}
            minimumDate={minDate}
          />
        );
      }
      return null;
    }
    
    // Für iOS und Web: Modal mit DatePicker
    if (!showDatePicker) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={cancelDatePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.headerContainer}>
              <Text style={styles.modalTitle}>
                {customModalTitle}
              </Text>
              <TouchableOpacity onPress={cancelDatePicker} style={styles.modalCloseButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={(tempDate || value).toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      setTempDate(newDate);
                    }
                  }}
                  style={{
                    width: '100%',
                    border: `1px`,
                    borderRadius: theme.borderRadius.small,
                    backgroundColor: theme.colors.background,
                    fontSize: '16px',
                    padding: '12px',
                    color: theme.colors.text,
                    outline: 'none'
                  }}
                  max={maxDate.toISOString().split('T')[0]}
                  min={minDate.toISOString().split('T')[0]}
                />
              ) : (
                <View style={[{
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.borderRadius.s,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: -theme.spacing.l
                }]} >
                  <DateTimePicker
                    testID="dateTimePickerModal"
                    value={tempDate || value}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                      }
                    }}
                    maximumDate={maxDate}
                    minimumDate={minDate}
                    themeVariant={theme.dark ? 'dark' : 'light'}
                    style={{
                      height: 150
                    }}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                onPress={cancelDatePicker}
              >
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text, fontSize: theme.typography.fontSize.m }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={confirmDatePicker}
              >
                <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: '#ffffff', fontSize: theme.typography.fontSize.m }}>
                  Speichern
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      {/* DatePicker - plattformspezifisch */}
      {renderDatePicker()}
      
      {/* Date Input Container */}
      <View style={styles.inputContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.inputLabel}>
            {label}
          </Text>
          {ageLabel && (
            <Text style={styles.ageLabel}>
              {calculateAge(value)} Jahre
            </Text>
          )}
        </View>
          
        {/* Anklickbare Datums-Anzeige */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={openDatePicker}
        >
          <Text style={styles.dateText}>
            {value.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
          <Text style={styles.changeButtonText}>
            {customButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

