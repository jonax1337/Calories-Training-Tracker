import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ProfileTabScreenProps } from '../types/navigation-types';
import { ActivityLevel, UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from '../services/storage-service';
import { requestHealthPermissions } from '../services/health-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ProfileScreen({ navigation }: ProfileTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets for handling notches and navigation bars
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_1',
    name: '',
    goals: {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000,
    },
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [healthPermission, setHealthPermission] = useState(false);
  
  // State für Slider-Werte
  const [weightSliderValue, setWeightSliderValue] = useState(70);
  const [heightSliderValue, setHeightSliderValue] = useState(170);
  
  // State für Geburtsdatum
  const [birthDate, setBirthDate] = useState<Date>(new Date(new Date().getFullYear() - 25, 0, 1)); // Default 25 Jahre alt
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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
  
  // Aktualisiert das Geburtsdatum im Profil
  const updateBirthDate = (date: Date) => {
    // ISO-Format: YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    const age = calculateAge(date);
    
    // Aktualisiere sowohl Geburtsdatum als auch Alter im Profil
    handleTextChange('birthDate', formattedDate);
    handleTextChange('age', age.toString());
  };

  // Load user profile and check health permissions
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const savedProfile = await getUserProfile();
        if (savedProfile) {
          setProfile(savedProfile);
          
          // Initialisiere auch die Slider-Werte und das Geburtsdatum, wenn das Profil geladen wird
          if (savedProfile.weight) setWeightSliderValue(savedProfile.weight);
          if (savedProfile.height) setHeightSliderValue(savedProfile.height);
          
          // Wenn ein Geburtsdatum existiert, setze es; andernfalls berechne es aus dem Alter (wenn vorhanden)
          if (savedProfile.birthDate) {
            // Format YYYY-MM-DD
            setBirthDate(new Date(savedProfile.birthDate));
          } else if (savedProfile.age) {
            // Setze ein ungefähres Geburtsdatum basierend auf dem vorhandenen Alter
            const approximateBirthYear = new Date().getFullYear() - savedProfile.age;
            setBirthDate(new Date(approximateBirthYear, 0, 1)); // 1. Januar des Geburtsjahres
          }
        }
        
        // Check health permissions
        const hasPermission = await requestHealthPermissions();
        setHealthPermission(hasPermission);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Handle text input changes
  const handleTextChange = (field: string, value: string) => {
    // Handle nested fields for goals
    if (field.startsWith('goals.')) {
      const goalField = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        goals: {
          ...prev.goals,
          [goalField]: value === '' ? '' : Number(value),
        },
      }));
    } else {
      // Handle top-level fields - bestimmte Felder als String behandeln
      if (field === 'name' || field === 'gender' || field === 'birthDate') {
        // Diese Felder sollten als Strings behandelt werden
        setProfile(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
        // Alle anderen Felder als Zahlen behandeln
        setProfile(prev => ({
          ...prev,
          [field]: value === '' ? '' : Number(value),
        }));
      }
    }
  };

  // Handle activity level change
  const handleActivityChange = (level: ActivityLevel) => {
    setProfile(prev => ({
      ...prev,
      activityLevel: level,
    }));
  };

  // Handle saving profile
  const handleSave = async () => {
    try {
      // Basic validation
      if (!profile.name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      
      // Geburtsdatum aufbereiten und Alter berechnen
      const formattedDate = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD Format
      const calculatedAge = calculateAge(birthDate);
      
      // Profil mit den aktuellen Werten aktualisieren
      const updatedProfile = {
        ...profile,
        birthDate: formattedDate,
        age: calculatedAge
      };
      
      await saveUserProfile(updatedProfile);
      
      Alert.alert('Success', 'Profile saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  // Request health permissions
  const handleRequestPermissions = async () => {
    try {
      const hasPermission = await requestHealthPermissions();
      setHealthPermission(hasPermission);
      if (hasPermission) {
        Alert.alert('Success', 'Health permissions granted');
      } else {
        Alert.alert('Error', 'Health permissions denied');
      }
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      Alert.alert('Error', 'Failed to request health permissions');
    }
  };

  // Render an activity level button
  const renderActivityButton = (level: ActivityLevel, label: string, description: string) => (
    <TouchableOpacity
      style={[
        styles.activityButton,
        { 
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.medium,
          borderColor: theme.colors.border,
        },
        profile.activityLevel === level && { 
          backgroundColor: theme.colors.primaryLight,
          borderColor: theme.colors.primary 
        },
      ]}
      onPress={() => handleActivityChange(level)}
    >
      <View style={styles.activityButtonContent}>
        <Text style={[
          styles.activityButtonLabel,
          { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
          profile.activityLevel === level && { color: theme.colors.primary },
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.activityButtonDescription,
          { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight },
          profile.activityLevel === level && { color: theme.colors.primary },
        ]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }
      ]}>
        <Text style={[styles.headerText, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
          Profil
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingHorizontal: 16, // 2 Grid-Punkte (16px)
          paddingBottom: 16 // 2 Grid-Punkte (16px)
        }}
      >
        <Text 
          style={[
            styles.sectionTitle, 
            { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.xl,
              marginBottom: theme.spacing.m,
            }
          ]}
        >
          Persönliche Daten
        </Text>

        <Text
          style={[
            styles.sectionDescription,
            {
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.m,
              marginBottom: theme.spacing.l,
            }
          ]}
        >
          Persönliche Daten und Fitnessprofile
        </Text>
      
      {/* Name */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Name
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.name}
          onChangeText={(value) => handleTextChange('name', value)}
          placeholder="Name"
          placeholderTextColor={theme.colors.placeholder}
        />
      </View>
      
      {/* Birth Date (statt Alter) */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.m,
        marginBottom: theme.spacing.s,
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
            Geburtsdatum
          </Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.textLight
          }}>
            {calculateAge(birthDate)} Jahre
          </Text>
        </View>
          
          {/* Plattformabhängige Datumseingabe */}
          {Platform.OS === 'web' ? (
            // Für Web: Nativer Datums-Input wie in Ihrem Beispiel
            <View style={{
              width: '100%',
            }}>
              <input
                type="date"
                value={birthDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = new Date(e.target.value);
                    setBirthDate(newDate);
                    updateBirthDate(newDate);
                  }
                }}
                style={{
                  width: '100%',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '4px',
                  backgroundColor: theme.colors.background,
                  fontSize: '16px',
                  padding: '10px',
                  color: theme.colors.text,
                  outline: 'none'
                }}
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
              />
            </View>
          ) : (
            // Direkt eingebetteter DatePicker für iOS/Android
            <View style={{
              width: '100%',
            }}>
              {/* Auf allen Plattformen den Spinner-Modus verwenden für scrollbares Auswahlen der einzelnen Werte */}
              <DateTimePicker
                testID="dateTimePicker"
                value={birthDate}
                mode="date"
                display="spinner" 
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setBirthDate(selectedDate);
                    updateBirthDate(selectedDate);
                  }
                }}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                themeVariant={theme.dark ? 'dark' : 'light'}
                style={{
                  width: '100%', 
                  backgroundColor: 'transparent',
                  height: 100,
                  alignSelf: 'center'
                }}
              />
            </View>
          )}
        </View>
      {/* Weight */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.xs,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border
      }]}>
        <View style={{
          width: '100%',        
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            marginTop: theme.spacing.xs,
            marginLeft: theme.spacing.xs
          }]}>
            Gewicht
          </Text>
        </View>
        
        {/* Weight value display */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: theme.spacing.xs,
          marginBottom: theme.spacing.xs
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.textLight
          }}>
            Kilogramm
          </Text>
          <TextInput
            style={{
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.l,
              textAlign: 'center',
              minWidth: 80,
              padding: theme.spacing.xs,
              backgroundColor: theme.colors.card,
              borderRadius: theme.borderRadius.small,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              elevation: 2,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1
            }}
            value={profile.weight?.toString() || ''}
            placeholder="70.00"
            onChangeText={(text) => {
              // Erlaube grundsätzlich alle Eingaben und bereinige später
              // Ersetze Komma durch Punkt für konsistente Dezimalzahlen
              let processedText = text.replace(',', '.');
              
              // Wir aktualisieren erst das Textfeld direkt, um keine Blockierung zu haben
              handleTextChange('weight', processedText);
              
              // Dann versuchen wir, den Wert als Zahl zu interpretieren
              const numValue = parseFloat(processedText);
              
              // Wenn es eine gültige Zahl ist, aktualisiere den Slider
              // Auch wenn es außerhalb des Bereichs ist
              if (!isNaN(numValue)) {
                if (numValue > 200) {
                  // Bei höheren Werten, setze Slider auf Maximum
                  setWeightSliderValue(200);
                } else if (numValue < 30) {
                  // Bei niedrigeren Werten, setze Slider auf Minimum
                  setWeightSliderValue(30);
                } else {
                  // Bei Werten im gültigen Bereich, setze exakten Wert
                  setWeightSliderValue(numValue);
                }
              }
            }}
            keyboardType={Platform.OS === 'ios' ? "decimal-pad" : "numeric"}
            selectTextOnFocus={true}
          />
        </View>
        
        {/* Weight slider */}
        <View style={{
          width: '100%',        
          marginBottom: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs
        }}>
          <Slider
            style={{ width: '100%', height: 30 }}
            minimumValue={30}
            maximumValue={200}
            step={0.1}
            value={Math.min(Math.max(weightSliderValue, 30), 200)}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
            onValueChange={(value: number) => {
              // Runde auf 2 Nachkommastellen für bessere Anzeige
              const roundedValue = Math.round(value * 100) / 100;
              setWeightSliderValue(roundedValue);
              
              // Wir formatieren mit 2 Nachkommastellen für bessere Lesbarkeit
              handleTextChange('weight', roundedValue.toFixed(2));
            }}
          />
        </View>
        
        {/* Slider labels */}
        <View style={{
          width: '100%',         
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.xs,
          marginBottom: theme.spacing.xs
        }}>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>30</Text>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>115</Text>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>200</Text>
        </View>
      </View>
      
      {/* BMI Indikator */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.m,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border
      }]}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: theme.spacing.s
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m,
          }}>
            Body-Mass-Index (BMI)
          </Text>
          
          {/* BMI-Wert anzeigen, wenn sowohl Gewicht als auch Gru00f6u00dfe vorhanden sind */}
          {profile.weight && profile.height ? (
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: theme.colors.primary
            }}>
              {/* BMI = Gewicht (kg) / (Gru00f6u00dfe (m))u00b2 */}
              {(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
            </Text>
          ) : (
            <Text style={{
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight,
              fontStyle: 'italic'
            }}>
              Gewicht & Größe eingeben
            </Text>
          )}
        </View>
        
        {/* BMI Farbskala */}
        <View style={{
          width: '100%',
          height: 24,
          flexDirection: 'row',
          borderRadius: theme.borderRadius.small,
          overflow: 'hidden',
          marginVertical: theme.spacing.s
        }}>
          {/* Untergewicht - Blau */}
          <View style={{
            flex: 1.85, // <18.5
            backgroundColor: '#64B5F6', // Helles Blau
          }} />
          
          {/* Normalgewicht - Gru00fcn */}
          <View style={{
            flex: 6.5, // 18.5-25
            backgroundColor: '#81C784', // Helles Gru00fcn
          }} />
          
          {/* u00dcbergewicht - Gelb/Orange */}
          <View style={{
            flex: 5, // 25-30
            backgroundColor: '#FFD54F', // Helles Gelb/Orange
          }} />
          
          {/* Adipositas - Rot */}
          <View style={{
            flex: 10, // >30
            backgroundColor: '#E57373', // Helles Rot
          }} />
        </View>
        
        {/* BMI-Marker */}
        {profile.weight && profile.height && (
          <View style={{
            position: 'absolute',
            bottom: theme.spacing.m + 12, // Mitte des Markers auf der Skala
            left: (() => {
              // BMI berechnen
              const bmi = profile.weight / Math.pow(profile.height / 100, 2);
              
              // Position in Prozent umrechnen (basierend auf einem BMI-Bereich von 15-40)
              const minBmi = 15;
              const maxBmi = 40;
              const totalWidth = 100; // Prozentuale Breite
              
              // Begrenze den BMI auf den darstellbaren Bereich
              const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi));
              
              // Prozentuale Position im Verhältnis zur Gesamtbreite
              const percentPosition = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * totalWidth;
              
              return `${percentPosition}%`;
            })(),
            width: 3,
            height: 30,
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
            transform: [{ translateX: -1.5 }], // Zentriere den Marker
          }} />
        )}
        
        {/* BMI Kategorien-Labels */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textLight,
            flex: 1.85,
            textAlign: 'left'
          }}>
            Untergewicht
          </Text>
          
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textLight,
            flex: 6.5,
            textAlign: 'center'
          }}>
            Normalgewicht
          </Text>
          
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textLight,
            flex: 5,
            textAlign: 'center'
          }}>
            Übergewicht
          </Text>
          
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textLight,
            flex: 10,
            textAlign: 'right'
          }}>
            Adipositas
          </Text>
        </View>
      </View>
      
      {/* Height */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.xs,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border
      }]}>
        <View style={{
          width: '100%',        
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            marginTop: theme.spacing.xs,
            marginLeft: theme.spacing.xs
          }]}>
            Größe
          </Text>
        </View>
        
        {/* Height value display */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: theme.spacing.xs,
          marginBottom: theme.spacing.xs
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.textLight
          }}>
            Zentimeter
          </Text>
          <TextInput
            style={{
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.l,
              textAlign: 'center',
              minWidth: 80,
              padding: theme.spacing.xs,
              backgroundColor: theme.colors.card,
              borderRadius: theme.borderRadius.small,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              elevation: 2,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1
            }}
            value={profile.height?.toString() || ''}
            placeholder="170"
            onChangeText={(text) => {
              // Erlaube grundsätzlich alle Eingaben und bereinige später
              // Ersetze Komma durch Punkt für konsistente Dezimalzahlen
              let processedText = text.replace(',', '.');
              
              // Wir aktualisieren erst das Textfeld direkt, um keine Blockierung zu haben
              handleTextChange('height', processedText);
              
              // Dann versuchen wir, den Wert als Zahl zu interpretieren
              const numValue = parseFloat(processedText);
              
              // Wenn es eine gültige Zahl ist, aktualisiere den Slider
              // Auch wenn es außerhalb des Bereichs ist
              if (!isNaN(numValue)) {
                if (numValue > 240) {
                  // Bei höheren Werten, setze Slider auf Maximum
                  setHeightSliderValue(240);
                } else if (numValue < 120) {
                  // Bei niedrigeren Werten, setze Slider auf Minimum
                  setHeightSliderValue(120);
                } else {
                  // Bei Werten im gültigen Bereich, setze exakten Wert
                  setHeightSliderValue(numValue);
                }
              }
            }}
            keyboardType={Platform.OS === 'ios' ? "decimal-pad" : "numeric"}
            selectTextOnFocus={true}
          />
        </View>
        
        {/* Height slider */}
        <View style={{
          width: '100%',        
          marginBottom: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs
        }}>
          <Slider
            style={{ width: '100%', height: 30 }}
            minimumValue={120}
            maximumValue={240}
            step={1}
            value={Math.min(Math.max(heightSliderValue, 120), 240)}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
            onValueChange={(value: number) => {
              const intValue = Math.round(value);
              setHeightSliderValue(intValue);
              handleTextChange('height', intValue.toString());
            }}
          />
        </View>
        
        {/* Slider labels */}
        <View style={{
          width: '100%',         
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.xs,
          marginBottom: theme.spacing.xs
        }}>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>120</Text>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>180</Text>
          <Text style={{
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.xs
          }}>240</Text>
        </View>
      </View>
      
      {/* Gender Selection */}
      <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.xs,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border
      }]}>
        <View style={{
          width: '100%',        
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            marginTop: theme.spacing.xs,
            marginLeft: theme.spacing.xs
          }]}>
            Geschlecht
          </Text>
        </View>
        
        {/* Plattformabhängiger Gender-Picker */}
        {Platform.OS === 'web' ? (
          // Web-Dropdown mit nativer Selektbox
          <View style={{
            width: '100%',
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.xs
          }}>
            <select
              value={profile.gender || 'male'}
              onChange={(e) => handleTextChange('gender', e.target.value)}
              style={{
                width: '100%',
                fontSize: '16px',
                padding: '10px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '4px',
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                outline: 'none'
              }}
            >
              <option value="male">Männlich</option>
              <option value="female">Weiblich</option>
              <option value="divers">Divers</option>
            </select>
          </View>
        ) : (
          // iOS/Android Spinner-Picker - direkt sichtbar und nahtlos in die Card integriert
          <View style={{
            width: '100%',
            marginVertical: theme.spacing.xs,
            // Kein Border und gleicher Hintergrund wie Parent-Card
            backgroundColor: 'transparent',
            // Keine Border mehr
            height: 120, // Höher für bessere Sichtbarkeit des Spinners
            overflow: 'hidden'
          }}>
            <Picker
              selectedValue={profile.gender || 'male'}
              onValueChange={(itemValue) => {
                // itemValue kann manchmal kein String sein, also explizit konvertieren
                const genderValue = typeof itemValue === 'string' ? itemValue : String(itemValue);
                handleTextChange('gender', genderValue);
              }}
              style={{
                width: '100%',
                color: theme.colors.text,
              }}
              itemStyle={{
                fontSize: 16,
                height: 120,
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              // Spinner-Modus für cooleren Look
              mode="dropdown"
            >
              <Picker.Item label="Männlich" value="male" />
              <Picker.Item label="Weiblich" value="female" />
              <Picker.Item label="Divers" value="divers" />
            </Picker>
          </View>
        )}
        
        {/* Description */}
        <View style={{
          width: '100%',         
          marginTop: theme.spacing.xs,
          marginBottom: theme.spacing.xs
        }}>
          <Text style={{
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs,
            textAlign: 'center'
          }}>
            Für genauere Kalorienberechnungen
          </Text>
        </View>
      </View>
      
      {/* Activity Level */}
      <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
        Aktivitätsstufe
      </Text>
      <Text style={[styles.sectionDescription, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
        Wählen Sie Ihre typische Aktivitätsstufe, um Ihre Kalorienbedarf zu berechnen
      </Text>
      <View style={styles.activityContainer}>
        {renderActivityButton(
          ActivityLevel.Sedentary,
          'Sedentär',
          'Keine oder wenig Aktivität'
        )}
        {renderActivityButton(
          ActivityLevel.LightlyActive,
          'Leicht aktiv',
          'Leichtes Training 1-3 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.ModeratelyActive,
          'Mäßig aktiv',
          'Mittlere Aktivität 3-5 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.VeryActive,
          'Sehr aktiv',
          'Harte Aktivität 6-7 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.ExtremelyActive,
          'Extrem aktiv',
          'Harte tägliche Aktivität & physischer Job'
        )}
      </View>
      
      {/* Nutritional Goals */}
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.m,
          }
        ]}
      >
        Tägliche Ziele
      </Text>
      
      <Text
        style={[
          styles.sectionDescription,
          {
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.l,
          }
        ]}
      >
        Zielwerte für deine tägliche Ernährung
      </Text>
      
      
      {/* Calories */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Kalorien
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.goals.dailyCalories?.toString() || ''}
          onChangeText={(value) => handleTextChange('goals.dailyCalories', value)}
          placeholder="Calories"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.rowInputs}>
        {/* Protein */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Protein (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyProtein?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyProtein', value)}
            placeholder="Protein"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        
        {/* Carbs */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Kohlenhydrate (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyCarbs?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyCarbs', value)}
            placeholder="Carbs"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        
        {/* Fat */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Fett (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyFat?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyFat', value)}
            placeholder="Fat"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Water */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Wasser (ml)
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.goals.dailyWater?.toString() || ''}
          onChangeText={(value) => handleTextChange('goals.dailyWater', value)}
          placeholder="Daily water intake"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
      </View>
      
      {/* Health Integration Section */}
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.m,
          }
        ]}
      >
        Gesundheitsintegrierung
      </Text>
      
      <Text
        style={[
          styles.sectionDescription,
          {
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.l,
          }
        ]}
      >
        Verbindung mit deinen Gesundheitsdaten
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.connectButton, 
          { 
            backgroundColor: healthPermission ? theme.colors.success : theme.colors.info,
            borderRadius: theme.borderRadius.medium,
            padding: 16, // 2 Grid-Punkte (16px)
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 8, // 1 Grid-Punkt (8px)
          }
        ]}
        onPress={handleRequestPermissions}
      >
        <Text style={[styles.connectButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white' }]}>
          {healthPermission ? 'Gesundheitsdaten zugeordnet ✓' : 'Gesundheitsdaten zugeordnet'}
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.permissionInfo, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
        Dies wird erlauben, dass die App auf Ihre Gesundheitsdaten zugreift, wie z.B. Schritte, Herzfrequenz und Aktivität.
      </Text>
      
      {/* Save Button */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          { 
            backgroundColor: theme.colors.primary, 
            borderRadius: theme.borderRadius.medium,
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 40
          },
          isLoading && { backgroundColor: theme.colors.disabled }
        ]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={[styles.saveButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white', fontSize: 16 }]}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24, // 3 Grid-Punkte (24px)
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  inputContainer: {
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8, // 1 Grid-Punkt (8px)
    padding: 16, // 2 Grid-Punkte (16px)
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  thirdInput: {
    width: '31%',
  },
  activityContainer: {
    marginBottom: 16,
  },
  activityButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  selectedActivityButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  activityButtonContent: {
    padding: 12,
  },
  activityButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedActivityText: {
    color: 'white',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionGrantedButton: {
    backgroundColor: '#4CAF50',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
  },
  connectButton: {
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
  },
  permissionInfo: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default ProfileScreen;
