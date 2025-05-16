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
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [tempBirthDate, setTempBirthDate] = useState<Date | null>(null);
  
  // State für ausgeklapptes Ziel-Menü und ausgewähltes Ziel
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null); // null = empfohlenes Ziel
  
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
    setTempBirthDate(birthDate);
    setShowDatePickerModal(true);
  };
  
  const cancelDatePickerModal = () => {
    setShowDatePickerModal(false);
    setTempBirthDate(null);
  };
  
  const confirmDatePickerModal = () => {
    if (tempBirthDate) {
      setBirthDate(tempBirthDate);
      updateBirthDate(tempBirthDate);
    }
    setShowDatePickerModal(false);
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
  
  // Berechne und setze Ernährungsempfehlungen wenn alle benötigten Daten vorhanden sind
  useEffect(() => {
    // Nur berechnen wenn alle nötigen Daten vorhanden sind
    if (profile.weight && profile.height && profile.gender && profile.activityLevel) {
      // BMI berechnen
      const bmi = profile.weight / Math.pow(profile.height / 100, 2);
      
      // Basis-Kalorienverbrauch mit Harris-Benedict-Formel berechnen
      let bmr = 0;
      if (profile.gender === 'male') {
        // Männer: BMR = 66.5 + (13.75 * kg) + (5.003 * cm) - (6.75 * Alter)
        bmr = 66.5 + (13.75 * profile.weight) + (5.003 * profile.height) - (6.75 * (profile.age || 30));
      } else {
        // Frauen: BMR = 655.1 + (9.563 * kg) + (1.850 * cm) - (4.676 * Alter)
        bmr = 655.1 + (9.563 * profile.weight) + (1.850 * profile.height) - (4.676 * (profile.age || 30));
      }
      
      // Multiplikator basierend auf Aktivitätsstufe
      let activityMultiplier = 1.2; // Sedentär
      switch(profile.activityLevel) {
        case ActivityLevel.Sedentary: activityMultiplier = 1.2; break;
        case ActivityLevel.LightlyActive: activityMultiplier = 1.375; break;
        case ActivityLevel.ModeratelyActive: activityMultiplier = 1.55; break;
        case ActivityLevel.VeryActive: activityMultiplier = 1.725; break;
        case ActivityLevel.ExtremelyActive: activityMultiplier = 1.9; break;
      }
      
      // Täglicher Kalorienbedarf zum Gewicht halten
      const maintenanceCalories = Math.round(bmr * activityMultiplier);
      
      // Empfehlung basierend auf BMI und Aktivitätsstufe
      let dailyCalories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      
      if (bmi < 18.5) {
        // Untergewicht - Zunehmen
        dailyCalories = maintenanceCalories + 300;
        protein = Math.round(profile.weight * 1.6); // Mehr Protein für Muskelaufbau
        carbs = Math.round((dailyCalories * 0.50) / 4); // 50% Kohlenhydrate
        fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
      } else if (bmi < 25) {
        // Normalgewicht - Halten
        dailyCalories = maintenanceCalories;
        protein = Math.round(profile.weight * 1.4);
        carbs = Math.round((dailyCalories * 0.45) / 4); // 45% Kohlenhydrate
        fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
      } else if (bmi < 30) {
        // Übergewicht - Leicht reduzieren
        dailyCalories = maintenanceCalories - 300;
        protein = Math.round(profile.weight * 1.8); // Mehr Protein zur Sättigung
        carbs = Math.round((dailyCalories * 0.35) / 4); // 35% Kohlenhydrate
        fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
      } else {
        // Adipositas - Stärker reduzieren
        dailyCalories = maintenanceCalories - 500;
        protein = Math.round(profile.weight * 2.0); // Deutlich mehr Protein
        carbs = Math.round((dailyCalories * 0.30) / 4); // 30% Kohlenhydrate
        fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
      }
      
      // Aktualisiere das Profil (mache eine Kopie um sicherzustellen, dass wir kein direktes setState im Rendering haben)
      const updatedGoals = {
        ...profile.goals,
        dailyCalories: dailyCalories,
        dailyProtein: protein,
        dailyCarbs: carbs,
        dailyFat: fat,
        dailyWater: 2500 // Standardempfehlung
      };
      
      // Wir setzen das gesamte Profil auf einmal, um Rendering-Schleifen zu vermeiden
      setProfile(prevProfile => ({
        ...prevProfile,
        goals: updatedGoals
      }));
    }
  }, [profile.weight, profile.height, profile.gender, profile.activityLevel, profile.age]);

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

  // Modal-Komponente für DateTimePicker
  const renderDatePickerModal = () => {
    if (!showDatePickerModal) return null;
    
    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <View style={{
          width: '90%',
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.medium,
          padding: theme.spacing.m,
          alignItems: 'center',
          elevation: 5,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.l,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
            textAlign: 'center'
          }}>
            Geburtsdatum auswählen
          </Text>
          
          {/* DatePicker */}
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={(tempBirthDate || birthDate).toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  const newDate = new Date(e.target.value);
                  setTempBirthDate(newDate);
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
                outline: 'none',
                marginBottom: theme.spacing.m
              }}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
            />
          ) : (
            <DateTimePicker
              testID="dateTimePickerModal"
              value={tempBirthDate || birthDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempBirthDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              themeVariant={theme.dark ? 'dark' : 'light'}
              style={{
                width: '100%',
                height: 200,
                marginBottom: theme.spacing.m
              }}
            />
          )}
          
          {/* Buttons */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: theme.spacing.m,
                backgroundColor: theme.colors.card,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.small,
                marginRight: theme.spacing.s,
                alignItems: 'center'
              }}
              onPress={cancelDatePickerModal}
            >
              <Text style={{
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.m,
                color: theme.colors.text
              }}>
                Abbrechen
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                padding: theme.spacing.m,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.small,
                alignItems: 'center'
              }}
              onPress={confirmDatePickerModal}
            >
              <Text style={{
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.m,
                color: 'white'
              }}>
                Bestätigen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* DatePicker-Modal */}
      {renderDatePickerModal()}
      
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
              {birthDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.medium,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.primary
            }}>
              Ändern
            </Text>
          </TouchableOpacity>
        </View>
      {/* Weight */}
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
          width: '100%',
          marginBottom: theme.spacing.s      
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m
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
          marginBottom: theme.spacing.s
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
          marginBottom: theme.spacing.s
        }}>
          <Slider
            style={{ width: '100%', height: 40 }}
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
          marginBottom: theme.spacing.s
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
      
      {/* Height */}
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
          width: '100%',
          marginBottom: theme.spacing.s
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m
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
          marginBottom: theme.spacing.s
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
          marginBottom: theme.spacing.s
        }}>
          <Slider
            style={{ width: '100%', height: 40 }}
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
          marginBottom: theme.spacing.s
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
        
        {/* BMI-Container mit relativem Positionierungssystem */}
        <View style={{
          width: '100%',
          height: 40, // Mehr Platz für den Indikator und die Skala
          marginVertical: theme.spacing.m,
          position: 'relative' // Wichtig für absolute Positionierung des Markers
        }}>
          {/* BMI Farbskala mit Verlauf */}
          <View style={{
            position: 'absolute',
            top: 10, // Marker hat 28px Höhe, positioniere die Skala entsprechend
            left: 0,
            right: 0,
            height: 20,
            borderRadius: theme.borderRadius.small,
            overflow: 'hidden'
          }}>
            {/* Linearer Farbverlauf aus CSS für Web */}
            {Platform.OS === 'web' ? (
              <div 
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(to right, #2196F3 0%, #42A5F5 14%, #4CAF50 15%, #8BC34A 39%, #FFEB3B 40%, #FFC107 50%, #FF9800 70%, #F44336 100%)',
                  borderRadius: theme.borderRadius.small + 'px',
                }}
              />
            ) : (
              // Für react-native: Vereinfachter Verlauf mit mehreren Blöcken
              <View style={{flexDirection: 'row', height: '100%', width: '100%'}}>
                {/* Mehrere kleine Blöcke erzeugen einen Verlaufseffekt - von Untergewicht bis Adipositas */}
                {/* Blau - Untergewicht (<18,5) */}
                <View style={{flex: 1.5, backgroundColor: '#2196F3'}} />
                <View style={{flex: 1, backgroundColor: '#42A5F5'}} />
                {/* Grün - Normalgewicht (18,5-24,9) */}
                <View style={{flex: 1.4, backgroundColor: '#4CAF50'}} />
                <View style={{flex: 1.5, backgroundColor: '#8BC34A'}} />
                {/* Gelb - Grenzbereich (exakt bei 25) */}
                <View style={{flex: 0.2, backgroundColor: '#E4E436'}} />
                {/* Orange/Gelb - Übergewicht (25,1-30) */}
                <View style={{flex: 1.3, backgroundColor: '#FFEB3B'}} />
                <View style={{flex: 1.3, backgroundColor: '#FFC107'}} />
                <View style={{flex: 1.4, backgroundColor: '#FF9800'}} />
                {/* Rot - Adipositas (>30) */}
                <View style={{flex: 1, backgroundColor: '#FF5722'}} />
                <View style={{flex: 1, backgroundColor: '#F44336'}} />
              </View>
            )}
          </View>

          {/* BMI-Kategorie-Marker */}
          <View style={{
            position: 'absolute',
            top: 10, // Align mit der Skala
            left: 0,
            right: 0,
            height: 6
          }}>
            {/* Markierungen der wichtigen BMI-Grenzen */}
            <View style={{
              position: 'absolute',
              left: '14%', // Ungefähr BMI 18.5 (Untergewicht/Normal)
              height: 6,
              width: 2,
              backgroundColor: 'white',
              top: 0
            }} />
            
            <View style={{
              position: 'absolute',
              left: '40%', // Ungefähr BMI 25 (Normal/Übergewicht)
              height: 6,
              width: 2,
              backgroundColor: 'white',
              top: 0
            }} />
            
            <View style={{
              position: 'absolute',
              left: '60%', // Ungefähr BMI 30 (Übergewicht/Adipositas)
              height: 6,
              width: 2,
              backgroundColor: 'white',
              top: 0
            }} />
          </View>
        
          {/* BMI-Marker - garantiert sichtbar innerhalb der Skala */}
          {profile.weight && profile.height && (() => {
            // BMI berechnen
            const bmi = profile.weight / Math.pow(profile.height / 100, 2);
            
            // BMI-Bereich definieren
            const minBmi = 15;
            const maxBmi = 40;
            
            // Begrenze den BMI auf den darstellbaren Bereich
            const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi));
            
            // Sicherheitsrand hinzufügen, sodass der Marker immer innerhalb der Skala erscheint
            // 0% = links, 100% = rechts
            const safeMinPos = 0.5; // 0.5% vom linken Rand
            const safeMaxPos = 99.5; // 0.5% vom rechten Rand
            const usableRange = safeMaxPos - safeMinPos;
            
            // Prozentuale Position berechnen mit Sicherheitsrand
            const percentPosition = safeMinPos + ((clampedBmi - minBmi) / (maxBmi - minBmi)) * usableRange;
            
            return (
              <View 
                style={{
                  position: 'absolute',
                  top: 0, // Oben im Container
                  left: `${percentPosition}%`,
                  width: 4,
                  height: 28, // Höher als die Skala für bessere Sichtbarkeit
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: theme.colors.text,
                  borderRadius: 2,
                  transform: [{ translateX: -2 }], // Zentrieren
                }}
              />
            );
          })()}
        </View>
      </View>
      
      {/* Gender Selection */}
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
          width: '100%',
          marginBottom: theme.spacing.s
        }}>
          <Text style={[styles.inputLabel, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m
          }]}>
            Geschlecht
          </Text>
        </View>
        
        {/* Plattformabhängiger Gender-Picker */}
        {Platform.OS === 'web' ? (
          // Web-Dropdown mit nativer Selektbox
          <View style={{
            width: '100%',
            marginBottom: theme.spacing.s
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
          // iOS/Android Spinner-Picker - optimiert für besseres Layout
          <View style={{
            width: '100%',
            marginBottom: theme.spacing.s,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.small,
            height: 56, // Reduzierte Höhe nach 8-Punkt-Grid (7*8=56)
            justifyContent: 'center',
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
                height: 56, // Passend zur Container-Höhe
              }}
              itemStyle={{
                fontSize: 16,
                height: 56, // Passend zur Container-Höhe
                fontWeight: 'bold',
                color: theme.colors.text
              }}
              // Dropdown-Modus für konsistentes Erscheinungsbild
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
          marginBottom: theme.spacing.s
        }}>
          <Text style={{
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.xs
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
      
      {/* U00dcberschrift fu00fcr Ziele */}
      <View style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.s }}>
        <Text style={{
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.fontSize.l,
          color: theme.colors.text,
          marginBottom: theme.spacing.xs
        }}>
          Dein Ernährungsziel
        </Text>
        <Text style={{
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: theme.typography.fontSize.s,
          color: theme.colors.textLight,
          marginBottom: theme.spacing.s
        }}>
          Wähle dein Ernährungsziel oder lege eigene Werte fest. Die Empfehlungen basieren auf deinen Körperdaten.
        </Text>
      </View>
        
      {profile.weight && profile.height && profile.gender && profile.activityLevel ? (
          <>
            {/* Aktuelles Ziel und aufklappbare Optionen */}
            <View style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.borderRadius.small,
              padding: theme.spacing.m,
              marginBottom: theme.spacing.s,
            }}>
              {/* Ziel-Auswahl */}
              {(() => {
                // BMI berechnen
                const bmi = profile.weight / Math.pow(profile.height / 100, 2);
                
                // Das basierend auf BMI empfohlene Ziel
                let recommendedGoal = '';
                if (bmi < 18.5) {
                  recommendedGoal = 'gain';
                } else if (bmi < 25) {
                  recommendedGoal = 'maintain';
                } else if (bmi < 30) {
                  recommendedGoal = 'lose_moderate';
                } else {
                  recommendedGoal = 'lose_fast';
                }
                
                // Ziele definieren
                const goals = [
                  { id: 'gain', title: 'Gesunde Gewichtszunahme', description: 'Für Personen mit Untergewicht oder Muskelaufbau-Ziel.' },
                  { id: 'maintain', title: 'Gewicht halten & Fitness verbessern', description: 'Für Personen mit Normalgewicht, die ihre Fitness verbessern möchten.' },
                  { id: 'lose_moderate', title: 'Moderate Gewichtsreduktion', description: 'Für leichtes Übergewicht, langsamer aber nachhaltiger Gewichtsverlust.' },
                  { id: 'lose_fast', title: 'Gesunde Gewichtsreduktion', description: 'Für stärkeres Übergewicht, schnellerer Gewichtsverlust.' },
                  { id: 'custom', title: 'Benutzerdefiniert', description: 'Eigene Ziele manuell festlegen.' },
                ];
                
                // Das empfohlene Ziel finden
                const recommended = goals.find(goal => goal.id === recommendedGoal) || goals[0];
                
                // Das aktuell ausgewählte Ziel bestimmen (empfohlen oder benutzerdefiniert)
                const activeGoal = selectedGoalId ? goals.find(goal => goal.id === selectedGoalId) || recommended : recommended;
                
                return (
                  <>
                    {/* Hervorgehobene aktive Zielauswahl */}
                    <View style={{
                      backgroundColor: theme.colors.primary + '15',
                      borderRadius: theme.borderRadius.small,
                      padding: theme.spacing.m,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.colors.primary,
                      marginBottom: theme.spacing.m
                    }}>
                      <Text style={{
                        fontFamily: theme.typography.fontFamily.bold,
                        fontSize: theme.typography.fontSize.m,
                        color: theme.colors.text,
                        marginBottom: theme.spacing.xs
                      }}>
                        {selectedGoalId === null ? 'Personalisierte Empfehlung: ' : ''}{activeGoal.title}
                      </Text>
                      <Text style={{
                        fontFamily: theme.typography.fontFamily.regular,
                        fontSize: theme.typography.fontSize.s,
                        color: theme.colors.textLight,
                        marginBottom: theme.spacing.s
                      }}>
                        {activeGoal.description}
                      </Text>
                      
                      {/* Nährwerte für das ausgewählte Ziel */}
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: theme.spacing.xs,
                        paddingTop: theme.spacing.s,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border + '40'
                      }}>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Kalorien</Text>
                          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {profile.goals.dailyCalories}
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Protein</Text>
                          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {profile.goals.dailyProtein}g
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Kohlenhydrate</Text>
                          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {profile.goals.dailyCarbs}g
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Fett</Text>
                          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {profile.goals.dailyFat}g
                          </Text>
                        </View>
                      </View>
                      
                      {/* Benutzerdefinierte Ziele bearbeiten, nur anzeigen wenn "Benutzerdefiniert" ausgewählt ist */}
                      {selectedGoalId === 'custom' && (
                        <View style={{ marginTop: theme.spacing.m }}>
                          <Text style={{
                            fontFamily: theme.typography.fontFamily.medium,
                            fontSize: theme.typography.fontSize.s,
                            color: theme.colors.text,
                            marginBottom: theme.spacing.s
                          }}>
                            Tägliche Ziele anpassen:
                          </Text>
                          
                          <View style={{ marginBottom: theme.spacing.m }}>
                            <Text style={{
                              fontFamily: theme.typography.fontFamily.regular,
                              fontSize: theme.typography.fontSize.s,
                              color: theme.colors.text,
                              marginBottom: theme.spacing.xs
                            }}>
                              Kalorien: {profile.goals.dailyCalories}
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={1200}
                              maximumValue={4000}
                              step={50}
                              value={profile.goals.dailyCalories}
                              minimumTrackTintColor={theme.colors.primary}
                              maximumTrackTintColor="#DCDCDC"
                              thumbTintColor={theme.colors.primary}
                              onValueChange={(value) => {
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  goals: {
                                    ...prevProfile.goals,
                                    dailyCalories: Math.round(value)
                                  }
                                }));
                              }}
                            />
                          </View>
                          
                          <View style={{ marginBottom: theme.spacing.m }}>
                            <Text style={{
                              fontFamily: theme.typography.fontFamily.regular,
                              fontSize: theme.typography.fontSize.s,
                              color: theme.colors.text,
                              marginBottom: theme.spacing.xs
                            }}>
                              Protein: {profile.goals.dailyProtein}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={30}
                              maximumValue={250}
                              step={5}
                              value={profile.goals.dailyProtein}
                              minimumTrackTintColor={theme.colors.primary}
                              maximumTrackTintColor="#DCDCDC"
                              thumbTintColor={theme.colors.primary}
                              onValueChange={(value) => {
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  goals: {
                                    ...prevProfile.goals,
                                    dailyProtein: Math.round(value)
                                  }
                                }));
                              }}
                            />
                          </View>
                          
                          <View style={{ marginBottom: theme.spacing.m }}>
                            <Text style={{
                              fontFamily: theme.typography.fontFamily.regular,
                              fontSize: theme.typography.fontSize.s,
                              color: theme.colors.text,
                              marginBottom: theme.spacing.xs
                            }}>
                              Kohlenhydrate: {profile.goals.dailyCarbs}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={50}
                              maximumValue={500}
                              step={10}
                              value={profile.goals.dailyCarbs}
                              minimumTrackTintColor={theme.colors.primary}
                              maximumTrackTintColor="#DCDCDC"
                              thumbTintColor={theme.colors.primary}
                              onValueChange={(value) => {
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  goals: {
                                    ...prevProfile.goals,
                                    dailyCarbs: Math.round(value)
                                  }
                                }));
                              }}
                            />
                          </View>
                          
                          <View style={{ marginBottom: theme.spacing.s }}>
                            <Text style={{
                              fontFamily: theme.typography.fontFamily.regular,
                              fontSize: theme.typography.fontSize.s,
                              color: theme.colors.text,
                              marginBottom: theme.spacing.xs
                            }}>
                              Fett: {profile.goals.dailyFat}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={20}
                              maximumValue={200}
                              step={5}
                              value={profile.goals.dailyFat}
                              minimumTrackTintColor={theme.colors.primary}
                              maximumTrackTintColor="#DCDCDC"
                              thumbTintColor={theme.colors.primary}
                              onValueChange={(value) => {
                                setProfile(prevProfile => ({
                                  ...prevProfile,
                                  goals: {
                                    ...prevProfile.goals,
                                    dailyFat: Math.round(value)
                                  }
                                }));
                              }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                    
                    {/* Andere Ziele anzeigen/ausblenden */}
                    <TouchableOpacity 
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: theme.spacing.s,
                        backgroundColor: theme.colors.background,
                        borderRadius: theme.borderRadius.small,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        paddingHorizontal: theme.spacing.s,
                        marginBottom: goalsExpanded ? theme.spacing.s : theme.spacing.m
                      }}
                      onPress={() => setGoalsExpanded(!goalsExpanded)}
                    >
                      <Text style={{
                        fontFamily: theme.typography.fontFamily.medium,
                        fontSize: theme.typography.fontSize.s,
                        color: theme.colors.text,
                      }}>
                        {goalsExpanded ? 'Andere Ziele ausblenden' : 'Alternative Ziele anzeigen'}
                      </Text>
                      <Text style={{
                        color: theme.colors.primary,
                        fontSize: theme.typography.fontSize.m,
                      }}>
                        {goalsExpanded ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Aufklappbare alternative Ziele */}
                    {goalsExpanded && (
                      <View style={{
                        backgroundColor: theme.colors.card,
                        borderRadius: theme.borderRadius.small,
                        padding: theme.spacing.m,
                        marginBottom: theme.spacing.m
                      }}>
                        <Text style={{
                          fontFamily: theme.typography.fontFamily.medium,
                          fontSize: theme.typography.fontSize.s,
                          color: theme.colors.textLight,
                          marginBottom: theme.spacing.s
                        }}>
                          Wähle ein alternatives Ziel:
                        </Text>
                        {goals.filter(goal => goal.id !== selectedGoalId).map(goal => (
                          <TouchableOpacity 
                            key={goal.id}
                            style={{
                              paddingVertical: theme.spacing.s,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.border + '40',
                              marginBottom: theme.spacing.s,
                            }}
                            onPress={() => {
                              // Je nach gewähltem Ziel andere Nährwerte setzen
                              const weight = profile.weight || 70; // Standardgewicht wenn undefined
                              const height = profile.height || 170; // Standardgröße wenn undefined
                              const bmr = profile.gender === 'male' 
                                ? 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * (profile.age || 30))
                                : 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * (profile.age || 30));
                              
                              // Aktivitätsmultiplikator
                              let activityMultiplier = 1.2;
                              switch(profile.activityLevel) {
                                case ActivityLevel.LightlyActive: activityMultiplier = 1.375; break;
                                case ActivityLevel.ModeratelyActive: activityMultiplier = 1.55; break;
                                case ActivityLevel.VeryActive: activityMultiplier = 1.725; break;
                                case ActivityLevel.ExtremelyActive: activityMultiplier = 1.9; break;
                              }
                              
                              const maintenanceCalories = Math.round(bmr * activityMultiplier);
                              
                              // Zieldaten basierend auf dem Ziel berechnen
                              let dailyCalories = 0;
                              let protein = 0;
                              let carbs = 0;
                              let fat = 0;
                              
                              switch(goal.id) {
                                case 'gain': // Zunehmen
                                  dailyCalories = maintenanceCalories + 300;
                                  protein = Math.round(weight * 1.6);
                                  carbs = Math.round((dailyCalories * 0.50) / 4);
                                  fat = Math.round((dailyCalories * 0.25) / 9);
                                  break;
                                case 'maintain': // Halten
                                  dailyCalories = maintenanceCalories;
                                  protein = Math.round(weight * 1.4);
                                  carbs = Math.round((dailyCalories * 0.45) / 4);
                                  fat = Math.round((dailyCalories * 0.30) / 9);
                                  break;
                                case 'lose_moderate': // Moderat reduzieren
                                  dailyCalories = maintenanceCalories - 300;
                                  protein = Math.round(weight * 1.8);
                                  carbs = Math.round((dailyCalories * 0.35) / 4);
                                  fat = Math.round((dailyCalories * 0.30) / 9);
                                  break;
                                case 'lose_fast': // Stärker reduzieren
                                  dailyCalories = maintenanceCalories - 500;
                                  protein = Math.round(weight * 2.0);
                                  carbs = Math.round((dailyCalories * 0.30) / 4);
                                  fat = Math.round((dailyCalories * 0.25) / 9);
                                  break;
                              }
                              
                              // Profil aktualisieren
                              const updatedGoals = {
                                ...profile.goals,
                                dailyCalories: dailyCalories,
                                dailyProtein: protein,
                                dailyCarbs: carbs,
                                dailyFat: fat,
                                dailyWater: 2500
                              };
                              
                              setProfile(prevProfile => ({
                                ...prevProfile,
                                goals: updatedGoals
                              }));
                              
                              // Das ausgewählte Ziel setzen
                              setSelectedGoalId(goal.id);
                              
                              // Ziele einklappen nach Auswahl
                              setGoalsExpanded(false);
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Text style={{
                                fontFamily: theme.typography.fontFamily.medium,
                                fontSize: theme.typography.fontSize.m,
                                color: theme.colors.text,
                                flex: 1,
                              }}>
                                {goal.title}
                              </Text>
                              {goal.id === recommendedGoal && (
                                <View style={{
                                  backgroundColor: theme.colors.primary + '20',
                                  paddingHorizontal: theme.spacing.xs,
                                  paddingVertical: 2,
                                  borderRadius: theme.borderRadius.small,
                                  marginLeft: theme.spacing.xs
                                }}>
                                  <Text style={{
                                    fontSize: theme.typography.fontSize.xs,
                                    color: theme.colors.primary,
                                    fontFamily: theme.typography.fontFamily.medium
                                  }}>
                                    Empfohlen
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{
                              fontFamily: theme.typography.fontFamily.regular,
                              fontSize: theme.typography.fontSize.s,
                              color: theme.colors.textLight,
                            }}>
                              {goal.description}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            
            </View>
          </>
        ) : (
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.textLight,
            fontStyle: 'italic'
          }}>
            Fülle alle notwendigen Daten (Gewicht, Größe, Geschlecht, Aktivitätsniveau) aus, 
            um eine auf dich zugeschnittene Empfehlung zu erhalten.
          </Text>
        )}

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
