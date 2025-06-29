import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Platform, ActivityIndicator, StatusBar } from 'react-native';
import * as Animatable from 'react-native-animatable';
import SliderWithInput from '../components/ui/slider-with-input';
import { ArrowBigDown, ArrowBigDownDash, ArrowBigUpDash, ArrowDown, ArrowDownWideNarrow, ArrowUp, ArrowUpWideNarrow, Award, Bed, BedDouble, BicepsFlexed, Bike, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Cog, Dumbbell, Footprints, Scale, Star, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileTabScreenProps } from '../types/navigation-types';
import { ActivityLevel, UserProfile, UserGoal, GoalType } from '../types';
import { fetchUserProfile, updateUserProfile, fetchGoalTypes, fetchUserGoals, createOrUpdateUserGoal } from '../services/profile-api';
import { requestHealthPermissions } from '../services/health-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatToLocalISODate, formatDateForDisplay, getLocalDateComponents } from '../utils/date-utils';
import { createProfileStyles } from '../styles/screens/profile-styles';
import * as Haptics from 'expo-haptics';
import { DatePicker } from '../components/ui/date-picker';
import { LinearGradient } from 'expo-linear-gradient';

function ProfileScreen({ navigation }: ProfileTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets for handling notches and navigation bars
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createProfileStyles(theme);
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
  const [animationKey, setAnimationKey] = useState(0);
  const [isScreenVisible, setIsScreenVisible] = useState(false); // Start hidden until first focus
  const [hasBeenFocused, setHasBeenFocused] = useState(false); // Track if screen was ever focused
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(0);
  
  // State für Slider-Werte
  const [weightSliderValue, setWeightSliderValue] = useState(70);
  const [heightSliderValue, setHeightSliderValue] = useState(170);
  const [waterSliderValue, setWaterSliderValue] = useState<number>(2500);
  const [weightInputText, setWeightInputText] = useState<string>('');
  const [birthDate, setBirthDate] = useState<Date>(new Date(new Date().getFullYear() - 25, 0, 1)); // Default 25 Jahre alt
  // Removed date picker modal state - now handled in DatePicker component
  
  // State für ausgeklapptes Ziel-Menü und ausgewähltes Ziel
  const [goalsExpanded, setGoalsExpanded] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null); // null = empfohlenes Ziel
  
  // State für verfügbare Zieltypen und aktuelle Benutzerziele
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  
  // State für live berechnete empfohlene Werte (nur für Anzeige)
  const [calculatedRecommendations, setCalculatedRecommendations] = useState({
    dailyCalories: 2000,
    dailyProtein: 50,
    dailyCarbs: 250,
    dailyFat: 70,
    dailyWater: 2500
  });
  
    // Aktualisiert das Geburtsdatum im Profil
  const updateBirthDate = (date: Date) => {
    // Create a date string in YYYY-MM-DD format that preserves the exact date
    // without timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log(`Selected date: ${date.toDateString()}, formatted as: ${formattedDate}`);
    
    // Aktualisiere sowohl Geburtsdatum als auch Alter im Profil
    handleTextChange('birthDate', formattedDate);
    
    // Alter wird basierend auf Geburtsdatum berechnet
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    handleTextChange('age', age.toString());
    
    // Aktualisiere den lokalen State
    setBirthDate(date);
  };

  // Create a function to load profile data that can be called when needed
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      console.log('Loading profile data...');
      
      // Lade Benutzerprofil
      const savedProfile = await fetchUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
        
        // Initialisiere auch die Slider-Werte und das Geburtsdatum, wenn das Profil geladen wird
        if (savedProfile.weight) {
          setWeightSliderValue(savedProfile.weight);
          // Initialisiere auch den Text-Input für das Gewicht
          setWeightInputText(savedProfile.weight.toString());
        }
        if (savedProfile.height) setHeightSliderValue(savedProfile.height);
        if (savedProfile.goals && savedProfile.goals.dailyWater) setWaterSliderValue(savedProfile.goals.dailyWater);
        
        // Wenn ein Geburtsdatum existiert, setze es; andernfalls berechne es aus dem Alter (wenn vorhanden)
        if (savedProfile.birthDate) {
          // Format YYYY-MM-DD, parse as local date components to avoid timezone issues
          const parts = savedProfile.birthDate.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in Date constructor
            const day = parseInt(parts[2], 10);
            setBirthDate(new Date(year, month, day));
          } else {
            // Fallback or error handling if date format is unexpected, try direct parsing
            console.warn('Unexpected birthDate format, attempting direct parse:', savedProfile.birthDate);
            setBirthDate(new Date(savedProfile.birthDate)); 
          }
        } else if (savedProfile.age) {
          // Setze ein ungefähres Geburtsdatum basierend auf dem vorhandenen Alter
          const approximateBirthYear = new Date().getFullYear() - savedProfile.age;
          setBirthDate(new Date(approximateBirthYear, 0, 1)); // 1. Januar des Geburtsjahres
        }
      }
      
      // Lade verfügbare Zieltypen
      const availableGoalTypes = await fetchGoalTypes();
      setGoalTypes(availableGoalTypes);
      
      // Lade aktuelle Benutzerziele
      const currentUserGoals = await fetchUserGoals();
      setUserGoals(currentUserGoals);

      // Determine and set the activeGoalId AFTER fetching currentUserGoals
      let activeGoalIdToSet: string | null = null;
      if (currentUserGoals && currentUserGoals.length > 0 && currentUserGoals[0].goalTypeId) {
        // Assuming user has at most one goal, take its goalTypeId
        activeGoalIdToSet = currentUserGoals[0].goalTypeId;
      } else {
      }
      
      setSelectedGoalId(activeGoalIdToSet);
      
      // Check health permissions
      const hasPermission = await requestHealthPermissions();
      setHealthPermission(hasPermission);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadProfile();
  }, []);
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      
      const currentTime = Date.now();
      const timeSinceLastFocus = currentTime - lastFocusTime.current;
      
      // Mark screen as focused at least once
      if (!hasBeenFocused) {
        setHasBeenFocused(true);
      }
      
      // Only trigger animations on tab navigation (quick successive focus events)
      // Stack navigation typically has longer delays between focus events
      if (!isInitialMount.current && timeSinceLastFocus < 1000) {
        // This is likely a tab navigation - hide content briefly, then show with animation
        setIsScreenVisible(false);
        const timer = setTimeout(() => {
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }, 50);
        
        lastFocusTime.current = currentTime;
        return () => {
          clearTimeout(timer);
        };
      } else {
        // First mount or stack navigation return - no animation disruption
        if (isInitialMount.current) {
          isInitialMount.current = false;
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }
        lastFocusTime.current = currentTime;
      }
      
      return () => {};
    }, [hasBeenFocused])
  );
  
  // Berechne und setze Ernährungsempfehlungen wenn alle benötigten Daten vorhanden sind
  useEffect(() => {
    // Berechne empfohlene Werte für die Anzeige
    if (profile.weight && profile.height && profile.gender && profile.activityLevel) {
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
      
      // Täglicher Kalorienbedarf zum Gewicht halten (TDEE)
      const maintenanceCalories = Math.round(bmr * activityMultiplier);
      
      let dailyCalories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;
      
      // Berechne basierend auf dem ausgewählten Ziel, NICHT basierend auf BMI
      if (selectedGoalId && goalTypes.length > 0) {
        const currentGoalType = goalTypes.find(gt => gt.id === selectedGoalId);
        
        if (currentGoalType && !currentGoalType.isCustom) {
          // Ziel-basierte Berechnung für vordefinierte Ziele
          switch (selectedGoalId) {
            case 'lose_weight':
            case 'weight_loss':
            case 'abnehmen':
              // Aggressives Abnehmen: TDEE - 500 Kalorien
              dailyCalories = maintenanceCalories - 500;
              protein = Math.round((profile.weight || 70) * 1.8); // Mehr Protein zur Sättigung
              carbs = Math.round((dailyCalories * 0.35) / 4); // 35% Kohlenhydrate
              fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
              break;
            case 'lose_moderate':
              // Moderates Abnehmen: TDEE - 300 Kalorien
              dailyCalories = maintenanceCalories - 300;
              protein = Math.round((profile.weight || 70) * 1.6); // Moderater Protein-Bedarf
              carbs = Math.round((dailyCalories * 0.40) / 4); // 40% Kohlenhydrate
              fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
              break;
            case 'lose_fast':
              // Schnelles Abnehmen: TDEE - 500 Kalorien
              dailyCalories = maintenanceCalories - 500;
              protein = Math.round((profile.weight || 70) * 2.0); // Mehr Protein zur Sättigung
              carbs = Math.round((dailyCalories * 0.30) / 4); // 30% Kohlenhydrate
              fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
              break;
            case 'gain_weight':
            case 'weight_gain':
            case 'zunehmen':
            case 'muscle_gain':
            case 'muskelaufbau':
            case 'gain':           // Gesunde Gewichtszunahme
              // Zunehmen/Muskelaufbau: TDEE + 400 Kalorien
              dailyCalories = maintenanceCalories + 400;
              protein = Math.round((profile.weight || 70) * 1.6); // Mehr Protein für Muskelaufbau
              carbs = Math.round((dailyCalories * 0.50) / 4); // 50% Kohlenhydrate
              fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
              break;
            case 'maintain_weight':
            case 'halten':
            case 'maintenance':
            case 'maintain':       // Gewicht halten
            default:
              // Halten: TDEE (Maintenance)
              dailyCalories = maintenanceCalories;
              protein = Math.round((profile.weight || 70) * 1.4);
              carbs = Math.round((dailyCalories * 0.45) / 4); // 45% Kohlenhydrate
              fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
              break;
          }
        } else if (currentGoalType && currentGoalType.isCustom) {
          // Custom Goal: Verwende gespeicherte Werte, keine Neuberechnung
          return;
        }
      } else {
        // Kein Ziel ausgewählt: BMI-basierte Empfehlung als Fallback
        const bmi = profile.weight / Math.pow(profile.height / 100, 2);
        
        if (bmi < 18.5) {
          // Untergewicht - Zunehmen empfehlen
          dailyCalories = maintenanceCalories + 300;
          protein = Math.round(profile.weight * 1.6);
          carbs = Math.round((dailyCalories * 0.50) / 4);
          fat = Math.round((dailyCalories * 0.25) / 9);
        } else if (bmi < 25) {
          // Normalgewicht - Halten empfehlen
          dailyCalories = maintenanceCalories;
          protein = Math.round(profile.weight * 1.4);
          carbs = Math.round((dailyCalories * 0.45) / 4);
          fat = Math.round((dailyCalories * 0.30) / 9);
        } else if (bmi < 30) {
          // Übergewicht - Leicht reduzieren empfehlen
          dailyCalories = maintenanceCalories - 300;
          protein = Math.round(profile.weight * 1.8);
          carbs = Math.round((dailyCalories * 0.35) / 4);
          fat = Math.round((dailyCalories * 0.30) / 9);
        } else {
          // Adipositas - Stärker reduzieren empfehlen
          dailyCalories = maintenanceCalories - 500;
          protein = Math.round(profile.weight * 2.0);
          carbs = Math.round((dailyCalories * 0.30) / 4);
          fat = Math.round((dailyCalories * 0.25) / 9);
        }
      }
      
      // Setze die berechneten Empfehlungen für die Anzeige
      // Behalte den benutzerdefinierten Wasserwert bei, wenn er bereits gesetzt wurde
      const calculatedValues = {
        dailyCalories: dailyCalories,
        dailyProtein: protein,
        dailyCarbs: carbs,
        dailyFat: fat,
        // Behalte den benutzerdefinierten Wasserwert bei oder setze den Standardwert
        dailyWater: profile.goals?.dailyWater || 2500
      };
      
      setCalculatedRecommendations(calculatedValues);
      
      // Überschreibe die gespeicherten Ziele NUR wenn:
      // 1. Kein Ziel ausgewählt ist (selectedGoalId === null) ODER
      // 2. Das ausgewählte Ziel custom ist UND wir keine gespeicherten Werte haben
      const shouldUpdateStoredGoals = !selectedGoalId || 
        (selectedGoalId && goalTypes.length > 0 && 
         goalTypes.find(gt => gt.id === selectedGoalId)?.isCustom);
      
      if (shouldUpdateStoredGoals) {
        setProfile(prevProfile => ({
          ...prevProfile,
          goals: calculatedValues
        }));
      }
    }
  }, [profile.weight, profile.height, profile.gender, profile.activityLevel, profile.age, selectedGoalId, goalTypes]);
  
  // Hilfsfunktion: Hole die anzuzeigenden Zielwerte
  const getDisplayGoals = () => {
    // Wenn ein non-custom Ziel ausgewählt ist, zeige live berechnete Werte
    if (selectedGoalId && goalTypes.length > 0) {
      const currentGoalType = goalTypes.find(gt => gt.id === selectedGoalId);
      if (currentGoalType && !currentGoalType.isCustom) {
        // Für non-custom Ziele: live berechnete Werte anzeigen
        return calculatedRecommendations;
      }
    }
    
    // Für custom Ziele oder kein ausgewähltes Ziel: gespeicherte Werte anzeigen
    return profile.goals;
  };

  // Handle text input changes
  const handleTextChange = (field: string, value: string) => {
    // Handle nested fields for goals
    if (field.startsWith('goals.')) {
      const goalField = field.split('.')[1];
      
      // Für Wasserkonsum immer Bearbeitung erlauben, unabhängig vom Zieltyp
      if (goalField === 'dailyWater') {
        // Stelle sicher, dass der Wert immer eine Zahl ist (oder undefined)
        const numericValue = value === '' ? undefined : Number(value);
        setProfile(prev => ({
          ...prev,
          goals: {
            ...prev.goals,
            [goalField]: numericValue,
          },
        }));
        return;
      }

      // Bei anderen Zielnährwerten nur bei Custom-Zielen Bearbeitung erlauben
      if (selectedGoalId && goalTypes.length > 0) {
        const currentGoalType = goalTypes.find(gt => gt.id === selectedGoalId);
        if (currentGoalType && !currentGoalType.isCustom) {
          // Non-custom Goal: Keine Bearbeitung erlaubt, return early
          return;
        }
      }
      
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
      } else if (field === 'weight') {
        // Gewicht immer als Zahl speichern, aber Komma-Eingabe vorher ermöglichen
        // Parse-Fehler bei der Umwandlung abfangen und Standardwert bei leerem Feld
        let numericValue = 0;
        
        if (value !== '') {
          // Replace all commas with dots to handle German number format
          const sanitizedValue = value.replace(/,/g, '.');
          numericValue = Number(sanitizedValue);
        }
        
        // Nur gültige Zahlen akzeptieren
        if (!isNaN(numericValue)) {
          setProfile(prev => ({
            ...prev,
            [field]: numericValue,
          }));
        }
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

  // Handle saving profile with improved error handling and data reload
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Basic validation
      if (!profile.name) {
        Alert.alert('Error', 'Please enter your name');
        setIsLoading(false);
        return;
      }
      
      console.log('Saving profile data...');
      
      // Geburtsdatum aufbereiten und Alter berechnen
      const birthDateObj = new Date(birthDate); // Ensure birthDate is a Date object
      const year = birthDateObj.getFullYear();
      const month = String(birthDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(birthDateObj.getDate()).padStart(2, '0');
      const formattedBirthDate = `${year}-${month}-${day}`;
      // Calculate age directly since calculateAge function was moved to DatePicker component
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDateObj.getFullYear();
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        calculatedAge--;
      }

      const updatedProfileData = {
        ...profile,
        name: profile.name,
        birthDate: formattedBirthDate,
        age: calculatedAge,
        height: Number(profile.height),
        weight: Number(profile.weight),
        gender: profile.gender,
        activityLevel: profile.activityLevel,
        activeGoalTypeId: selectedGoalId, // Persist the currently selected goal ID
        // Ensure goals sub-object is structured as expected by the backend if it's part of updateUserProfile
        // If goals are handled entirely by createOrUpdateUserGoal, this might not be needed here or structured differently.
        // For now, assuming profile.goals contains the values to be saved with the main profile if applicable.
        goals: {
            dailyCalories: profile.goals.dailyCalories,
            dailyProtein: profile.goals.dailyProtein,
            dailyCarbs: profile.goals.dailyCarbs,
            dailyFat: profile.goals.dailyFat,
            // Direkt den aktuellen Slider-Wert verwenden für das Wasserziel
            dailyWater: waterSliderValue,
        }
      };

      const response = await updateUserProfile(updatedProfileData);

      // Separate logic for saving/updating user goals via createOrUpdateUserGoal
      try {
        let goalTypeId: string | undefined = undefined;
        let isCustomGoal = false;

        if (selectedGoalId && goalTypes.length > 0) {
          const selectedType = goalTypes.find(type => type.id === selectedGoalId);
          if (selectedType) {
            goalTypeId = selectedType.id;
            isCustomGoal = selectedType.isCustom;
          }
        } else {
          isCustomGoal = true;
          const customType = goalTypes.find(type => type.id === 'custom');
          if (customType) {
            goalTypeId = customType.id;
          }
        }

        const userGoalPayload: UserGoal = {
          goalTypeId,
          isCustom: isCustomGoal,
          // Verwende die korrekten Werte basierend auf dem Zieltyp
          dailyCalories: getDisplayGoals().dailyCalories,
          dailyProtein: getDisplayGoals().dailyProtein || 0,
          dailyCarbs: getDisplayGoals().dailyCarbs || 0,
          dailyFat: getDisplayGoals().dailyFat || 0,
          // Direkt den Slider-Wert für das Wasserziel verwenden, unabhängig von getDisplayGoals()
          dailyWater: waterSliderValue
        };
        
        const savedGoalResponse = await createOrUpdateUserGoal(userGoalPayload);
        if (savedGoalResponse && savedGoalResponse.id) {
        } else {
        }
      } catch (goalError) {
        console.error('Error saving user goals to new API (createOrUpdateUserGoal):', goalError);
      }
      
      // Reload profile data to ensure everything is in sync
      await loadProfile();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert('Success', 'Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

    // Removed date picker modal - now handled in DatePicker component

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
        <Text style={[styles.headerText, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary }]}>
          Profil
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: theme.spacing.m,
          paddingTop: theme.spacing.m,
          paddingBottom: Math.max(theme.spacing.m, insets.bottom) // Entweder Standard-Padding oder Safe Area
        }}
      >
        {isScreenVisible && (
          <>
          <Animatable.View 
            key={`section-title-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={50}
          >
            <Text style={styles.sectionTitle}>
              Persönliche Daten
            </Text>
          </Animatable.View>

          <Animatable.View 
            key={`section-description-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={100}
          >
            <Text style={styles.sectionDescription}>
              Persönliche Daten und Fitnessprofile
            </Text>
          </Animatable.View>

          {/* Birth Date (statt Alter) */}
          <Animatable.View 
            key={`birth-date-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={150}
          >
            <DatePicker 
        label="Geburtsdatum"
        value={birthDate}
        onValueChange={updateBirthDate}
        ageLabel={true}
        customButtonText="Ändern"
        customModalTitle="Geburtsdatum auswählen"
            />
          </Animatable.View>

          {/* Gewicht mit wiederverwendbarer SliderWithInput-Komponente */}
          <Animatable.View 
            key={`weight-slider-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={200}
          >
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
          </Animatable.View>
      
          {/* Körpergröße mit wiederverwendbarer SliderWithInput-Komponente */}
          <Animatable.View 
            key={`height-slider-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={250}
          >
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
          </Animatable.View>
      
          {/* BMI Indikator */}
          <Animatable.View 
            key={`bmi-indicator-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={300}
          >
            <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.m,
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
        }}>
          <Text style={{
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.m,
          }}>
            BMI
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
          {/* BMI Farbskala mit Verlauf - Expo Mesh Gradient */}
          <View style={{
            position: 'absolute',
            top: 10, // Marker hat 28px Höhe, positioniere die Skala entsprechend
            left: 0,
            right: 0,
            height: 20,
            borderRadius: theme.borderRadius.small,
            overflow: 'hidden'
          }}>
            <LinearGradient
              colors={[
                '#3F51B5', // Dunkelblau - sehr starkes Untergewicht (BMI < 16)
                '#2196F3', // Blau - starkes Untergewicht (BMI 16-17)
                '#03A9F4', // Hellblau - leichtes Untergewicht (BMI 17-18.5)
                '#4CAF50', // Grün - Normalgewicht optimal (BMI 18.5-22)
                '#8BC34A', // Hellgrün - Normalgewicht oberer Bereich (BMI 22-25)
                '#CDDC39', // Gelbgrün - Übergang zu Übergewicht (BMI 25-27)
                '#FFEB3B', // Gelb - leichtes Übergewicht (BMI 27-30)
                '#FFC107', // Gelb-Orange - Adipositas Klasse I (BMI 30-35)
                '#FF9800', // Orange - Adipositas Klasse II (BMI 35-40)
                '#FF5722', // Dunkelorange - Übergang zu schwerer Adipositas
                '#F44336', // Rot - schwere Adipositas (BMI > 40)
                '#D32F2F'  // Dunkelrot - sehr schwere Adipositas (BMI > 45)
              ]}
              // Positionierung basierend auf den offiziellen BMI-Kategorien nach WHO
              locations={[
                0.00, // BMI < 16 (sehr starkes Untergewicht)
                0.07, // BMI 16-17 (starkes Untergewicht)
                0.14, // BMI 17-18.5 (leichtes Untergewicht)
                0.20, // BMI 18.5-22 (optimaler Bereich)
                0.33, // BMI 22-25 (normaler Bereich, oberer Teil)
                0.40, // BMI 25-27 (leicht übergewichtig)
                0.50, // BMI 27-30 (übergewichtig)
                0.60, // BMI 30-35 (Adipositas Klasse I)
                0.75, // BMI 35-40 (Adipositas Klasse II)
                0.85, // BMI 40-45 (schwere Adipositas)
                0.92, // BMI > 45 (sehr schwere Adipositas)
                1.00  // BMI > 50 (extrem schwere Adipositas)
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: theme.borderRadius.small
              }}
            />
          </View>
          
          {/* BMI-Marker - mit verbesserter Skalierung */}
          {profile.weight && profile.height && (() => {
            // BMI berechnen
            const bmi = profile.weight / Math.pow(profile.height / 100, 2);
            
            // BMI-Bereich definieren mit Randbereichsanpassung
            const absoluteMinBmi = 15; // Absoluter Mindestwert
            const absoluteMaxBmi = 40; // Absoluter Höchstwert
            
            // Wichtige BMI-Grenzen für die Darstellung
            const underweightBmi = 18.5; // Grenze Untergewicht/Normal
            const normalBmi = 25;      // Grenze Normal/Übergewicht
            const overweightBmi = 30;    // Grenze Übergewicht/Adipositas
            
            // Begrenze den BMI auf den darstellbaren Bereich
            const clampedBmi = Math.max(absoluteMinBmi, Math.min(absoluteMaxBmi, bmi));
            
            // Verbesserte Berechnung mit Fokus auf die relevanten Bereiche
            let percentPosition;
            
            // Zuordnung der BMI-Bereiche zu prozentualen Positionen auf der Anzeige
            if (clampedBmi < underweightBmi) {
              // Bereich: 15-18.5 BMI (Untergewicht)
              const bmiRange = underweightBmi - absoluteMinBmi;
              const positionRange = 20; // 0-20% der Anzeige für Untergewicht
              percentPosition = ((clampedBmi - absoluteMinBmi) / bmiRange) * positionRange;
            } 
            else if (clampedBmi < normalBmi) {
              // Bereich: 18.5-25 BMI (Normalgewicht)
              const bmiRange = normalBmi - underweightBmi;
              const positionRange = 30; // 20-50% der Anzeige für Normalgewicht
              percentPosition = 20 + ((clampedBmi - underweightBmi) / bmiRange) * positionRange;
            } 
            else if (clampedBmi < overweightBmi) {
              // Bereich: 25-30 BMI (Übergewicht)
              const bmiRange = overweightBmi - normalBmi;
              const positionRange = 25; // 50-75% der Anzeige für Übergewicht
              percentPosition = 50 + ((clampedBmi - normalBmi) / bmiRange) * positionRange;
            } 
            else {
              // Bereich: 30-40 BMI (Adipositas)
              const bmiRange = absoluteMaxBmi - overweightBmi;
              const positionRange = 25; // 75-100% der Anzeige für Adipositas
              percentPosition = 75 + ((clampedBmi - overweightBmi) / bmiRange) * positionRange;
            }
            
            // Sicherheitsrand für die Anzeige (verhindert, dass der Marker am Rand verschwindet)
            percentPosition = Math.max(2, Math.min(98, percentPosition));
            
            return (
              <View 
                style={{
                  position: 'absolute',
                  top: 6, // Vertikal zentriert relativ zur Skala (Skala y=10 bis y=30, Indikator y=6 bis y=34)
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
          </Animatable.View>
      
          {/* Gender Selection */}
          <Animatable.View 
            key={`gender-selection-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={350}
          >
            <View style={[styles.inputContainer, {
        flexDirection: 'column', 
        width: '100%',          
        padding: theme.spacing.m,
        marginTop: theme.spacing.s,
        marginBottom: theme.spacing.xl,
        borderRadius: theme.borderRadius.medium,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
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
            height: Platform.OS === 'ios' ? 56 * 1.5 : 50, // Reduzierte Höhe nach 8-Punkt-Grid (7*8=56)
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
                height: 56 * 2, // Passend zur Container-Höhe
              }}
              itemStyle={{
                fontSize: 16,
                height: 56 * 2, // Passend zur Container-Höhe
                fontWeight: 'bold',
                color: theme.colors.text
              }}
              // Dropdown-Modus für konsistentes Erscheinungsbild
              mode="dropdown"
            >
              <Picker.Item label="Männlich" value="male" />
              <Picker.Item label="Weiblich" value="female" />
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
          </Animatable.View>
      
          {/* Activity Level */}
          <Animatable.View 
            key={`activity-level-title-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={400}
          >
            <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
              Aktivitätsstufe
            </Text>
          </Animatable.View>
          <Animatable.View 
            key={`activity-level-description-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={450}
          >
            <Text style={[styles.sectionDescription, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              Wählen Sie Ihre typische Aktivitätsstufe, um Ihre Kalorienbedarf zu berechnen
            </Text>
          </Animatable.View>
      
          {/* Vertikales Layout für Aktivitätsstufen wie im Intro Screen */}
          <Animatable.View 
            key={`activity-level-buttons-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={500}
          >
            <View style={{ marginBottom: theme.spacing.m }}>
        {/* Sedentär Button */}
        <TouchableOpacity 
          style={{
            width: '100%',
            marginBottom: theme.spacing.xs,
            borderWidth: 1,
            borderColor: profile.activityLevel === ActivityLevel.Sedentary ? theme.colors.primary : theme.colors.border,
            backgroundColor: profile.activityLevel === ActivityLevel.Sedentary ? `${theme.colors.primary}20` : theme.colors.card,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleActivityChange(ActivityLevel.Sedentary)}
        >
          <BedDouble size={30} color={theme.colors.primary} />
          <View style={{ marginLeft: theme.spacing.m, flex: 1 }}>
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: profile.activityLevel === ActivityLevel.Sedentary ? theme.colors.primary : theme.colors.text
            }}>
              Kaum aktiv
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              Vorwiegend sitzende Tätigkeit, wenig Bewegung im Alltag
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Leicht aktiv Button */}
        <TouchableOpacity 
          style={{
            width: '100%',
            marginBottom: theme.spacing.xs,
            borderWidth: 1,
            borderColor: profile.activityLevel === ActivityLevel.LightlyActive ? theme.colors.primary : theme.colors.border,
            backgroundColor: profile.activityLevel === ActivityLevel.LightlyActive ? `${theme.colors.primary}20` : theme.colors.card,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleActivityChange(ActivityLevel.LightlyActive)}
        >
          <Footprints size={30} color={theme.colors.primary} />
          <View style={{ marginLeft: theme.spacing.m, flex: 1 }}>
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: profile.activityLevel === ActivityLevel.LightlyActive ? theme.colors.primary : theme.colors.text
            }}>
              Leicht aktiv
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              Stehende Tätigkeit, leichter Spaziergang oder 1-2x Sport pro Woche
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Mäßig aktiv Button */}
        <TouchableOpacity 
          style={{
            width: '100%',
            marginBottom: theme.spacing.xs,
            borderWidth: 1,
            borderColor: profile.activityLevel === ActivityLevel.ModeratelyActive ? theme.colors.primary : theme.colors.border,
            backgroundColor: profile.activityLevel === ActivityLevel.ModeratelyActive ? `${theme.colors.primary}20` : theme.colors.card,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleActivityChange(ActivityLevel.ModeratelyActive)}
        >
          <Bike size={30} color={theme.colors.primary} />
          <View style={{ marginLeft: theme.spacing.m, flex: 1 }}>
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: profile.activityLevel === ActivityLevel.ModeratelyActive ? theme.colors.primary : theme.colors.text
            }}>
              Mäßig aktiv
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              Regelmäßige körperliche Aktivität, 2-3x Sport pro Woche
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Sehr aktiv Button */}
        <TouchableOpacity 
          style={{
            width: '100%',
            marginBottom: theme.spacing.xs,
            borderWidth: 1,
            borderColor: profile.activityLevel === ActivityLevel.VeryActive ? theme.colors.primary : theme.colors.border,
            backgroundColor: profile.activityLevel === ActivityLevel.VeryActive ? `${theme.colors.primary}20` : theme.colors.card,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleActivityChange(ActivityLevel.VeryActive)}
        >
          <Dumbbell size={30} color={theme.colors.primary} />
          <View style={{ marginLeft: theme.spacing.m, flex: 1 }}>
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: profile.activityLevel === ActivityLevel.VeryActive ? theme.colors.primary : theme.colors.text
            }}>
              Sehr aktiv
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              Körperlich anstrengende Tätigkeit oder 4-5x Sport pro Woche
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Extrem aktiv Button */}
        <TouchableOpacity 
          style={{
            width: '100%',
            borderWidth: 1,
            borderColor: profile.activityLevel === ActivityLevel.ExtremelyActive ? theme.colors.primary : theme.colors.border,
            backgroundColor: profile.activityLevel === ActivityLevel.ExtremelyActive ? `${theme.colors.primary}20` : theme.colors.card,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => handleActivityChange(ActivityLevel.ExtremelyActive)}
        >
          <BicepsFlexed size={30} color={theme.colors.primary} />
          <View style={{ marginLeft: theme.spacing.m, flex: 1 }}>
            <Text style={{
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.m,
              color: profile.activityLevel === ActivityLevel.ExtremelyActive ? theme.colors.primary : theme.colors.text
            }}>
              Extrem aktiv
            </Text>
            <Text style={{
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.textLight
            }}>
              Sportler, tägliches intensives Training oder körperliche Arbeit
            </Text>
          </View>
        </TouchableOpacity>
            </View>
          </Animatable.View>
      
          {/* U00dcberschrift fu00fcr Ziele */}
          <Animatable.View 
            key={`goals-section-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={550}
          >
            <View style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.s }}>
              <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                Dein Ernährungsziel
              </Text>
              <Text style={[styles.sectionDescription, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, marginBottom: theme.spacing.m }]}>
                Wähle dein Ernährungsziel oder lege eigene Werte fest. Die Empfehlungen basieren auf deinen Körperdaten.
              </Text>
            </View>
          </Animatable.View>
        
          {profile.weight && profile.height && profile.gender && profile.activityLevel ? (
          <>
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
                  { id: 'gain', icon: <ChevronsUp size={theme.typography.fontSize.xxl} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />, title: 'Gesunde Gewichtszunahme', description: 'Für Personen mit Untergewicht oder Muskelaufbau-Ziel.' },
                  { id: 'maintain', icon: <Scale size={theme.typography.fontSize.xxl} color={theme.colors.primary} style={{ marginRight: theme.spacing.s }} />, title: 'Gewicht halten', description: 'Für Personen mit Normalgewicht, die ihre Fitness verbessern möchten.' },
                  { id: 'lose_moderate', icon: <ArrowBigDown size={theme.typography.fontSize.xxl} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />, title: 'Moderate Gewichtsreduktion', description: 'Für leichtes Übergewicht, langsamer aber nachhaltiger Gewichtsverlust.' },
                  { id: 'lose_fast', icon: <ChevronsDown size={theme.typography.fontSize.xxl} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />, title: 'Schneller Gewichtsverlust', description: 'Für stärkeres Übergewicht, schnellerer Gewichtsverlust.' },
                  { id: 'custom', icon: <Cog size={theme.typography.fontSize.xxl} color={theme.colors.primary} style={{ marginRight: theme.spacing.s }} />, title: 'Benutzerdefiniert', description: 'Eigene Ziele manuell festlegen.' },
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
                      borderRadius: theme.borderRadius.medium,
                      padding: theme.spacing.m,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.colors.primary,
                      marginBottom: theme.spacing.m,
                      shadowColor: theme.colors.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: theme.spacing.xs }}>
                      {activeGoal.icon}
                        <Text style={{
                          fontFamily: theme.typography.fontFamily.bold,
                          fontSize: theme.typography.fontSize.m,
                          color: theme.colors.text
                        }}>
                          {activeGoal.title}
                        </Text>
                        {activeGoal.id === recommendedGoal && (
                          <View style={{
                            backgroundColor: theme.colors.primary + '30',
                            paddingHorizontal: theme.spacing.s,
                            paddingVertical: 2,
                            borderRadius: theme.borderRadius.small,
                            marginLeft: theme.spacing.xs,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}>
                            <Star size={12} color={theme.colors.primary} style={{ marginRight: 3 }} />
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
                          <Text style={{ color: theme.colors.nutrition.calories, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {getDisplayGoals().dailyCalories}
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Protein</Text>
                          <Text style={{ color: theme.colors.nutrition.protein, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {getDisplayGoals().dailyProtein}g
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Kohlenhydrate</Text>
                          <Text style={{ color: theme.colors.nutrition.carbs, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {getDisplayGoals().dailyCarbs}g
                          </Text>
                        </View>
                        
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textLight, fontSize: theme.typography.fontSize.xs }}>Fett</Text>
                          <Text style={{ color: theme.colors.nutrition.fat, fontWeight: 'bold', fontSize: theme.typography.fontSize.m }}>
                            {getDisplayGoals().dailyFat}g
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
                              Kalorien: {getDisplayGoals().dailyCalories}
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={1200}
                              maximumValue={4000}
                              step={50}
                              value={getDisplayGoals().dailyCalories}
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
                              Protein: {getDisplayGoals().dailyProtein}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={30}
                              maximumValue={250}
                              step={5}
                              value={getDisplayGoals().dailyProtein}
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
                              Kohlenhydrate: {getDisplayGoals().dailyCarbs}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={50}
                              maximumValue={500}
                              step={10}
                              value={getDisplayGoals().dailyCarbs}
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
                              Fett: {getDisplayGoals().dailyFat}g
                            </Text>
                            <Slider
                              style={{ width: '100%', height: 40 }}
                              minimumValue={20}
                              maximumValue={200}
                              step={5}
                              value={getDisplayGoals().dailyFat}
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
                        marginBottom: goalsExpanded ? theme.spacing.s : theme.spacing.m,
                        shadowColor: theme.colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
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
                        {/* Akkordeon-Icon */}
                        {goalsExpanded ? (
                          <ChevronUp size={theme.typography.fontSize.xxl} color={theme.colors.primary} />
                        ) : (
                          <ChevronDown size={theme.typography.fontSize.xxl} color={theme.colors.primary} />
                        )}
                      </Text>
                    </TouchableOpacity>
                    
                    {/* Aufklappbare alternative Ziele */}
                    {goalsExpanded && (
                      <View style={{
                        backgroundColor: theme.colors.card,
                        borderRadius: theme.borderRadius.medium,
                        padding: theme.spacing.m,
                        marginBottom: theme.spacing.m,
                        shadowColor: theme.colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}>
                        <Text style={{
                          fontFamily: theme.typography.fontFamily.medium,
                          fontSize: theme.typography.fontSize.s,
                          color: theme.colors.textLight,
                          marginBottom: theme.spacing.s
                        }}>
                          Wähle ein alternatives Ziel:
                        </Text>
                        {goalTypes.filter(goalType => {
                            // If 'maintain' is the currently selected goal (either explicitly selectedGoalId === 'maintain' or implicitly selectedGoalId === null),
                            // do not show 'maintain' in the alternatives.
                            if ((selectedGoalId === 'maintain' || selectedGoalId === null) && goalType.id === 'maintain') {
                                return false;
                            }
                            // Otherwise, hide the goal if it's the currently selected one.
                            return goalType.id !== selectedGoalId;
                          }).map((goal, index, array) => (
                          <TouchableOpacity 
                            key={goal.id}
                            style={{
                              paddingVertical: theme.spacing.s,
                              borderTopWidth: index === 0 ? 0 : 1, // Keine Linie über dem ersten Element
                              borderTopColor: theme.colors.border + '40',
                              marginBottom: index === array.length - 1 ? 0 : theme.spacing.s, // Kein Abstand nach unten beim letzten Element
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
                                case 'lose_weight':
                                case 'weight_loss':
                                case 'abnehmen':
                                  // Aggressives Abnehmen: TDEE - 500 Kalorien
                                  dailyCalories = maintenanceCalories - 500;
                                  protein = Math.round((profile.weight || 70) * 1.8); // Mehr Protein zur Sättigung
                                  carbs = Math.round((dailyCalories * 0.35) / 4); // 35% Kohlenhydrate
                                  fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
                                  break;
                                  
                                case 'lose_moderate':
                                  // Moderates Abnehmen: TDEE - 300 Kalorien
                                  dailyCalories = maintenanceCalories - 300;
                                  protein = Math.round((profile.weight || 70) * 1.6); // Moderater Protein-Bedarf
                                  carbs = Math.round((dailyCalories * 0.40) / 4); // 40% Kohlenhydrate
                                  fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
                                  break;
                                  
                                case 'lose_fast':
                                  // Schnelles Abnehmen: TDEE - 500 Kalorien
                                  dailyCalories = maintenanceCalories - 500;
                                  protein = Math.round((profile.weight || 70) * 2.0); // Mehr Protein zur Sättigung
                                  carbs = Math.round((dailyCalories * 0.30) / 4); // 30% Kohlenhydrate
                                  fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
                                  break;
                                  
                                case 'gain_weight':
                                case 'weight_gain':
                                case 'zunehmen':
                                case 'muscle_gain':
                                case 'muskelaufbau':
                                case 'gain':           // Gesunde Gewichtszunahme
                                  // Zunehmen/Muskelaufbau: TDEE + 400 Kalorien
                                  dailyCalories = maintenanceCalories + 400;
                                  protein = Math.round((profile.weight || 70) * 1.6); // Mehr Protein für Muskelaufbau
                                  carbs = Math.round((dailyCalories * 0.50) / 4); // 50% Kohlenhydrate
                                  fat = Math.round((dailyCalories * 0.25) / 9); // 25% Fett
                                  break;
                                  
                                case 'maintain_weight':
                                case 'halten':
                                case 'maintenance':
                                case 'maintain':       // Gewicht halten
                                default:
                                  // Halten: TDEE (Maintenance)
                                  dailyCalories = maintenanceCalories;
                                  protein = Math.round((profile.weight || 70) * 1.4);
                                  carbs = Math.round((dailyCalories * 0.45) / 4); // 45% Kohlenhydrate
                                  fat = Math.round((dailyCalories * 0.30) / 9); // 30% Fett
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
                              {/* Icon für das jeweilige Ziel anzeigen */}
                              {(() => {
                                // Icon basierend auf goal.id auswählen (gleiche wie oben definiert)
                                const getIconForGoal = (goalId: string) => {
                                  const size = theme.typography.fontSize.xl;
                                  const color = theme.colors.primary;
                                  const style = { marginRight: theme.spacing.xs };
                                  
                                  switch(goalId) {
                                    case 'gain': return <ChevronsUp size={size} color={color} style={style} />;
                                    case 'maintain': return <Scale size={size} color={color} style={style} />;
                                    case 'lose_moderate': return <ArrowBigDown size={size} color={color} style={style} />;
                                    case 'lose_fast': return <ChevronsDown size={size} color={color} style={style} />;
                                    case 'custom': return <Cog size={size} color={color} style={style} />;
                                    default: return null;
                                  }
                                };
                                  
                                return getIconForGoal(goal.id);
                              })()}
                              <Text style={{
                                fontFamily: theme.typography.fontFamily.medium,
                                fontSize: theme.typography.fontSize.s,
                                color: theme.colors.text,
                              }}>
                                {goal.name} 
                              </Text>
                              {goal.id === recommendedGoal ? (
                                <View style={{
                                  backgroundColor: theme.colors.primary + '30',
                                  paddingHorizontal: theme.spacing.s,
                                  paddingVertical: 2,
                                  borderRadius: theme.borderRadius.small,
                                  marginLeft: theme.spacing.xs,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}>
                                  <Star size={12} color={theme.colors.primary} style={{ marginRight: 3 }} />
                                  <Text style={{
                                    fontSize: theme.typography.fontSize.xs,
                                    color: theme.colors.primary,
                                    fontFamily: theme.typography.fontFamily.medium
                                  }}>
                                    Empfohlen
                                  </Text>
                                </View>
                              ) : null}
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
          </>
        ) : (
          <Text style={{
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.s,
            color: theme.colors.error,
            fontStyle: 'italic',
            textAlign: 'center',
            borderColor: theme.colors.error,
            borderWidth: 1,
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
          marginBottom: theme.spacing.l,
          }}>
            Fülle alle notwendigen Daten (Gewicht, Größe, Geschlecht, Aktivitätsniveau) aus, 
            um eine auf dich zugeschnittene Empfehlung zu erhalten.
          </Text>
        )}

      {/* Wasserziel mit wiederverwendbarer SliderWithInput-Komponente */}
      <SliderWithInput
        minValue={500}
        maxValue={4000}
        middleValue={2000}
        step={100}
        decimalPlaces={0}
        allowDecimals={false}
        value={waterSliderValue}
        onValueChange={(value: number) => {
          // Beide States aktualisieren - sowohl Profil als auch den separaten Slider-Wert
          setWaterSliderValue(value);
          setProfile(prev => ({
            ...prev,
            goals: {
              ...prev.goals,
              dailyWater: value // Nur das Profil aktualisieren, nicht für die Speicherung verwenden
            }
          }));
        }}
        label="Wasserziel"
        unit="Milliliter"
        placeholder="2000"
      />
      
      {/* Save Button */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          { 
            backgroundColor: theme.colors.primary, 
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.m,
            alignItems: 'center',
            marginTop: theme.spacing.xs,
          },
          isLoading && { backgroundColor: theme.colors.disabled }
        ]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={[styles.saveButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white', fontSize: theme.typography.fontSize.m }]}>
          {isLoading ? 'Speichern...' : 'Profil speichern'}
        </Text>
      </TouchableOpacity>
          </>
          )}
      </ScrollView>
    </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert

export default ProfileScreen;