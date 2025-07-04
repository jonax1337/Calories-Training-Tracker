// WICHTIG: Globale Variable außerhalb jeglicher Komponente
// Garantiert, dass die Animation wirklich nur EINMAL in der gesamten App-Session abgespielt wird
let HAS_HOME_ANIMATION_PLAYED = false;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { PIConfetti, ConfettiMethods } from 'react-native-fast-confetti';
import { HomeTabScreenProps } from '../types/navigationTypes';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyLogByDate, saveUserProfile, saveDailyLog } from '../services/storageService';
import { fetchUserProfile, fetchUserGoals } from '../services/profileApi';
import { fetchHealthData, calculateTotalCaloriesBurned } from '../services/healthService';
import ProgressBar from '../components/ui/ProgressBar';
import WaveAnimation from '../components/ui/WaveAnimation';
import { DailyLog, HealthData, UserProfile, UserGoal, UserGoals } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDateContext } from '../context/DateContext';
import { useSplash } from '../context/SplashContext';
import { createHomeStyles } from '../styles/screens/HomeStyles';
import { Minus, Plus, BarChart2, ChartSpline, ChartLine, ShieldCheck, ShieldOff, ShieldBan, Shield, ShieldX, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import CalendarModal from '../components/ui/CalendarModal';
import DateNavigationHeader from '../components/ui/DateNavigationHeader';
import NutritionReportComponent from '../components/reports/NutritionReportComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to check if user profile is complete with minimum required data
function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Check required fields for properly tracking calories and health
  return (
    profile.weight !== undefined && 
    profile.weight > 0 &&
    profile.height !== undefined && 
    profile.height > 0 &&
    profile.gender !== undefined &&
    profile.birthDate !== undefined &&
    profile.activityLevel !== undefined &&
    profile.goals !== undefined
  );
}

export default function HomeScreen({ navigation }: HomeTabScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createHomeStyles(theme.theme);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeGoalTargets, setActiveGoalTargets] = useState<UserGoals | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [isUpdatingWater, setIsUpdatingWater] = useState(false);
  const [lastWaterUpdateTime, setLastWaterUpdateTime] = useState(0);
  const [isUpdatingCheatDay, setIsUpdatingCheatDay] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [manualWaterAmount, setManualWaterAmount] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isScreenVisible, setIsScreenVisible] = useState(false); // Start hidden until first focus
  const [hasBeenFocused, setHasBeenFocused] = useState(false); // Track if screen was ever focused
  
  // Streak-States
  const [streakDays, setStreakDays] = useState(0);
  // Refs für den Mount-Status und Focus-Timing
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(0);
  
  // Ref für einmalige Animation-Kontrolle - verhindert Race Conditions
  const animationTriggered = useRef(false);
  
  // Verwende den gemeinsamen DateContext statt lokalem State
  const { selectedDate, setSelectedDate } = useDateContext();
  
  // Zugriff auf den Splash-Status, um Animation erst nach Splash-Ende zu starten
  const { isSplashComplete } = useSplash();

  // Zentrale Funktion für einmalige Animation-Trigger
  const triggerHomeAnimation = useCallback(() => {
    // Absolute Garantie: Animation nur einmal triggern
    if (animationTriggered.current || HAS_HOME_ANIMATION_PLAYED) {
      return false;
    }

    // Prüfe ob alle Bedingungen erfüllt sind
    if (!isSplashComplete) {
      return false;
    }
    
    // SOFORT beide Flags setzen - verhindert jede weitere Ausführung
    animationTriggered.current = true;
    HAS_HOME_ANIMATION_PLAYED = true;
    
    // Animation starten
    setIsScreenVisible(true);
    setHasBeenFocused(true);
    setAnimationKey(prev => prev + 1);
    
    return true;
  }, [isSplashComplete, isScreenVisible]);

  // Create a function to load user data that can be called when needed
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Load user profile from API
      const profile = await fetchUserProfile();
      setUserProfile(profile);
      
      // Load the selected date's log
      const log = await getDailyLogByDate(selectedDate);
      setTodayLog(log);
      
      // PRIORITÄT: Gewicht primär aus dem Tageslog laden, nur als Fallback aus dem Profil
      if (log?.weight !== undefined && log?.weight !== null) {
        // Wenn das Tageslog ein Gewicht hat, nutze dieses
        console.log(`Gewicht aus Tageslog geladen: ${log.weight}kg`);
        setCurrentWeight(log.weight);
      } else if (profile?.weight !== undefined) {
        // Als Fallback das Gewicht aus dem Profil verwenden
        console.log(`Kein Gewicht im Tageslog, verwende Profilgewicht: ${profile.weight}kg`);
        setCurrentWeight(profile.weight);
      } else {
        // Wenn weder Log noch Profil ein Gewicht haben
        console.log('Weder im Tageslog noch im Profil ist ein Gewicht gespeichert');
        setCurrentWeight(undefined);
      }

      // Load active user goal's nutritional targets - jetzt gibt dies ein leeres Array statt Fehler zurück
      let currentUserGoals: UserGoal[] = [];
      try {
        currentUserGoals = await fetchUserGoals(); // Fetches UserGoal[] or empty array
      } catch (error) {
        console.warn('Konnte Benutzerziele nicht laden, verwende Fallback-Werte:', error);
        // Fehler hier abfangen, damit der Rest der Daten trotzdem geladen werden kann
      }
      
      if (currentUserGoals && currentUserGoals.length > 0) {
        const activeGoal = currentUserGoals[0]; // Assuming the first one is the active one
        setActiveGoalTargets({
          dailyCalories: activeGoal.dailyCalories,
          dailyProtein: activeGoal.dailyProtein,
          dailyCarbs: activeGoal.dailyCarbs,
          dailyFat: activeGoal.dailyFat,
          dailyWater: activeGoal.dailyWater,
          // weightGoal is not directly on UserGoal, might be part of UserProfile or not used here
        });
      } else if (profile?.goals) {
        // Fallback to goals possibly stored in the main user profile if no specific active goal found
        setActiveGoalTargets(profile.goals);
      } else {
        setActiveGoalTargets(null); // Or set to default goals
      }

      // Load health data
      const health = await fetchHealthData();
      setHealthData(health);
      
      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Einfache Streak-Berechnung basierend auf selectedDate
  const calculateStreak = async () => {
    console.log('=== STREAK CALCULATION START ===');
    console.log('Selected date for streak calculation:', selectedDate);
    
    try {
      const currentDate = new Date(selectedDate);
      let streakCount = 0;
      
      // Prüfe jeden Tag beginnend vom selectedDate rückwärts
      for (let i = 0; i <= 30; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(currentDate.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        console.log(`Checking streak day ${i}: ${dateString}`);
        
        try {
          // Immer von der Datenbank laden für konsistente Ergebnisse
          const dayLog = await getDailyLogByDate(dateString);
          console.log(`Loaded dayLog for ${dateString}:`, !!dayLog);
          
          // Prüfe ob an diesem Tag etwas VALIDES eingetragen wurde
          let hasValidFood = false;
          
          if (dayLog?.foodEntries && Array.isArray(dayLog.foodEntries) && dayLog.foodEntries.length > 0) {
            console.log(`Checking ${dayLog.foodEntries.length} food entries for ${dateString}`);
            
            // Prüfe jede Food Entry auf gültige Kalorien
            for (let j = 0; j < dayLog.foodEntries.length; j++) {
              const entry = dayLog.foodEntries[j];
              console.log(`Entry ${j} for ${dateString}:`, {
                hasEntry: !!entry,
                hasFoodItem: !!entry?.foodItem,
                hasNutrition: !!entry?.foodItem?.nutrition,
                calories: entry?.foodItem?.nutrition?.calories,
                caloriesType: typeof entry?.foodItem?.nutrition?.calories
              });
              
              // Nur zählen wenn entry komplett und calories eine gültige Zahl ist
              if (entry && 
                  entry.foodItem && 
                  entry.foodItem.nutrition && 
                  typeof entry.foodItem.nutrition.calories === 'number' && 
                  !isNaN(entry.foodItem.nutrition.calories) &&
                  entry.foodItem.nutrition.calories > 0) {
                hasValidFood = true;
                console.log(`Valid food entry found for ${dateString} with ${entry.foodItem.nutrition.calories} calories`);
                break; // Ein gültiger Eintrag reicht
              } else {
                console.log(`Invalid/empty food entry ${j} for ${dateString} - skipping`);
              }
            }
          }
          
          const hasWater = dayLog?.waterIntake && typeof dayLog.waterIntake === 'number' && dayLog.waterIntake > 0;
          console.log(`Day ${dateString}: hasValidFood=${hasValidFood}, hasWater=${hasWater} (${dayLog?.waterIntake || 0}ml)`);
          
          // NUR zählen wenn dieser Tag wirklich Einträge hat
          if (hasValidFood || hasWater) {
            streakCount++;
            console.log(`Streak continues for ${dateString}! Count: ${streakCount}`);
          } else {
            console.log(`No valid entries for ${dateString}. Final streak count: ${streakCount}`);
            break; // Streak unterbrochen - Tag ohne Einträge
          }
        } catch (error) {
          console.error(`Error processing streak day ${dateString}:`, error);
          break; // Kein Log gefunden, Streak unterbrochen
        }
      }
      
      console.log('=== STREAK CALCULATION END ===');
      console.log('Final streak count:', streakCount);
      setStreakDays(streakCount);
    } catch (error) {
      console.error('Error in streak calculation:', error);
    }
  };

  // Load data when component mounts or date changes
  useEffect(() => {
    loadUserData();
  }, [selectedDate]);
  
  // Calculate streak when todayLog changes OR selectedDate changes
  useEffect(() => {
    calculateStreak();
  }, [todayLog, selectedDate]);
  
  // Focus Effect: Load data and handle screen visibility
  useFocusEffect(
    useCallback(() => {
      // Lade Daten immer, egal ob neu montiert oder nicht
      loadUserData();
      
      // Zeige Screen sofort OHNE Animation wenn bereits abgespielt
      if (HAS_HOME_ANIMATION_PLAYED || animationTriggered.current) {
        setIsScreenVisible(true);
        setHasBeenFocused(true);
        return;
      }
      
      // Versuche Animation zu triggern
      triggerHomeAnimation();
      
      // Update focus time for reference
      lastFocusTime.current = Date.now();
      isInitialMount.current = false;

      return () => {
        // Hide screen when losing focus to prevent flicker
        setIsScreenVisible(false);
      };
    }, [selectedDate, triggerHomeAnimation])
  );
  
  // Backup Effect: Falls useFocusEffect nicht triggert, versuche Animation bei Splash-Ende
  useEffect(() => {
    // Nur als Backup falls useFocusEffect noch nicht getriggert hat
    if (isSplashComplete && !isScreenVisible && !animationTriggered.current && !HAS_HOME_ANIMATION_PLAYED) {
      triggerHomeAnimation();
    }
  }, [isSplashComplete, isScreenVisible, triggerHomeAnimation]);

  // Calculate nutrition totals for today
  const calculateNutritionTotals = () => {
    console.log('=== NUTRITION CALCULATION START (HomeScreen) ===');
    console.log('todayLog exists:', !!todayLog);
    console.log('selectedDate:', selectedDate);
    
    if (!todayLog || !Array.isArray(todayLog.foodEntries)) {
      console.log('No valid todayLog or foodEntries, returning zeros');
      return { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayLog?.waterIntake || 0 };
    }

    console.log('Processing', todayLog.foodEntries.length, 'food entries');

    try {
      return todayLog.foodEntries.reduce(
        (nutritionAccumulator, entry, index) => {
          console.log(`Processing nutrition entry ${index}:`, {
            hasEntry: !!entry,
            hasFoodItem: !!entry?.foodItem,
            hasNutrition: !!entry?.foodItem?.nutrition,
            calories: entry?.foodItem?.nutrition?.calories,
            caloriesType: typeof entry?.foodItem?.nutrition?.calories
          });
          
          // Null-Safety für entry und foodItem
          if (!entry || !entry.foodItem || !entry.foodItem.nutrition) {
            console.log(`Skipping invalid entry ${index}`);
            return nutritionAccumulator;
          }
          
          const { nutrition } = entry.foodItem;
          const multiplier = entry.servingAmount || 100;
          
          // Zusätzliche Validierung für undefined calories
          if (typeof nutrition.calories !== 'number' || isNaN(nutrition.calories)) {
            console.log(`Entry ${index} has invalid calories (${nutrition.calories}), skipping`);
            return nutritionAccumulator;
          }

          const entryCalories = nutrition.calories * (multiplier / 100);
          console.log(`Entry ${index}: ${nutrition.calories} calories * ${multiplier}/100 = ${entryCalories}`);

          return {
            calories: nutritionAccumulator.calories + entryCalories,
            protein: nutritionAccumulator.protein + (nutrition?.protein || 0) * (multiplier / 100),
            carbs: nutritionAccumulator.carbs + (nutrition?.carbs || 0) * (multiplier / 100),
            fat: nutritionAccumulator.fat + (nutrition?.fat || 0) * (multiplier / 100),
            water: nutritionAccumulator.water,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayLog.waterIntake || 0 }
      );
    } catch (error) {
      console.error('=== ERROR in nutrition calculation (HomeScreen) ===');
      console.error('Error:', error);
      return { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayLog.waterIntake || 0 };
    }
  };

  // Get default goals or from user profile
  const getGoals = (): UserGoals => {
    if (activeGoalTargets && typeof activeGoalTargets.dailyCalories === 'number') {
      return activeGoalTargets;
    } else if (activeGoalTargets) {
      console.warn('[DEBUG] HomeScreen - getGoals: activeGoalTargets found but dailyCalories is not a number. Value:', activeGoalTargets.dailyCalories);
    }
    // Fallback to userProfile.goals if activeGoalTargets isn't set (e.g. during initial load or error)
    if (userProfile?.goals) {
      return userProfile.goals;
    }
    
    const defaultGoals = {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000, // ml
    };
    return defaultGoals;
  };

  const nutritionTotals = calculateNutritionTotals();
  const goals = getGoals();
  
  // Funktion zum Aktualisieren des Gewichts - mit verbesserter Geburtsdatumsbehandlung
  const updateWeight = async (newWeight: number) => {
    if (!userProfile) {
      return;
    }
    
    // WICHTIG: Das aktuelle Geburtsdatum speichern, für den Fall, dass es vom Backend gelöscht wird
    const currentBirthDate = userProfile.birthDate;
    
    // SOFORT: UI-State aktualisieren für unmittelbares Feedback
    setCurrentWeight(newWeight);
    
    // State-Flag setzen
    setIsUpdatingWeight(true);
    
    try {
      // 1. Tageslog aktualisieren - hier keine Profile-Aktualisierung, das kommt später
      let updatedLog;
      if (todayLog) {
        updatedLog = {
          ...todayLog,
          date: selectedDate,
          weight: newWeight
        };
      } else {
        updatedLog = {
          date: selectedDate,
          foodEntries: [],
          waterIntake: 0,
          weight: newWeight,
          dailyNotes: '',
          isCheatDay: false
        };
      }
      
      // UI-State für das Tageslog aktualisieren
      setTodayLog(updatedLog);
      
      // Tageslog speichern
      await saveDailyLog(updatedLog);
      
      // 2. Profil direkt aus dem lokalen State aktualisieren, OHNE das Backend zu befragen
      // Dies verhindert, dass das Backend uns überschriebene Daten zurückgibt
      const updatedProfile = {
        ...userProfile,
        weight: newWeight,
        // KRITISCH: Das Geburtsdatum explizit beibehalten
        birthDate: currentBirthDate
      };
      
      // 3. Profil im UI aktualisieren
      setUserProfile(updatedProfile);
      
      // 4. Profil in der Datenbank speichern ohne es vorher vom Backend zu laden
      await saveUserProfile(updatedProfile);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Gewichts:', error);
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  // Funktion zum Erhöhen des Gewichts um 0.1
  const incrementWeight = () => {
    if (currentWeight !== undefined) {
      updateWeight(parseFloat((currentWeight + 0.1).toFixed(2)));
    }
  };
  
  // Funktion zum Verringern des Gewichts um 0.1
  const decrementWeight = () => {
    if (currentWeight !== undefined && currentWeight > 0.1) {
      updateWeight(parseFloat((currentWeight - 0.1).toFixed(2)));
    }
  };
  
  // Funktion zum Erhöhen des Gewichts um 0.01 (feinere Kontrolle)
  const incrementWeightSmall = () => {
    if (currentWeight !== undefined) {
      updateWeight(parseFloat((currentWeight + 0.01).toFixed(2)));
    }
  };
  
  // Funktion zum Verringern des Gewichts um 0.01 (feinere Kontrolle)
  const decrementWeightSmall = () => {
    if (currentWeight !== undefined && currentWeight > 0.01) {
      updateWeight(parseFloat((currentWeight - 0.01).toFixed(2)));
    }
  };

  // Funktion zum Hinzufügen von Wasser - optimiert für sofortige Reaktion
  const addWater = async (amount: number) => {
    // Skip if no log
    if (!todayLog) return;
    
    // SOFORT: UI-State aktualisieren für unmittelbares Feedback
    const currentIntake = todayLog.waterIntake || 0;
    const newIntake = Math.max(0, currentIntake + amount);
    
    // Lokalen State sofort aktualisieren
    const updatedLog = {
      ...todayLog,
      date: selectedDate,
      waterIntake: newIntake
    };
    
    // UI sofort aktualisieren
    setTodayLog(updatedLog);
    
    // Status setzen für Parallelitätskontrolle
    setIsUpdatingWater(true);
    
    // ASYNCHRON: DB-Update im Hintergrund durchführen
    try {
      // DB-Operation starten, aber nicht auf das Ergebnis warten
      saveDailyLog(updatedLog)
        .catch(error => {
          console.error('Fehler beim Speichern des Wasserintakes (Hintergrund):', error);
        })
        .finally(() => {
          // Status erst nach Abschluss zurücksetzen
          setIsUpdatingWater(false);
        });
    } catch (error) {
      console.error('Error updating water intake:', error);
      setIsUpdatingWater(false);
    }
  };

  // Funktion zum direkten Setzen des Wasserstands mit Debouncing
  const setWaterAmount = async (amount: number) => {
    if (!todayLog) return;
    
    // Implement debouncing - prevent updates too close together
    const now = Date.now();
    const minTimeBetweenUpdates = 10; // 500ms minimum between updates
    
    if (isUpdatingWater || (now - lastWaterUpdateTime < minTimeBetweenUpdates)) {
      console.log('Skipping manual water update - too soon after previous update');
      return;
    }
    
    // Sicherstellen, dass der Wert nicht negativ ist
    const newAmount = Math.max(0, Math.round(amount));
    
    setLastWaterUpdateTime(now);
    setIsUpdatingWater(true);
    
    try {
      // Use the selected date in the correct format (YYYY-MM-DD)
      console.log(`Setting water intake to: ${newAmount}ml using date: ${selectedDate}`);
      
      // Aktualisiere lokalen State
      const updatedLog = {
        ...todayLog,
        date: selectedDate, // Ensure consistent date format
        waterIntake: newAmount
      };
      
      // Update local state first
      setTodayLog(updatedLog);
      
      // Then save to server
      await saveDailyLog(updatedLog);
      
      // Reload data to ensure everything is in sync
      await loadUserData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Wasserverbrauchs:', error);
    } finally {
      setIsUpdatingWater(false);
      setShowWaterModal(false);
    }
  };

  // State für Cheat Day Animation
  const confettiRef = useRef<ConfettiMethods>(null);
  const cheatDayButtonRef = useRef<View>(null);

  // Funktion zum Umschalten des Cheat Day Status
  const handleToggleCheatDay = async () => {
    if (!todayLog) return;
    
    try {
      setIsUpdatingCheatDay(true);
      
      const willActivateCheatDay = !todayLog.isCheatDay;
      
      // Unterschiedliches haptisches Feedback je nach Aktion (50ms verzögert)
      if (willActivateCheatDay) {
          // Stärkeres Feedback beim Aktivieren
            setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 150);
        } else {
          // Sanfteres Feedback beim Deaktivieren
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      
      // Neuen Status festlegen (umkehren des aktuellen Status)
      const updatedLog = {
        ...todayLog,
        isCheatDay: willActivateCheatDay
      };
      
      // Log im State aktualisieren für sofortiges UI-Feedback
      setTodayLog(updatedLog);
      
      // Konfetti-Animation nur beim Aktivieren
      if (willActivateCheatDay) {
        // Starte Konfetti-Animation
        if (confettiRef.current) {
          confettiRef.current.restart();
        }
      }
      
      // In der Datenbank speichern
      await saveDailyLog(updatedLog);
      
      // Log-Eintrag für Debugging
      console.log(`Cheat Day für ${updatedLog.date} ${updatedLog.isCheatDay ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Cheat Day Status:', error);
      Alert.alert('Fehler', 'Der Status konnte nicht aktualisiert werden.');
    } finally {
      setIsUpdatingCheatDay(false);
    }
  };

  // Funktion zum Öffnen des Modals mit aktuellem Wasserstand

  const openWaterModal = () => {
    if (todayLog) {
      setManualWaterAmount(todayLog.waterIntake.toString());
      setShowWaterModal(true);
    }
  };
  
  // Funktion zum Anwenden des manuell eingegebenen Wasserwertes
  const applyManualWaterAmount = () => {
    const amount = parseInt(manualWaterAmount);
    if (!isNaN(amount)) {
      setWaterAmount(amount);
    } else {
      Alert.alert('Ungültige Eingabe', 'Bitte geben Sie eine gültige Zahl ein.');
    }
  };

  // Calculate calories burned
  const caloriesBurned = healthData 
    ? calculateTotalCaloriesBurned(
        healthData.steps, 
        healthData.activeCaloriesBurned, 
        userProfile?.weight
      )
    : 0;

  // Check if profile is complete - if not, redirect to the Intro screen
  useEffect(() => {
    if (!isProfileComplete(userProfile)) {
      // Verwende den Root-Navigator, um zum Intro-Screen zu navigieren
      // @ts-ignore - Wir wissen, dass der Root-Navigator diese Route kennt
      navigation.getParent()?.navigate('Intro');
    }
  }, [userProfile, navigation]);
  
  // Falls das Profil nicht vollständig ist und die Navigation zum Intro-Screen
  // noch nicht abgeschlossen ist, zeige einen Ladebildschirm
  if (!isProfileComplete(userProfile)) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.theme.colors.primary} />
        <Text style={styles.loadingText}>
          Profil wird vorbereitet...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Konfetti Animation mit react-native-fast-confetti */}
      <PIConfetti 
        ref={confettiRef}
        count={50}
        blastPosition={{x: 200, y: -100}}
        blastRadius={300}
        fallDuration={3500}
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#FD79A8', '#E17055']}
      />
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
        }
      ]}>
        {/* Wiederverwendbare Datumsnavigations-Komponente */}
        <DateNavigationHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onCalendarOpen={() => setShowCalendarModal(true)}
        />
      </View>
      
      {/* Wiederverwendbare Calendar Modal Komponente */}
      <CalendarModal
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => setSelectedDate(date)}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
      >
      {isScreenVisible && (
        <>
        {/* Nutrition summary section */}
        <Animatable.View 
          key={`nutrition-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={200}
          style={styles.summaryCard}
        >
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.cardTitle}>Tägliche Nährwerte</Text>
            {streakDays >= 2 && (
              <Animatable.View
                animation="bounceIn"
                duration={800}
                delay={200}
                style={styles.titleStreakBadge}
              >
                  <Animatable.View
                  animation="fadeIn"
                  duration={200}
                  delay={400}
                  style={styles.titleBadgeContent}
                >
                  <Flame 
                    size={theme.theme.typography.fontSize.xs} 
                    color={theme.theme.colors.error}
                    style={styles.titleBadgeIcon}
                  />
                  <Text style={styles.titleBadgeNumber}>{streakDays}</Text>
                  </Animatable.View>
                </Animatable.View>
            )}
          </View>
          <View style={styles.headerRightContent}>
          
            {/* Cheat Day Button */}
          <Animatable.View
            ref={cheatDayButtonRef}
            animation={todayLog?.isCheatDay ? "pulse" : undefined}
            iterationCount={todayLog?.isCheatDay ? "infinite" : 1}
            duration={2000}
          >
            <TouchableOpacity 
              style={[
                styles.cheatDayButton,
                todayLog?.isCheatDay && styles.cheatDayButtonActive,
                todayLog?.isCheatDay && {
                  shadowColor: theme.theme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  elevation: 8,
                }
              ]}
              onPress={handleToggleCheatDay}
              disabled={isUpdatingCheatDay}
            >
              {todayLog?.isCheatDay ? (
                <ShieldX size={theme.theme.typography.fontSize.m} color="white" style={{ marginRight: theme.theme.spacing.xs }} />
              ) : (
                <ShieldCheck size={theme.theme.typography.fontSize.m} color={theme.theme.colors.primary} style={{ marginRight: theme.theme.spacing.xs }} />
              )}
              <Text style={[
                styles.cheatDayText,
                todayLog?.isCheatDay && styles.cheatDayTextActive
              ]}>
                {todayLog?.isCheatDay ? 'Cheat Day' : 'Normaler Tag'}
              </Text>
              
              {/* Konfetti-Partikel hinter dem Button */}
              {todayLog?.isCheatDay && (
                <View style={{
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  right: -10,
                  bottom: -10,
                  zIndex: -1,
                  pointerEvents: 'none'
                }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <Animatable.View
                      key={i}
                      animation={{
                        0: { scaleX: 0, opacity: 0 },
                        0.5: { scaleX: 1, opacity: 1 },
                        1: { scaleX: 0, opacity: 0 }
                      }}
                      iterationCount="infinite"
                      duration={1500}
                      delay={i * 250}
                      style={{
                        position: 'absolute',
                        width: 4,
                        height: 4,
                        backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FECA57', '#FF9FF3', '#54A0FF'][i],
                        borderRadius: 2,
                        top: Math.random() * 40,
                        left: Math.random() * 80,
                      }}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animatable.View>
          </View>
        </View>
        
        <ProgressBar 
          label="🔥 Kalorien"
          current={Math.round(nutritionTotals.calories)}
          target={goals.dailyCalories}
          color={theme.theme.colors.nutrition.calories}
          unit="kcal"
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🍗 Protein"
          current={Math.round(nutritionTotals.protein)}
          target={goals.dailyProtein || 50}
          color={theme.theme.colors.nutrition.protein}
          unit="g"
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🍞 Kohlenhydrate"
          current={Math.round(nutritionTotals.carbs)}
          target={goals.dailyCarbs || 250}
          color={theme.theme.colors.nutrition.carbs}
          unit="g"
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🧈 Fett"
          current={Math.round(nutritionTotals.fat)}
          target={goals.dailyFat || 65}
          color={theme.theme.colors.nutrition.fat}
          unit="g"
          isCheatDay={todayLog?.isCheatDay || false}
        />
      </Animatable.View>

      {/* Water tracking section with wave animation */}
      <Animatable.View 
        key={`water-${animationKey}`}
        animation="fadeInUp" 
        duration={600} 
        delay={300}
        style={styles.summaryCard}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Wasser</Text>
        </View>
      
        <View style={styles.waterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openWaterModal}
            style={{ width: '100%', height: '100%' }}
          >
            <WaveAnimation 
              fillPercentage={Math.min((nutritionTotals.water / (goals.dailyWater || 2000)) * 100, 100)} 
              text={`${nutritionTotals.water} / ${goals.dailyWater || 2000} ml`}
              color={theme.theme.colors.primary}
              textColor={theme.theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.waterButtonsContainer}>
          {[
            { amount: 100, value: '+100ml' },
            { amount: 250, value: '+250ml' },
            { amount: 330, value: '+330ml' },
            { amount: 500, value: '+500ml' },
          ].map((item) => (
            <TouchableOpacity
              key={item.amount}
              style={styles.waterButton}
              onPress={() => addWater(item.amount)}
              disabled={isUpdatingWater}
            >
              <Text style={styles.waterButtonText}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animatable.View>
      
      {/* Nutrition Report Section */}
      {userProfile && activeGoalTargets && (
        <Animatable.View 
          key={`report-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={400}
          style={styles.summaryCard}
        >
          <View style={styles.nutritionReportHeaderRow}>
            <Text style={styles.cardTitle}>Ernährungsbericht</Text>
            
            <TouchableOpacity 
              style={styles.nutritionReportButton}
              onPress={() => navigation.getParent()?.navigate('NutritionReport', { days: 14 })}
            >
              <ChartLine size={theme.theme.typography.fontSize.m} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.nutritionReportButtonText}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
          
          <NutritionReportComponent 
            userProfile={userProfile}
            userGoals={activeGoalTargets}
            days={14}
            compact={true}
            selectedDate={selectedDate} // Datum aus DateContext übergeben
          />
        </Animatable.View>
      )}

      {/* Weight tracking section */}
      <Animatable.View 
        key={`weight-${animationKey}`}
        animation="fadeInUp" 
        duration={600} 
        delay={500}
        style={[styles.summaryCard, styles.weightContainer]}
      >
        <View style={styles.weightHeaderRow}>
          <Text style={styles.cardTitle}>Gewicht</Text>
          
          <TouchableOpacity 
            style={styles.weightHistoryButton}
            onPress={() => navigation.getParent()?.navigate('WeightHistory')}
          >
            <BarChart2 size={theme.theme.typography.fontSize.m} color="white" style={{ marginRight: 4 }} />
            <Text style={styles.weightHistoryButtonText}>
              Verlauf
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.weightControlsContainer}>
          {/* Reihe mit großen Buttons für 0.1 kg Änderungen */}
          <View style={styles.weightMainRow}>
          <TouchableOpacity
            style={styles.weightButton}
            onPress={decrementWeight}
            disabled={currentWeight === undefined || currentWeight <= 0.1}
          >
            <Minus size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.weightDisplay}>
            <Text style={styles.weightText}>
              {(currentWeight !== undefined && currentWeight !== null) ? `${currentWeight.toFixed(2)} kg` : '-'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.weightButton}
            onPress={incrementWeight}
            disabled={currentWeight === undefined}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
          </View>
          
          {/* Reihe mit kleinen Buttons für 0.01 kg Änderungen */}
          <View style={styles.weightSmallRow}>
            <TouchableOpacity
              style={[styles.weightButtonSmall, { marginLeft: 8 }]}
              onPress={decrementWeightSmall}
              disabled={currentWeight === undefined || currentWeight <= 0.01}
            >
              <Minus size={14} color={theme.theme.colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.weightSmallLabel}>
              ±0.01 kg
            </Text>
            
            <TouchableOpacity
              style={styles.weightButtonSmall}
              onPress={incrementWeightSmall}
              disabled={currentWeight === undefined}
            >
              <Plus size={14} color={theme.theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animatable.View>
      
      {/* Modal zur manuellen Eingabe des Wasserstands */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showWaterModal}
        onRequestClose={() => setShowWaterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Wasserstand anpassen
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={styles.input}
                  value={manualWaterAmount}
                  onChangeText={(text) => {
                    // Entferne alle Nicht-Ziffern
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setManualWaterAmount(numericValue);
                  }}
                  keyboardType="number-pad"
                  placeholder="Wassermenge"
                  placeholderTextColor={theme.theme.colors.textLight}
                />
                <Text style={styles.unitText}>
                  ml
                </Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWaterModal(false)}
              >
                <Text style={{ color: theme.theme.colors.error, fontFamily: theme.theme.typography.fontFamily.medium }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={applyManualWaterAmount}
              >
                <Text style={{ color: theme.theme.colors.primary, fontFamily: theme.theme.typography.fontFamily.medium }}>
                  Speichern
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </>
      )}
      </ScrollView>
      
    </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert