import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Modal, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityLevel, UserProfile } from '../types';

// Definiere die RootStackParamList hier direkt, um den Import-Fehler zu beheben
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Intro: undefined;
  TabNavigator: undefined; // Wichtig für die Navigation nach Abschluss des Intros
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  BarcodeScanner: undefined;
  FoodDetail: { foodItemId?: string };
  DailyLog: { date?: string };
};
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-context';
import { updateUserProfile, fetchUserProfile } from '../services/profile-api';
import { formatToLocalISODate } from '../utils/date-utils';
import { ArrowRight, ArrowLeft, User, UserRound, Calendar, Weight, Ruler, Activity, Target, Heart, Bike, Bed, BedDouble, Dumbbell, Footprints, ArrowDown, ArrowUp, Award, Minus, Star, X, VenusAndMars, PencilRuler, Goal } from 'lucide-react-native';
import SliderWithInput from '../components/ui/slider-with-input';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

const IntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Der aktuelle Schritt im Onboarding-Prozess
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  // Profildaten, die während des Onboardings gesammelt werden
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_1', // Wir verwenden dieselbe ID wie im ProfileScreen
    name: '',
    goals: {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000,
    },
  });
  
  // Zustände für die Datumauswahl
  const [birthDate, setBirthDate] = useState<Date>(new Date(new Date().getFullYear() - 25, 0, 1));
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);
  const [tempBirthDate, setTempBirthDate] = useState<Date | null>(null);
  
  // Funktionen zur Verwaltung des DatePicker-Modals
  const openDatePickerModal = () => {
    setTempBirthDate(birthDate);
    setShowDatePickerModal(true);
  };
  
  const confirmDatePickerModal = () => {
    if (tempBirthDate) {
      setBirthDate(tempBirthDate);
    }
    setShowDatePickerModal(false);
  };
  
  const cancelDatePickerModal = () => {
    setShowDatePickerModal(false);
  };
  
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
  
  // State für Slider-Werte
  const [weightValue, setWeightValue] = useState<number>(70);
  const [heightValue, setHeightValue] = useState<number>(170);
  
  useEffect(() => {
    // Lade vorhandene Profildaten, falls vorhanden
    const loadProfile = async () => {
      try {
        const savedProfile = await fetchUserProfile();
        if (savedProfile) {
          setProfile(savedProfile);
          
          if (savedProfile.weight) {
            setWeightValue(savedProfile.weight);
          }
          
          if (savedProfile.height) {
            setHeightValue(savedProfile.height);
          }
          
          if (savedProfile.birthDate) {
            const parts = savedProfile.birthDate.split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const day = parseInt(parts[2], 10);
              setBirthDate(new Date(year, month, day));
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile during intro:', error);
      }
    };
    
    loadProfile();
  }, []);
  
  // Aktualisiere das Profil mit den gesammelten Daten
  const updateProfile = async () => {
    try {
      // Berechne das Alter aus dem Geburtsdatum
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Erstelle ein formatiertes Datum im YYYY-MM-DD Format
      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Berechne Zielwerte basierend auf dem Profil und dem ausgewählten Ziel
      let goalCalories = 2000;
      let goalProtein = 50;
      let goalCarbs = 250;
      let goalFat = 70;
      
      // Basis-Kalorienverbrauch mit Harris-Benedict-Formel berechnen
      if (profile.gender && weightValue && heightValue && age) {
        let bmr = 0;
        if (profile.gender === 'male') {
          // Männer: BMR = 66.5 + (13.75 * kg) + (5.003 * cm) - (6.75 * Alter)
          bmr = 66.5 + (13.75 * weightValue) + (5.003 * heightValue) - (6.75 * age);
        } else {
          // Frauen: BMR = 655.1 + (9.563 * kg) + (1.850 * cm) - (4.676 * Alter)
          bmr = 655.1 + (9.563 * weightValue) + (1.850 * heightValue) - (4.676 * age);
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
        
        // Täglicher Kalorienbedarf zum Gewicht halten (TDEE)
        const maintenanceCalories = Math.round(bmr * activityMultiplier);
        
        // Berechne basierend auf dem ausgewählten Ziel
        switch (profile.activeGoalTypeId) {
          case 'lose_weight': // Abnehmen
            goalCalories = maintenanceCalories - 500;
            goalProtein = Math.round(weightValue * 1.8); // Mehr Protein zur Sättigung
            goalCarbs = Math.round((goalCalories * 0.35) / 4); // 35% Kohlenhydrate
            goalFat = Math.round((goalCalories * 0.30) / 9); // 30% Fett
            break;
          case 'gain_weight': // Zunehmen/Muskelaufbau
            goalCalories = maintenanceCalories + 400;
            goalProtein = Math.round(weightValue * 1.6); // Mehr Protein für Muskelaufbau
            goalCarbs = Math.round((goalCalories * 0.50) / 4); // 50% Kohlenhydrate
            goalFat = Math.round((goalCalories * 0.25) / 9); // 25% Fett
            break;
          case 'maintain_weight': // Halten
          default:
            goalCalories = maintenanceCalories;
            goalProtein = Math.round(weightValue * 1.4);
            goalCarbs = Math.round((goalCalories * 0.45) / 4); // 45% Kohlenhydrate
            goalFat = Math.round((goalCalories * 0.30) / 9); // 30% Fett
            break;
        }
      }
      
      // Aktualisiere das Profil mit allen gesammelten Daten
      const updatedProfile: UserProfile = {
        ...profile,
        weight: weightValue,
        height: heightValue,
        age: age,
        birthDate: formattedDate,
        goals: {
          dailyCalories: goalCalories,
          dailyProtein: goalProtein,
          dailyCarbs: goalCarbs,
          dailyFat: goalFat,
          dailyWater: 2500 // Standardwert für Wasser
        }
      };
      
      await updateUserProfile(updatedProfile);
      
      // Navigiere zum TabNavigator, der dann zum Home-Screen führt
      // @ts-ignore - Die Route existiert im Root-Navigator
      navigation.reset({
        index: 0,
        routes: [{ name: 'TabNavigator' }]
      });
    } catch (error) {
      console.error('Error updating profile during intro:', error);
    }
  };
  
  // Funktion zum Umschalten zwischen den Schritten
  const goToNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // Beim letzten Schritt: Profil aktualisieren und zur Hauptseite navigieren
      updateProfile();
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Rendert den aktuellen Schritt basierend auf currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Willkommen & Name
        return (
          <View style={styles.stepContainer}>
            <User size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Willkommen!</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Lass uns dein Profil einrichten, damit wir dir personalisierte Ernährungsempfehlungen geben können.
            </Text>
            
            <Text style={[styles.label, { color: theme.colors.text }]}>Wie lautet dein Name?</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.card 
              }]}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              placeholder="Dein Name"
              placeholderTextColor={theme.colors.textLight}
            />
          </View>
        );
        
      case 1: // Geschlecht
        return (
          <View style={styles.stepContainer}>
            <View>
              <VenusAndMars size={48} color={theme.colors.primary} style={styles.stepIcon} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Dein Geschlecht</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Diese Information hilft uns, deinen Grundumsatz präziser zu berechnen.
            </Text>
            
            <View style={[styles.pickerContainer, {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card
            }]}>
              <Picker
                selectedValue={profile.gender || 'male'}
                onValueChange={(value) => {
                  const genderValue = typeof value === 'string' ? value : String(value);
                  setProfile(prev => ({ ...prev, gender: genderValue as 'male' | 'female' | 'divers' }));
                }}
                style={{
                  width: '100%',
                  color: theme.colors.text,
                }}
                itemStyle={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.colors.text
                }}
                mode="dropdown"
              >
                <Picker.Item label="Männlich" value="male" />
                <Picker.Item label="Weiblich" value="female" />
                <Picker.Item label="Divers" value="divers" />
              </Picker>
            </View>
          </View>
        );
        
      case 2: // Alter
        return (
          <View style={styles.stepContainer}>
            <Calendar size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Dein Geburtsdatum</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Dein Alter beeinflusst deinen Kalorienbedarf.
            </Text>
            
            <TouchableOpacity 
              style={[styles.datePickerButton, { 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card 
              }]}
              onPress={openDatePickerModal}
            >
              <Text style={[styles.dateText, { color: theme.colors.text }]}>
                {birthDate.toLocaleDateString('de-DE')}
              </Text>
              <Calendar size={20} color={theme.colors.textLight} />
            </TouchableOpacity>
          </View>
        );
        
      case 3: // Körperdaten (Gewicht & Größe)
        return (
          
          <View style={styles.stepContainer}>
            <View>
              <PencilRuler size={48} color={theme.colors.primary} style={styles.stepIcon} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Deine Körperdaten</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Dein Gewicht und deine Größe helfen uns, deinen BMI und Kalorienbedarf zu berechnen.
            </Text>
            
            {/* Gewicht Slider */}
            <View style={styles.sliderContainer}>
              <SliderWithInput
              minValue={30}
              maxValue={200}
              middleValue={115}
              step={0.1}
              decimalPlaces={2}
              allowDecimals={true}
              value={profile.weight || 70}
              onValueChange={(value: number) => {
                setProfile(prev => ({
                  ...prev,
                  weight: value
                }));
              }}
              label="Gewicht"
              unit="Kilogramm"
              placeholder="70.00"
            />
            </View>
            
            {/* Größe Slider */}
            <View style={styles.sliderContainer}>
              <SliderWithInput
              minValue={120}
              maxValue={240}
              middleValue={180}
              step={1}
              decimalPlaces={0}
              allowDecimals={false}
              value={profile.height || 170}
              onValueChange={(value: number) => {
                setProfile(prev => ({
                  ...prev,
                  height: value
                }));
              }}
              label="Größe"
              unit="Zentimeter"
              placeholder="170"
            />
            </View>
          </View>
        );
        
      case 4: // Aktivitätslevel
        return (
          <View style={styles.stepContainer}>
            <Activity size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Dein Aktivitätsniveau</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Wähle die Option, die am besten zu deinem Alltag passt.
            </Text>
            
            {/* Aktivitätsoptionen */}
            <TouchableOpacity 
              style={[
                styles.activityOption, 
                { 
                  borderColor: profile.activityLevel === ActivityLevel.Sedentary ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activityLevel === ActivityLevel.Sedentary ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activityLevel: ActivityLevel.Sedentary}))}
            >
              <Bed size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Kaum aktiv</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Vorwiegend sitzende Tätigkeit, wenig Bewegung im Alltag
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.activityOption, 
                { 
                  borderColor: profile.activityLevel === ActivityLevel.LightlyActive ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activityLevel === ActivityLevel.LightlyActive ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activityLevel: ActivityLevel.LightlyActive}))}
            >
              <Footprints size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Leicht aktiv</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Stehende Tätigkeit, leichter Spaziergang oder 1-2x Sport pro Woche
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.activityOption, 
                { 
                  borderColor: profile.activityLevel === ActivityLevel.ModeratelyActive ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activityLevel === ActivityLevel.ModeratelyActive ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activityLevel: ActivityLevel.ModeratelyActive}))}
            >
              <Bike size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Mäßig aktiv</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Regelmäßige körperliche Aktivität, 2-3x Sport pro Woche
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.activityOption, 
                { 
                  borderColor: profile.activityLevel === ActivityLevel.VeryActive ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activityLevel === ActivityLevel.VeryActive ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activityLevel: ActivityLevel.VeryActive}))}
            >
              <Dumbbell size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Sehr aktiv</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Körperlich anstrengende Tätigkeit oder 4-5x Sport pro Woche
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.activityOption, 
                { 
                  borderColor: profile.activityLevel === ActivityLevel.ExtremelyActive ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activityLevel === ActivityLevel.ExtremelyActive ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activityLevel: ActivityLevel.ExtremelyActive}))}
            >
              <Dumbbell size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Extrem aktiv</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Sportler, tägliches intensives Training oder körperliche Arbeit
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      
      case 5: // Ziele
        return (
          <View style={styles.stepContainer}>
            <Goal size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Dein Ziel</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Was möchtest du mit dieser App erreichen?
            </Text>
            
            {/* Zieloptionen */}
            <TouchableOpacity 
              style={[
                styles.goalOption, 
                { 
                  borderColor: profile.activeGoalTypeId === 'lose_weight' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activeGoalTypeId === 'lose_weight' ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activeGoalTypeId: 'lose_weight'}))}
            >
              <ArrowDown size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Abnehmen</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Kaloriendefizit, um Gewicht zu verlieren
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.goalOption, 
                { 
                  borderColor: profile.activeGoalTypeId === 'maintain_weight' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activeGoalTypeId === 'maintain_weight' ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activeGoalTypeId: 'maintain_weight'}))}
            >
              <Minus size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Gewicht halten</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Ausgeglichene Kalorienbilanz
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.goalOption, 
                { 
                  borderColor: profile.activeGoalTypeId === 'gain_weight' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: profile.activeGoalTypeId === 'gain_weight' ? `${theme.colors.primary}20` : theme.colors.card
                }
              ]}
              onPress={() => setProfile(prev => ({...prev, activeGoalTypeId: 'gain_weight'}))}
            >
              <ArrowUp size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Zunehmen</Text>
                <Text style={[styles.activityDescription, { color: theme.colors.textLight }]}>
                  Kalorienuüberschuss für Muskelaufbau oder Gewichtszunahme
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      
      case 6: // Zusammenfassung
        // Berechne den BMI für die Anzeige
        const bmi = profile.weight && profile.height ? 
          (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : '?';
        
        // BMI-Kategorie bestimmen
        let bmiCategory = '';
        const bmiValue = parseFloat(bmi);
        if (!isNaN(bmiValue)) {
          if (bmiValue < 18.5) bmiCategory = 'Untergewicht';
          else if (bmiValue < 25) bmiCategory = 'Normalgewicht';
          else if (bmiValue < 30) bmiCategory = 'Übergewicht';
          else bmiCategory = 'Adipositas';
        }
        
        return (
          <View style={styles.stepContainer}>
            <Award size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Zusammenfassung</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Hier ist eine Übersicht deiner Daten. Alles kann später noch geändert werden.
            </Text>
            
            <View style={[styles.summaryContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Name:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{profile.name || '-'}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Geschlecht:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.gender === 'male' ? 'Männlich' : 
                   profile.gender === 'female' ? 'Weiblich' : 
                   profile.gender === 'divers' ? 'Divers' : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Alter:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.age || (birthDate ? calculateAge(birthDate) : '-')}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Gewicht:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.weight ? `${profile.weight} kg` : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Größe:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.height ? `${profile.height} cm` : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>BMI:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {bmi} ({bmiCategory})
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Aktivitätslevel:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.activityLevel === ActivityLevel.Sedentary ? 'Kaum aktiv' : 
                   profile.activityLevel === ActivityLevel.LightlyActive ? 'Leicht aktiv' : 
                   profile.activityLevel === ActivityLevel.ModeratelyActive ? 'Mäßig aktiv' : 
                   profile.activityLevel === ActivityLevel.VeryActive ? 'Sehr aktiv' : 
                   profile.activityLevel === ActivityLevel.ExtremelyActive ? 'Extrem aktiv' : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Ziel:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {profile.activeGoalTypeId === 'lose_weight' ? 'Abnehmen' : 
                   profile.activeGoalTypeId === 'maintain_weight' ? 'Gewicht halten' : 
                   profile.activeGoalTypeId === 'gain_weight' ? 'Zunehmen' : '-'}
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  // Modal-Komponente für DateTimePicker
  const renderDatePickerModal = () => {
    if (!showDatePickerModal) return null;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDatePickerModal}
        onRequestClose={cancelDatePickerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, borderRadius: 16 }]}>
            <Text style={[styles.modalTitle, { 
              fontFamily: theme.typography?.fontFamily?.bold, 
              color: theme.colors.text 
            }]}>
              Geburtsdatum auswählen
            </Text>
            {/* Close button for modal */}
            <TouchableOpacity onPress={cancelDatePickerModal} style={styles.modalCloseButton}>
              <X size={24} color={theme.colors.text} strokeWidth={1.5} />
            </TouchableOpacity>
            
            <View style={styles.datePickerContainer}>
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
                    borderRadius: 8,
                    backgroundColor: theme.colors.background,
                    fontSize: '16px',
                    padding: '12px',
                    color: theme.colors.text,
                    outline: 'none'
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                />
              ) : (
                <View style={[{
                  backgroundColor: theme.colors.background,
                  borderRadius: 8,
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
                        height: 200
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error + '20', borderRadius: 8 }]}
                onPress={cancelDatePickerModal}
              >
                <Text style={{ color: theme.colors.error, fontFamily: theme.typography?.fontFamily?.medium }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary + '20', borderRadius: 8 }]}
                onPress={confirmDatePickerModal}
              >
                <Text style={{ color: theme.colors.primary, fontFamily: theme.typography?.fontFamily?.medium }}>
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
    <SafeAreaView style={[styles.container, { 
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      {/* DatePicker-Modal */}
      {renderDatePickerModal()}
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Fortschrittsanzeige */}
        <View style={styles.progressContainer}>
          {Array(7).fill(0).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                { 
                  backgroundColor: index <= currentStep ? theme.colors.primary : theme.colors.border
                }
              ]}
            />
          ))}
        </View>
        
        {/* Aktueller Schritt */}
        {renderStep()}
        
        {/* Navigation */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.backButton, { borderColor: theme.colors.border }]}
              onPress={goToPreviousStep}
            >
              <ArrowLeft size={20} color={theme.colors.text} />
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Zurück</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, { backgroundColor: theme.colors.primary }]}
            onPress={goToNextStep}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {currentStep === 6 ? 'Fertig' : 'Weiter'}
            </Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Wir verwenden useTheme im StyleSheet nicht, daher definieren wir mit Bezug auf das importierte Theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  stepIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold', // Verwende die custom Schriftart statt fontWeight
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular', // Verwende die custom Schriftart
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold', // Verwende die custom Schriftart statt fontWeight
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular', // Füge die Schriftart hinzu
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButton: {
    borderWidth: 1,
  },
  nextButton: {
    marginLeft: 'auto',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold', // Verwende die custom Schriftart statt fontWeight
    marginHorizontal: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  datePickerContainer: {
    marginVertical: 20,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
  },
  datePickerButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  sliderContainer: {
    width: '100%',
    marginTop: 16,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityText: {
    marginLeft: 15,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryContainer: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
  },
});

export default IntroScreen;
