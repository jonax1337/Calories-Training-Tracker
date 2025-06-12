import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { HomeTabScreenProps } from '../types/navigation-types';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyLogByDate, saveUserProfile, saveDailyLog } from '../services/storage-service';
import { fetchUserProfile, fetchUserGoals } from '../services/profile-api';
import { fetchHealthData, calculateTotalCaloriesBurned } from '../services/health-service';
import ProgressBar from '../components/ui/progress-bar';
import WaveAnimation from '../components/ui/wave-animation';
import { DailyLog, HealthData, UserProfile, UserGoal, UserGoals } from '../types';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDateContext } from '../context/date-context';
import { createHomeStyles } from '../styles/screens/home-styles';
import { Minus, Plus, BarChart2, ChartSpline, ChartLine, ShieldCheck, ShieldOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import CalendarModal from '../components/ui/calendar-modal';
import DateNavigationHeader from '../components/ui/date-navigation-header';
import NutritionReportComponent from '../components/reports/nutrition-report-component';

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
  
  // Verwende den gemeinsamen DateContext statt lokalem State
  const { selectedDate, setSelectedDate } = useDateContext();

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

  // Load data when component mounts or date changes
  useEffect(() => {
    loadUserData();
  }, [selectedDate]);
  
  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      return () => {};
    }, [selectedDate])
  );

  // Calculate nutrition totals for today
  const calculateNutritionTotals = () => {
    if (!todayLog) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 };
    }

    return todayLog.foodEntries.reduce(
      (totals, entry) => {
        const { nutrition } = entry.foodItem;
        const multiplier = entry.servingAmount;

        return {
          calories: totals.calories + (nutrition?.calories || 0) * (multiplier / 100),
          protein: totals.protein + (nutrition?.protein || 0) * (multiplier / 100),
          carbs: totals.carbs + (nutrition?.carbs || 0) * (multiplier / 100),
          fat: totals.fat + (nutrition?.fat || 0) * (multiplier / 100),
          water: totals.water,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayLog.waterIntake }
    );
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

  const totals = calculateNutritionTotals();
  const goals = getGoals();
  
  // Funktion zum Aktualisieren des Gewichts - optimiert für sofortige Reaktion
  const updateWeight = async (newWeight: number) => {
    if (!userProfile) return;
    
    // SOFORT: UI-State aktualisieren für unmittelbares Feedback
    setCurrentWeight(newWeight);
    
    // State-Flag setzen, um parallele Updates zu vermeiden
    setIsUpdatingWeight(true);
    
    // Profilupdate vorbereiten
    const updatedProfile = {
      ...userProfile,
      weight: newWeight
    };
    
    // UI-State aktualisieren
    setUserProfile(updatedProfile);
    
    // Logupdate vorbereiten
    let updatedLog;
    if (todayLog) {
      updatedLog = {
        ...todayLog,
        date: selectedDate,
        weight: newWeight
      };
      setTodayLog(updatedLog);
    } else {
      updatedLog = {
        date: selectedDate,
        foodEntries: [],
        waterIntake: 0,
        weight: newWeight,
        dailyNotes: '',
        isCheatDay: false
      };
      setTodayLog(updatedLog);
    }
    
    // ASYNCHRON: DB-Updates durchführen, ohne auf Ergebnis zu warten
    try {
      // Starte beide Operationen parallel und warte nicht
      Promise.all([
        saveUserProfile(updatedProfile),
        saveDailyLog(updatedLog)
      ]).catch(error => {
        console.error('Fehler beim DB-Update (Hintergrund):', error);
      }).finally(() => {
        // Erst nach Abschluss beider Operationen das Flag zurücksetzen
        setIsUpdatingWeight(false);
      });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Gewichts:', error);
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

  // Funktion zum Umschalten des Cheat Day Status
  const handleToggleCheatDay = async () => {
    if (!todayLog) return;
    
    try {
      setIsUpdatingCheatDay(true);
      
      // Haptisches Feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Neuen Status festlegen (umkehren des aktuellen Status)
      const updatedLog = {
        ...todayLog,
        isCheatDay: !todayLog.isCheatDay
      };
      
      // Log im State aktualisieren für sofortiges UI-Feedback
      setTodayLog(updatedLog);
      
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

      {/* Nutrition summary section */}
      <View style={styles.summaryCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Heutige Nährwerte</Text>
          
          {/* Cheat Day Button */}
          <TouchableOpacity 
            style={[
              styles.cheatDayButton,
              todayLog?.isCheatDay && styles.cheatDayButtonActive
            ]}
            onPress={handleToggleCheatDay}
            disabled={isUpdatingCheatDay}
          >
            {todayLog?.isCheatDay ? (
              <ShieldOff size={theme.theme.typography.fontSize.s} color="white" style={{ marginRight: theme.theme.spacing.xs }} />
            ) : (
              <ShieldCheck size={theme.theme.typography.fontSize.m} color={theme.theme.colors.primary} style={{ marginRight: theme.theme.spacing.xs }} />
            )}
            <Text style={[
              styles.cheatDayText,
              todayLog?.isCheatDay && styles.cheatDayTextActive
            ]}>
              {todayLog?.isCheatDay ? 'Cheat Day' : 'Normaler Tag'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ProgressBar 
          label="🔥 Kalorien"
          current={Math.round(totals.calories)}
          target={goals.dailyCalories}
          color={theme.theme.colors.nutrition.calories}
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🍗 Protein"
          current={Math.round(totals.protein)}
          target={goals.dailyProtein || 50}
          color={theme.theme.colors.nutrition.protein}
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🍞 Kohlenhydrate"
          current={Math.round(totals.carbs)}
          target={goals.dailyCarbs || 250}
          color={theme.theme.colors.nutrition.carbs}
          isCheatDay={todayLog?.isCheatDay || false}
        />
        
        <ProgressBar 
          label="🧈 Fett"
          current={Math.round(totals.fat)}
          target={goals.dailyFat || 65}
          color={theme.theme.colors.nutrition.fat}
          isCheatDay={todayLog?.isCheatDay || false}
        />
      </View>

      {/* Water tracking section with wave animation */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Wasser</Text>
      
        <View style={styles.waterContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openWaterModal}
            style={{ width: '100%', height: '100%' }}
          >
            <WaveAnimation 
              fillPercentage={Math.min((totals.water / (goals.dailyWater || 2000)) * 100, 100)} 
              text={`${totals.water} / ${goals.dailyWater || 2000} ml`}
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
      </View>
      
      {/* Nutrition Report Section */}
      {userProfile && activeGoalTargets && (
        <View style={styles.summaryCard}>
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
        </View>
      )}

      {/* Weight tracking section */}
      <View style={[styles.summaryCard, styles.weightContainer]}>
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
      </View>

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
      </ScrollView>
    </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert
