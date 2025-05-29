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
import { createProfileStyles } from '../../styles/screens/profile-styles';

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
  maxDate = new Date(new Date().getFullYear() + 1, 0, 0),
  customButtonText = 'Ändern',
  customModalTitle = 'Datum auswählen',
}) => {
  const { theme } = useTheme();
  const styles = createProfileStyles(theme);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

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
  
  // Funktionen für den Datepicker-Modal
  const openDatePickerModal = () => {
    setTempDate(value);
    setShowDatePickerModal(true);
  };
  
  const cancelDatePickerModal = () => {
    setShowDatePickerModal(false);
    setTempDate(null);
  };
  
  const confirmDatePickerModal = () => {
    if (tempDate) {
      onValueChange(tempDate);
    }
    setShowDatePickerModal(false);
  };

  // Modal-Komponente für DateTimePicker
  const renderDatePickerModal = () => {
    if (!showDatePickerModal) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDatePickerModal}
        onRequestClose={cancelDatePickerModal} // Added onRequestClose for Android back button
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium }]}>
            <Text style={[styles.modalTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
              {customModalTitle}
            </Text>
            {/* Close button for modal */}
            <TouchableOpacity onPress={cancelDatePickerModal} style={styles.modalCloseButton}>
              <X size={24} color={theme.colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
            
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
                    border: `1px solid ${theme.colors.border}`,
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
                  borderRadius: theme.borderRadius.small,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  // Flex-Container für DateTimePicker
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }]} >
                  {/* Wrapper für den DateTimePicker mit negativem Margin zum Verschieben nach links */}
                  <View style={{
                    marginLeft: -30, // Verschiebt den Picker 15px nach links für bessere Zentrierung
                    width: '100%', // Leicht vergrößert, um Abschneidungen zu vermeiden
                  }}>
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
                        height: 200
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error + '20', borderRadius: theme.borderRadius.small }]}
                onPress={cancelDatePickerModal}
              >
                <Text style={{ color: theme.colors.error, fontFamily: theme.typography.fontFamily.medium }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary + '20', borderRadius: theme.borderRadius.small }]}
                onPress={confirmDatePickerModal}
              >
                <Text style={{ color: theme.colors.primary, fontFamily: theme.typography.fontFamily.medium }}>
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
      {/* DatePicker-Modal */}
      {renderDatePickerModal()}
      
      {/* Date Input Container */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden'
      }]}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: theme.spacing.m
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m,
          }]}>
            {label}
          </Text>
          {ageLabel && (
            <Text style={{
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              {calculateAge(value)} Jahre
            </Text>
          )}
        </View>
          
        {/* Anklickbare Datums-Anzeige */}
        <TouchableOpacity
          style={{
            width: '100%',
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onPress={openDatePickerModal}
        >
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.m,
            color: theme.colors.text
          }}>
            {value.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.primary
          }}>
            {customButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

// Styles are now imported from profile-styles.ts
