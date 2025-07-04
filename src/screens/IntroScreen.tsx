import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Modal, Platform, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLevel, UserProfile } from '../types';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, FadeIn, FadeOut, SlideInRight, SlideOutLeft, Layout } from 'react-native-reanimated';

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
import { useTheme } from '../theme/ThemeContext';
import { updateUserProfile, fetchUserProfile, fetchGoalTypes, createOrUpdateUserGoal } from '../services/profileApi';
import { logout } from '../services/authService';
import { ArrowRight, ArrowLeft, User, UserRound, Calendar, Weight, Ruler, Activity, Target, Heart, Bike, Bed, BedDouble, Dumbbell, Footprints, ArrowDown, ArrowUp, Award, Minus, Star, X, VenusAndMars, PencilRuler, Goal, ArrowBigUpDash, ArrowBigDownDash, ArrowBigDown, ChevronsDownUp, ChevronsUpDown, BicepsFlexed, Scale, ChevronsDown, ChevronsUp } from 'lucide-react-native';
import SliderWithInput from '../components/ui/SliderWithInput';
import { DatePicker } from '../components/ui/DatePicker';
import LoadingScreen from '../components/ui/LoadingScreen';
import { AndroidHaptics } from 'expo-haptics';
import { createIntroStyles } from '../styles/screens/IntroStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

const IntroScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createIntroStyles(theme);
  
  // Funktion zum Abbrechen des Onboardings
  const cancelOnboarding = () => {
    Alert.alert(
      'Vorgang abbrechen',
      'Möchtest du diesen Vorgang wirklich abbrechen? Du kannst dich später wieder anmelden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Beenden', style: 'destructive', onPress: async () => {
          // Verwende die logout-Funktion aus dem auth-service
          const success = await logout();
          if (success) {
            // Die App navigiert automatisch zum Login-Screen
            // aufgrund der Auth-Prüfung in NavigationContent
            console.log('Onboarding abgebrochen, Benutzer abgemeldet');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } else {
            Alert.alert('Fehler', 'Beim Abbrechen des Onboardings ist ein Fehler aufgetreten.');
          }
        }}
      ]
    );
  };
  
  // Der aktuelle Schritt im Onboarding-Prozess
  const [currentStep, setCurrentStep] = useState<number>(0);
  // Ladezustand für das Abschließen des Onboardings
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  // Animationsrichtung: 'forward' oder 'backward'
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  
  // Profildaten, die während des Onboardings gesammelt werden
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_1', // Wir verwenden dieselbe ID wie im ProfileScreen
    name: '',
    gender: undefined, // Kein Standardwert, damit der Benutzer eine Auswahl treffen muss
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
  
  // Die weightValue und heightValue sind weiter unten bereits definiert
  
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
  const calculateRecommendedGoals = (): string => {
    // Verwende die Profildaten wie im ProfileScreen
    if (!profile.weight || !profile.height || !profile.gender || !profile.activityLevel) {
      return 'maintain'; // Standard-Rückgabewert, wenn nicht alle Daten vorhanden sind
    }
    
    // Berechne BMI mit den Profil-Werten
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    
    // Wähle ein Ziel basierend auf BMI
    let recommendedGoalId = 'maintain'; // Standard: Gewicht halten
    
    if (bmi < 18.5) {
      // Untergewicht - Zunehmen empfehlen
      recommendedGoalId = 'gain';
    } else if (bmi >= 25) {
      // Übergewicht - Moderate Gewichtsreduktion empfehlen
      recommendedGoalId = 'lose_moderate';
    } else if (bmi >= 30) {
      // Starkes Übergewicht - Stärkere Gewichtsreduktion empfehlen
      recommendedGoalId = 'lose_weight';
    }
    
    // Berechne die empfohlenen Werte basierend auf dem Ziel
    calculateGoalValues(recommendedGoalId);
    
    return recommendedGoalId;
  };
  
  // Funktion zum Berechnen der konkreten Zielwerte
  const calculateGoalValues = (goalId: string) => {
    // Wir verwenden das profile-Objekt für die Berechnung, wie im ProfileScreen
    // Falls Werte fehlen, verwenden wir Standardwerte
    if (!profile.weight || !profile.height) {
      // Stelle sicher, dass wir profile.weight und profile.height immer haben
      setProfile(prev => ({
        ...prev,
        weight: prev.weight || weightValue || 70,
        height: prev.height || heightValue || 170
      }));
      return; // Warte auf den nächsten Render-Zyklus mit den aktualisierten Werten
    }
    
    const gender = profile.gender || 'male'; // Standardgeschlecht ist männlich
    const activityLevel = profile.activityLevel || ActivityLevel.ModeratelyActive; // Moderate Aktivität als Standard
    
    // Auch wenn nicht alle realen Werte gesetzt sind, können wir mit Standardannahmen rechnen
    // Dies gibt einen besseren Ausgangswert als die statischen 2000 kcal
    
    // Alter aus dem Geburtsdatum berechnen (falls gesetzt)
    // Basis-Kalorienverbrauch mit Harris-Benedict-Formel berechnen
    let bmr = 0;
    if (gender === 'male') {
      // Männer: BMR = 66.5 + (13.75 * kg) + (5.003 * cm) - (6.75 * Alter)
      bmr = 66.5 + (13.75 * profile.weight) + (5.003 * profile.height) - (6.75 * calculateAge(birthDate));
    } else {
      // Frauen: BMR = 655.1 + (9.563 * kg) + (1.850 * cm) - (4.676 * Alter)
      bmr = 655.1 + (9.563 * profile.weight) + (1.850 * profile.height) - (4.676 * calculateAge(birthDate));
    }
    
    // Multiplikator basierend auf Aktivitätsstufe
    let activityMultiplier = 1.2; // Sedentär
    switch(activityLevel) {
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
    
    // Berechne basierend auf dem Ziel
    switch (goalId) {
      case 'lose_weight':
      case 'weight_loss':
      case 'abnehmen':
        // Abnehmen: TDEE - 500 Kalorien
        dailyCalories = maintenanceCalories - 500;
        protein = Math.round(profile.weight * 1.8); // Mehr Protein zur Sättigung
        carbs = Math.round((dailyCalories * 0.35) / 4);
        fat = Math.round((dailyCalories * 0.30) / 9);
        break;
      case 'lose_moderate':
        // Moderates Abnehmen: TDEE - 300 Kalorien
        dailyCalories = maintenanceCalories - 300;
        protein = Math.round(profile.weight * 1.6);
        carbs = Math.round((dailyCalories * 0.40) / 4);
        fat = Math.round((dailyCalories * 0.30) / 9);
        break;
      case 'lose_fast':
        // Schnelles Abnehmen: TDEE - 500 Kalorien
        dailyCalories = maintenanceCalories - 500;
        protein = Math.round(profile.weight * 2.0);
        carbs = Math.round((dailyCalories * 0.30) / 4);
        fat = Math.round((dailyCalories * 0.25) / 9);
        break;
      case 'gain_weight':
      case 'weight_gain':
      case 'zunehmen':
      case 'gain':
        // Zunehmen: TDEE + 400 Kalorien
        dailyCalories = maintenanceCalories + 400;
        protein = Math.round(profile.weight * 1.6);
        carbs = Math.round((dailyCalories * 0.50) / 4);
        fat = Math.round((dailyCalories * 0.25) / 9);
        break;
      case 'maintain_weight':
      case 'maintain':
      case 'halten':
      default:
        // Halten: TDEE (Maintenance)
        dailyCalories = maintenanceCalories;
        protein = Math.round(profile.weight * 1.4);
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
  
  // Wir benötigen keinen useEffect für die Slider-Werte mehr, da wir direkt mit dem profile-Objekt arbeiten
  
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
        
        // Nach dem Laden der Profildaten eine initiale Berechnung mit Standardwerten durchführen
        // und auch ein empfohlenes Ziel auswählen
        setTimeout(() => {
          // Empfohlenes Ziel basierend auf BMI berechnen
          calculateRecommendedGoals();
          // Setze das empfohlene Ziel als ausgewähltes Ziel, falls keines ausgewählt ist
          if (!selectedGoalId) {
            const recommendedGoal = calculateRecommendedGoals();
            setSelectedGoalId(recommendedGoal || 'maintain');
            calculateGoalValues(recommendedGoal || 'maintain');
          } else {
            calculateGoalValues(selectedGoalId);
          }
        }, 100);
      } catch (error) {
        console.error('Error loading profile during intro:', error);
        // Selbst bei Fehlern beim Laden des Profils können wir eine Berechnung mit Standardwerten durchführen
        calculateGoalValues('maintain');
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
  
  // Funktion zum Prüfen, ob der aktuelle Schritt alle erforderlichen Werte hat
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0: // Name
        return !!profile.name && profile.name.trim().length > 0;
      case 1: // Geschlecht
        return !!profile.gender; // Muss aktiv ausgewählt werden
      case 2: // Geburtsdatum
        return !!birthDate && calculateAge(birthDate) > 0 && calculateAge(birthDate) < 120;
      case 3: // Gewicht & Größe
        return !!profile.weight && profile.weight > 30 && profile.weight < 300 && 
               !!profile.height && profile.height > 100 && profile.height < 250;
      case 4: // Aktivitätslevel
        return !!profile.activityLevel;
      case 5: // Ziel
        return !!selectedGoalId;
      default:
        return true;
    }
  };

  // Funktion zum Umschalten zwischen den Schritten
  const goToNextStep = () => {
    // Nur weitergehen, wenn der aktuelle Schritt gültig ist
    if (!isStepValid()) {
      Alert.alert(
        'Unvollständige Daten',
        'Bitte fülle alle erforderlichen Felder korrekt aus, bevor du fortfährst.'
      );
      return;
    }
    // Setze Animationsrichtung auf vorwärts
    setAnimationDirection('forward');
    
    if (currentStep < 6) {
      // Kurze Verzögerung für sanften Übergang
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        if (currentStep === 3) {
          const recommendedGoalId = calculateRecommendedGoals();
          if (!selectedGoalId) {
            setSelectedGoalId(recommendedGoalId);
          }
        }
      }, 50);
    } else {
      setIsCompleting(true);
      // Erst nach der Zusammenfassung: Profil aktualisieren und zur Hauptseite navigieren
      setIsCompleting(true); // Ladezustand aktivieren
      updateProfile();
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      // Setze Animationsrichtung auf rückwärts
      setAnimationDirection('backward');
      // Kurze Verzögerung für sanften Übergang
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 50);
    }
  };
  
  // Rendert den aktuellen Schritt basierend auf currentStep
  const renderStep = () => {
    switch (currentStep) {
      case 0: // Willkommen & Name
        return (
          <View style={styles.stepContainer}>
            <User size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={styles.title}>Willkommen!</Text>
            <Text style={styles.description}>
              Lass uns dein Profil einrichten, damit wir dir personalisierte Ernährungsempfehlungen geben können.
            </Text>
            
            <Text style={styles.label}>Wie lautet dein Name?</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              placeholder="Dein Name"
              placeholderTextColor={theme.colors.textLight}
              enterKeyHint='done'
              autoCapitalize='words'
            />
          </View>
        );
        
      case 1: // Geschlecht
        return (
          <View style={styles.stepContainer}>
            <View>
              <VenusAndMars size={48} color={theme.colors.primary} style={styles.stepIcon} />
            </View>
            <Text style={styles.title}>Dein Geschlecht</Text>
            <Text style={styles.description}>
              Diese Information hilft uns, deinen Grundumsatz präziser zu berechnen.
            </Text>
            
            <View style={[styles.pickerContainer, {
              // Mehr Höhe für iOS-Picker, damit Werte in der Vorschau sichtbar sind
              height: Platform.OS === 'ios' ? 56 * 1.5 : 50,
              justifyContent: 'center'
            }]}>
              <Picker
                selectedValue={profile.gender || ''}
                onValueChange={(value) => {
                  const genderValue = typeof value === 'string' ? value : String(value);
                  if (genderValue === '') {
                    // Wenn der Platzhalter gewählt wird, setzen wir gender auf undefined
                    setProfile(prev => ({ ...prev, gender: undefined }));
                  } else {
                    setProfile(prev => ({ ...prev, gender: genderValue as 'male' | 'female' | 'divers' }));
                  }
                }}
                style={{
                  width: '100%',
                  color: theme.colors.text,
                  // Zusätzliche Stile für bessere Sichtbarkeit auf iOS
                  height: Platform.OS === 'ios' ? 56 * 2 : undefined,
                }}
                itemStyle={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  // Größere Schrift für iOS
                  height: Platform.OS === 'ios' ? 56 * 2 : undefined
                }}
                mode="dropdown"
              >
                <Picker.Item label="Männlich" value="male" />
                <Picker.Item label="Bitte wähle dein Geschlecht" value="" />
                <Picker.Item label="Weiblich" value="female" />
              </Picker>
            </View>
          </View>
        );
        
      case 2: // Alter
        return (
          <View style={styles.stepContainer}>
            <Calendar size={48} color={theme.colors.primary} style={styles.stepIcon} />
            <Text style={styles.title}>Dein Geburtsdatum</Text>
            <Text style={styles.description}>
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
              maxDate={new Date(new Date().getFullYear() -12, 0, 0)}
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
            <Text style={styles.title}>Deine Körperdaten</Text>
            <Text style={styles.description}>
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
                setProfile(prev => {
                  const updatedProfile = {
                    ...prev,
                    weight: value
                  };
                  // Nach dem Update des Profils Ziele neu berechnen
                  setTimeout(() => calculateGoalValues('maintain'), 0);
                  return updatedProfile;
                });
                // State-Variable für UI synchron halten
                setWeightValue(value);
              }}
              label="Gewicht"
              unit="Kilogramm"
              placeholder="70"
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
                setProfile(prev => {
                  const updatedProfile = {
                    ...prev,
                    height: value
                  };
                  // Nach dem Update des Profils Ziele neu berechnen
                  setTimeout(() => calculateGoalValues('maintain'), 0);
                  return updatedProfile;
                });
                // State-Variable für UI synchron halten
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
            <Text style={styles.title}>Dein Aktivitätsniveau</Text>
            <Text style={styles.description}>
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
                <Text style={styles.activityTitle}>Kaum aktiv</Text>
                <Text style={styles.activityDescription}>
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
                <Text style={styles.activityTitle}>Leicht aktiv</Text>
                <Text style={styles.activityDescription}>
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
                <Text style={styles.activityTitle}>Mäßig aktiv</Text>
                <Text style={styles.activityDescription}>
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
                <Text style={styles.activityTitle}>Sehr aktiv</Text>
                <Text style={styles.activityDescription}>
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
              <BicepsFlexed size={30} color={theme.colors.primary} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>Extrem aktiv</Text>
                <Text style={styles.activityDescription}>
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
            <Text style={styles.title}>Dein Ziel</Text>
            <Text style={styles.description}>
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
                  <ChevronsUp size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>Gesunde Gewichtszunahme</Text>
                    <Text style={styles.goalDescription}>
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
                  <Scale size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>Gewicht halten</Text>
                    <Text style={styles.goalDescription}>
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
                  <ArrowBigDown size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>Moderate Gewichtsreduktion</Text>
                    <Text style={styles.goalDescription}>
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
                  <ChevronsDown size={30} color={theme.colors.primary} />
                  <View style={styles.goalText}>
                    <Text style={styles.goalTitle}>Gesunde Gewichtsreduktion</Text>
                    <Text style={styles.goalDescription}>
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
            <Text style={styles.title}>Zusammenfassung</Text>
            <Text style={styles.description}>
              Hier ist eine Übersicht deiner Daten. Alles kann später noch geändert werden.
            </Text>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>{profile.name || '-'}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Geschlecht:</Text>
                <Text style={styles.summaryValue}>
                  {/* Immer einen Wert anzeigen, Standardwert ist 'male' */}
                  {(profile.gender || 'male') === 'male' ? 'Männlich' : 
                   profile.gender === 'female' ? 'Weiblich' : 
                   profile.gender === 'divers' ? 'Divers' : 'Männlich'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Alter:</Text>
                <Text style={styles.summaryValue}>
                  {profile.age || (birthDate ? calculateAge(birthDate) : '-')}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gewicht:</Text>
                <Text style={styles.summaryValue}>
                  {profile.weight ? `${profile.weight} kg` : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Größe:</Text>
                <Text style={styles.summaryValue}>
                  {profile.height ? `${profile.height} cm` : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Aktivitätslevel:</Text>
                <Text style={styles.summaryValue}>
                  {profile.activityLevel === ActivityLevel.Sedentary ? 'Kaum aktiv' : 
                   profile.activityLevel === ActivityLevel.LightlyActive ? 'Leicht aktiv' : 
                   profile.activityLevel === ActivityLevel.ModeratelyActive ? 'Mäßig aktiv' : 
                   profile.activityLevel === ActivityLevel.VeryActive ? 'Sehr aktiv' : 
                   profile.activityLevel === ActivityLevel.ExtremelyActive ? 'Extrem aktiv' : '-'}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ziel:</Text>
                <Text style={styles.summaryValue}>
                  {selectedGoalId === 'gain' ? 'Gesunde Gewichtszunahme' : 
                   selectedGoalId === 'maintain' ? 'Gewicht halten' : 
                   selectedGoalId === 'lose_moderate' ? 'Moderate Gewichtsreduktion' : 
                   selectedGoalId === 'lose_fast' ? 'Gesunde Gewichtsreduktion' : '-'}
                </Text>
              </View>
            </View>
            
            {/* Informationstext zur Kalorienberechnung */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Wir berechnen deinen Kalorienbedarf mit der Harris-Benedict-Formel und passen ihn an dein Aktivitätslevel und Ziel an.
              </Text>
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
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      {/* DatePicker-Modal wurde in die DatePicker-Komponente verschoben */}
      
      {/* Fortschrittsanzeige - animiert */}
      <View style={styles.progressContainer}>
        {Array(7).fill(0).map((_, index) => (
          <Animated.View 
            key={index}
            style={[
              styles.progressDot,
              { 
                backgroundColor: index <= currentStep ? theme.colors.primary : theme.colors.border
              }
            ]}
            layout={Layout.duration(300).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
          >
            {index === currentStep && (
              <Animated.View 
                style={{
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  opacity: 0.5
                }}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              />
            )}
          </Animated.View>
        ))}
      </View>
      
      {/* Hauptinhalt im animierten ScrollView */}
      <Animated.ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Aktueller Schritt mit Animation */}
        <Animated.View key={`step-${currentStep}`} 
          entering={animationDirection === 'forward' ? SlideInRight.duration(300).easing(Easing.out(Easing.cubic)) : FadeIn.duration(300)}
          exiting={animationDirection === 'forward' ? FadeOut.duration(300) : SlideOutLeft.duration(300).easing(Easing.out(Easing.cubic))}
          layout={Layout.duration(300)}
        >
          {renderStep()}
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Navigation - animiert unten */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.leftButtonContainer}
          >
            <TouchableOpacity 
              style={[styles.navButton, styles.backButton]}
              onPress={() => { goToPreviousStep(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <ArrowLeft size={20} color={theme.colors.text} />
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Zurück</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={styles.leftButtonContainer}
          >
            <TouchableOpacity 
              style={[styles.navButton, styles.backButton]}
              onPress={cancelOnboarding}
            >
              <X size={20} color={theme.colors.text} />
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Abbrechen</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.rightButtonContainer}
        >
          <TouchableOpacity 
            style={[
              styles.navButton, 
              styles.nextButton, 
              { 
                backgroundColor: isStepValid() ? theme.colors.primary : theme.colors.disabled,
                opacity: isStepValid() ? 1 : 0.7,
              }
            ]}
            onPress={() => { 
              goToNextStep();
              {currentStep === 6 ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}
            }}
            disabled={!isStepValid()}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {currentStep === 6 ? 'Fertig' : 'Weiter'}
            </Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default IntroScreen;
