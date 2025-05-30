import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Modal, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-context';
import { updateUserProfile, fetchUserProfile, fetchGoalTypes, createOrUpdateUserGoal } from '../services/profile-api';
import { ArrowRight, ArrowLeft, User, UserRound, Calendar, Weight, Ruler, Activity, Target, Heart, Bike, Bed, BedDouble, Dumbbell, Footprints, ArrowDown, ArrowUp, Award, Minus, Star, X, VenusAndMars, PencilRuler, Goal } from 'lucide-react-native';
import SliderWithInput from '../components/ui/slider-with-input';
import { DatePicker } from '../components/ui/date-picker';
import LoadingScreen from '../components/ui/loading-screen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

const IntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Der aktuelle Schritt im Onboarding-Prozess
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Ladezustand für das Abschließen des Onboardings
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  
  // Profildaten, die während des Onboardings gesammelt werden
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_1', // Wir verwenden dieselbe ID wie im ProfileScreen
    name: '',
    gender: 'male', // Standardwert für Geschlecht setzen
    goals: {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000,
    },
  });
  
  // Zustand für das Geburtsdatum
  const [birthDate, setBirthDate] = useState<Date>(new Date(new Date().getFullYear() - 25, 0, 1));
  
  // Zustände für Ziele und Zieltypen
  const [goalTypes, setGoalTypes] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [calculatedGoalValues, setCalculatedGoalValues] = useState({
    dailyCalories: 2000,
    dailyProtein: 50,
    dailyCarbs: 250,
    dailyFat: 70,
    dailyWater: 2000,
  });
  
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
  
  // Laden der Zieltypen beim ersten Rendern
  useEffect(() => {
    const loadGoalTypes = async () => {
      try {
        const types = await fetchGoalTypes();
        setGoalTypes(types);
      } catch (error) {
        console.error('Fehler beim Laden der Zieltypen:', error);
      }
    };
    
    loadGoalTypes();
  }, []);
  
  // Funktion zum Berechnen der empfohlenen Ziele basierend auf BMI
  const calculateRecommendedGoals = () => {
    if (!profile.weight || !profile.height || !profile.gender || !profile.activityLevel) {
      return;
    }
    
    // Berechne BMI
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    
    // Wähle ein Ziel basierend auf BMI
    let recommendedGoalId = 'maintain'; // Standard: Gewicht halten
    
    if (bmi < 18.5) {
      // Untergewicht - Zunehmen empfehlen
      recommendedGoalId = 'gain';
      setSelectedGoalId('gain');
    } else if (bmi < 25) {
      // Normalgewicht - Halten empfehlen
      recommendedGoalId = 'maintain';
      setSelectedGoalId('maintain');
    } else if (bmi < 30) {
      // Übergewicht - Leicht reduzieren empfehlen
      recommendedGoalId = 'lose_moderate';
      setSelectedGoalId('lose_moderate');
    } else {
      // Adipositas - Stärker reduzieren empfehlen
      recommendedGoalId = 'lose_fast';
      setSelectedGoalId('lose_fast');
    }
    
    // Berechne die empfohlenen Werte basierend auf dem Ziel
    calculateGoalValues(recommendedGoalId);
  };
  
  // Funktion zum Berechnen der konkreten Zielwerte
  const calculateGoalValues = (goalId: string) => {
    if (!profile.weight || !profile.height || !profile.gender || !profile.activityLevel) {
      return;
    }
    
    // Alter aus dem Geburtsdatum berechnen (falls gesetzt)
    const age = birthDate ? calculateAge(birthDate) : 30;
    
    // Basis-Kalorienverbrauch mit Harris-Benedict-Formel berechnen
    let bmr = 0;
    if (profile.gender === 'male') {
      // Männer: BMR = 66.5 + (13.75 * kg) + (5.003 * cm) - (6.75 * Alter)
      bmr = 66.5 + (13.75 * profile.weight) + (5.003 * profile.height) - (6.75 * age);
    } else {
      // Frauen: BMR = 655.1 + (9.563 * kg) + (1.850 * cm) - (4.676 * Alter)
      bmr = 655.1 + (9.563 * profile.weight) + (1.850 * profile.height) - (4.676 * age);
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
    
    let dailyCalories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    const dailyWater = 2000; // Standardwert für Wasser
    
    // Ziel-basierte Berechnung - Exakt wie im Profile-Screen
    switch (goalId) {
      case 'lose_fast':
        // Schnelles Abnehmen: TDEE - 500 Kalorien
        dailyCalories = maintenanceCalories - 500;
        protein = Math.round((profile.weight || 70) * 2.0); // Fallback zu 70kg wie im Profile-Screen
        carbs = Math.round((dailyCalories * 0.30) / 4);
        fat = Math.round((dailyCalories * 0.25) / 9);
        break;
      case 'lose_moderate':
        // Moderates Abnehmen: TDEE - 300 Kalorien
        dailyCalories = maintenanceCalories - 300;
        protein = Math.round((profile.weight || 70) * 1.6); // Fallback zu 70kg
        carbs = Math.round((dailyCalories * 0.40) / 4);
        fat = Math.round((dailyCalories * 0.30) / 9);
        break;
      case 'gain':
        // Zunehmen: TDEE + 400 Kalorien
        dailyCalories = maintenanceCalories + 400;
        protein = Math.round((profile.weight || 70) * 1.6); // Fallback zu 70kg
        carbs = Math.round((dailyCalories * 0.50) / 4);
        fat = Math.round((dailyCalories * 0.25) / 9);
        break;
      case 'maintain':
      default:
        // Halten: TDEE (Maintenance)
        dailyCalories = maintenanceCalories;
        protein = Math.round((profile.weight || 70) * 1.4); // Fallback zu 70kg
        carbs = Math.round((dailyCalories * 0.45) / 4);
        fat = Math.round((dailyCalories * 0.30) / 9);
        break;
    }
    
    // Setze die berechneten Werte
    setCalculatedGoalValues({
      dailyCalories,
      dailyProtein: protein,
      dailyCarbs: carbs,
      dailyFat: fat,
      dailyWater
    });
  };
  
  // State für Slider-Werte - mit dem Profile synchronisiert
  const [weightValue, setWeightValue] = useState<number>(profile.weight || 70);
  const [heightValue, setHeightValue] = useState<number>(profile.height || 170);
  
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
  
  // useEffect für die Zielberechnung, wenn wir zum Zielschritt oder Zusammenfassungsschritt gelangen
  useEffect(() => {
    if ((currentStep === 5 || currentStep === 6) && profile.weight && profile.height && profile.gender && profile.activityLevel) {
      // Wenn ein Ziel bereits ausgewählt wurde, berechne die Werte für dieses Ziel
      if (selectedGoalId) {
        calculateGoalValues(selectedGoalId);
      } else {
        // Ansonsten berechne die empfohlenen Ziele basierend auf BMI
        calculateRecommendedGoals();
      }
    }
  }, [currentStep, profile.weight, profile.height, profile.gender, profile.activityLevel, selectedGoalId]);
  
  // Aktualisiere das Profil mit den gesammelten Daten
  const updateProfile = async () => {
    try {
      // Berechne das Alter aus dem Geburtsdatum
      const age = calculateAge(birthDate);
      
      // Formatiere das Datum für die Speicherung (YYYY-MM-DD)
      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0'); // +1, da Monate von 0 beginnen
      const day = String(birthDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Aktualisiere das Profil mit allen gesammelten Daten
      const updatedProfile: UserProfile = {
        ...profile,
        weight: weightValue,
        height: heightValue,
        age: age,
        birthDate: formattedDate,
        // Stelle sicher, dass das Geschlecht explizit gesetzt ist (auch wenn es der Standardwert ist)
        gender: profile.gender || 'male', // Verwende den aktuellen Wert oder 'male' als Fallback
        activeGoalTypeId: selectedGoalId || null, // Speichere das ausgewählte Ziel
        goals: {
          // Verwende die berechneten Zielwerte
          dailyCalories: calculatedGoalValues.dailyCalories,
          dailyProtein: calculatedGoalValues.dailyProtein,
          dailyCarbs: calculatedGoalValues.dailyCarbs,
          dailyFat: calculatedGoalValues.dailyFat,
          dailyWater: calculatedGoalValues.dailyWater
        }
      };
      
      // Profil in der API aktualisieren
      await updateUserProfile(updatedProfile);
      
      // Wenn ein Ziel ausgewählt wurde, speichere es auch als UserGoal
      if (selectedGoalId) {
        try {
          const userGoal = {
            userId: updatedProfile.id,
            goalTypeId: selectedGoalId,
            isCustom: false,
            dailyCalories: calculatedGoalValues.dailyCalories,
            dailyProtein: calculatedGoalValues.dailyProtein,
            dailyCarbs: calculatedGoalValues.dailyCarbs,
            dailyFat: calculatedGoalValues.dailyFat,
            dailyWater: calculatedGoalValues.dailyWater
          };
          
          await createOrUpdateUserGoal(userGoal);
        } catch (goalError) {
          console.error('Fehler beim Speichern des Benutzerziels:', goalError);
          // Fehler beim Speichern des Ziels sollte den gesamten Vorgang nicht abbrechen
        }
      }
      
      // Profile als vollständig markieren
      await AsyncStorage.setItem('ONBOARDING_COMPLETED', 'true');
      
      // Kurze Verzögerung, dann die Zurück-Navigation nutzen
      setTimeout(async () => {
        try {
          // Da die Zurück-Geste funktioniert, nutzen wir genau diese Funktionalität programmatisch
          if (navigation.canGoBack()) {
            // Auf diesem Weg kommen wir zum Home-Screen, wie du beschrieben hast
            navigation.goBack();
            
            // Damit wir besser verstehen, was passiert, loggen wir die erfolgreiche Navigation
            console.log('Navigation mit goBack() durchgeführt');
          } else {
            // Falls kein Zurück möglich ist, versuchen wir es direkt
            navigation.navigate('TabNavigator' as any);
            console.log('Navigation mit navigate("TabNavigator") durchgeführt');
          }
        } catch (error) {
          console.error('Navigationsfehler:', error);
          
          // Ladebildschirm ausblenden bei Fehlern
          setIsCompleting(false);
          
          // Benutzerfreundliche Fehlermeldung
          Alert.alert(
            'Fast geschafft!',
            'Dein Profil wurde gespeichert. Tippe auf "OK" und nutze die Zurück-Geste, um zum Hauptbildschirm zu gelangen.',
            [{ text: 'OK' }]
          );
        }
      }, 1200);
    } catch (error) {
      console.error('Error updating profile during intro:', error);
      setIsCompleting(false); // Bei einem Fehler den Ladezustand deaktivieren
      Alert.alert(
        'Fehler',
        'Beim Speichern des Profils ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Funktion zum Umschalten zwischen den Schritten
  const goToNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      
      // Wenn wir zum Zielschritt wechseln, berechne die empfohlenen Ziele
      if (currentStep === 4) {
        calculateRecommendedGoals();
      }
    } else {
      // Beim letzten Schritt: Profil aktualisieren und zur Hauptseite navigieren
      setIsCompleting(true); // Ladezustand aktivieren
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
                selectedValue={profile.gender}
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
            
            <DatePicker
              label="Geburtsdatum"
              value={birthDate}
              onValueChange={(date) => {
                setBirthDate(date);
              }}
              ageLabel={true}
              customButtonText="Auswählen"
              customModalTitle="Geburtsdatum auswählen"
              maxDate={new Date(new Date().getFullYear() + 1, 0, 0)}
              minDate={new Date(1900, 0, 1)}
            />
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
                setWeightValue(value);
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
                setHeightValue(value);
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
            <Target size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Dein Ziel</Text>
            <Text style={[styles.description, { color: theme.colors.textLight }]}>
              Wähle ein Ziel, das zu dir passt. Basierend auf deinem BMI empfehlen wir:
            </Text>
            
            {goalTypes.length > 0 ? (
              <View style={styles.goalOptionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    { 
                      borderColor: selectedGoalId === 'gain' ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selectedGoalId === 'gain' ? `${theme.colors.primary}20` : theme.colors.card
                    }
                  ]}
                  onPress={() => {
                    setSelectedGoalId('gain');
                    calculateGoalValues('gain');
                  }}
                >
                  <ArrowUp size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Gesunde Gewichtszunahme</Text>
                    <Text style={[styles.goalDescription, { color: theme.colors.textLight }]}>
                      Für Personen mit Untergewicht oder Muskelaufbau-Ziel.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    { 
                      borderColor: selectedGoalId === 'maintain' ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selectedGoalId === 'maintain' ? `${theme.colors.primary}20` : theme.colors.card
                    }
                  ]}
                  onPress={() => {
                    setSelectedGoalId('maintain');
                    calculateGoalValues('maintain');
                  }}
                >
                  <Minus size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Gewicht halten & Fitness verbessern</Text>
                    <Text style={[styles.goalDescription, { color: theme.colors.textLight }]}>
                      Für Personen mit Normalgewicht, die ihre Fitness verbessern möchten.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    { 
                      borderColor: selectedGoalId === 'lose_moderate' ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selectedGoalId === 'lose_moderate' ? `${theme.colors.primary}20` : theme.colors.card
                    }
                  ]}
                  onPress={() => {
                    setSelectedGoalId('lose_moderate');
                    calculateGoalValues('lose_moderate');
                  }}
                >
                  <ArrowDown size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Moderate Gewichtsreduktion</Text>
                    <Text style={[styles.goalDescription, { color: theme.colors.textLight }]}>
                      Für leichtes Übergewicht, langsamer aber nachhaltiger Gewichtsverlust.
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    { 
                      borderColor: selectedGoalId === 'lose_fast' ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selectedGoalId === 'lose_fast' ? `${theme.colors.primary}20` : theme.colors.card
                    }
                  ]}
                  onPress={() => {
                    setSelectedGoalId('lose_fast');
                    calculateGoalValues('lose_fast');
                  }}
                >
                  <ArrowDown size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={[styles.goalTitle, { color: theme.colors.text }]}>Gesunde Gewichtsreduktion</Text>
                    <Text style={[styles.goalDescription, { color: theme.colors.textLight }]}>
                      Für stärkeres Übergewicht, schnellerer Gewichtsverlust.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <ActivityIndicator size='large' color={theme.colors.primary} />
            )}
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
                  {/* Immer einen Wert anzeigen, Standardwert ist 'male' */}
                  {(profile.gender || 'male') === 'male' ? 'Männlich' : 
                   profile.gender === 'female' ? 'Weiblich' : 
                   profile.gender === 'divers' ? 'Divers' : 'Männlich'}
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
                  {selectedGoalId === 'gain' ? 'Gesunde Gewichtszunahme' : 
                   selectedGoalId === 'maintain' ? 'Gewicht halten & Fitness verbessern' : 
                   selectedGoalId === 'lose_moderate' ? 'Moderate Gewichtsreduktion' : 
                   selectedGoalId === 'lose_fast' ? 'Gesunde Gewichtsreduktion' : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textLight }]}>Kalorienziel:</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {calculatedGoalValues.dailyCalories} kcal
                </Text>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  // DateTimePicker-Funktionalität wurde in die DatePicker-Komponente verschoben

  // Wenn das Onboarding abgeschlossen wird, zeigen wir einen Ladebildschirm an
  if (isCompleting) {
    return <LoadingScreen message="Dein Profil wird gespeichert..." />;
  }
  
  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      {/* DatePicker-Modal wurde in die DatePicker-Komponente verschoben */}
      
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
  // DatePicker-Styles wurden in die DatePicker-Komponente verschoben
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
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
  // Styles für Zielauswahl
  goalOptionsContainer: {
    width: '100%',
    marginTop: 15,
  },
  goalText: {
    marginLeft: 15,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 5,
  },
  goalDescription: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
});

export default IntroScreen;
