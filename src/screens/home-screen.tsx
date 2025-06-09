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
      setCurrentWeight(profile?.weight);

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

      // Load the selected date's log
      const log = await getDailyLogByDate(selectedDate);
      setTodayLog(log);

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
  
  // Funktion zum Aktualisieren des Gewichts
  const updateWeight = async (newWeight: number) => {
    if (!userProfile) return;
    
    setIsUpdatingWeight(true);
    try {
      // Aktualisiere lokalen State
      setCurrentWeight(newWeight);
      
      // Aktualisiere und speichere Benutzerprofil
      const updatedProfile = {
        ...userProfile,
        weight: newWeight
      };
      
      setUserProfile(updatedProfile);
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

  // Funktion zum Hinzufügen von Wasser mit Debouncing
  const addWater = async (amount: number) => {
    // Skip if no log or already updating
    if (!todayLog) return;
    
    // Implement debouncing - prevent updates too close together
    const now = Date.now();
    
    setLastWaterUpdateTime(now);
    setIsUpdatingWater(true);
    
    try {
      // Ensure waterIntake is a number (may be null or undefined)
      const currentIntake = todayLog.waterIntake || 0;
      
      // Use the selected date in the correct format (YYYY-MM-DD)
      console.log(`Using date format for water update: ${selectedDate}`);
      
      // Aktualisiere lokalen State
      const updatedLog = {
        ...todayLog,
        date: selectedDate, // Ensure consistent date format
        waterIntake: currentIntake + amount
      };
      
      console.log(`Adding water: ${amount}ml. New total: ${updatedLog.waterIntake}ml`);
      
      // Update local state first
      setTodayLog(updatedLog);
      
      // Then save to server
      await saveDailyLog(updatedLog);
      
      // Reload data to ensure everything is in sync
      await loadUserData();
      
      // Animation wird automatisch durch Änderung des Prozentwerts ausgelöst
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Wasserverbrauchs:', error);
    } finally {
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
      <View style={[styles.container, { 
        backgroundColor: theme.theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center' 
      }]}>
        <ActivityIndicator size="large" color={theme.theme.colors.primary} />
        <Text style={{
          fontFamily: theme.theme.typography.fontFamily.medium,
          fontSize: theme.theme.typography.fontSize.m,
          color: theme.theme.colors.textLight,
          marginTop: 16
        }}>
          Profil wird vorbereitet...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.theme.colors.background,
          borderBottomColor: theme.theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
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
        contentContainerStyle={{ padding: 16, paddingTop: 16 }}
      >

      {/* Nutrition summary section */}
      <View style={[
        styles.summaryCard, 
        { 
          backgroundColor: theme.theme.colors.card,
          borderRadius: theme.theme.borderRadius.large,
          shadowColor: theme.theme.colors.shadow
        }
      ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.theme.spacing.xs }}>
          <Text style={[
            styles.cardTitle, 
            { 
              fontFamily: theme.theme.typography.fontFamily.bold,
              color: theme.theme.colors.text
            }
          ]}>Heutige Nährwerte</Text>
          
          {/* Cheat Day Button */}
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: todayLog?.isCheatDay ? theme.theme.colors.primary : 'transparent',
              borderRadius: theme.theme.borderRadius.medium,
              borderColor: theme.theme.colors.primary,
              borderWidth: 1,
              paddingVertical: theme.theme.spacing.xs,
              paddingHorizontal: theme.theme.spacing.s,
              marginTop: -theme.theme.spacing.m,
            }}
            onPress={handleToggleCheatDay}
            disabled={isUpdatingCheatDay}
          >
            {todayLog?.isCheatDay ? (
              <ShieldOff size={theme.theme.typography.fontSize.s} color="white" style={{ marginRight: theme.theme.spacing.xs }} />
            ) : (
              <ShieldCheck size={theme.theme.typography.fontSize.m} color={theme.theme.colors.primary} style={{ marginRight: theme.theme.spacing.xs }} />
            )}
            <Text style={{
              color: todayLog?.isCheatDay ? 'white' : theme.theme.colors.primary,
              fontFamily: theme.theme.typography.fontFamily.medium,
              fontSize: theme.theme.typography.fontSize.xs
            }}>
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
      <View style={[
        styles.summaryCard, 
        { 
          backgroundColor: theme.theme.colors.card,
          borderRadius: theme.theme.borderRadius.large,
          marginBottom: 16,
          shadowColor: theme.theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1.5,
          elevation: 2,
          paddingBottom: 8,
        }
      ]}>
        <Text style={[
          styles.cardTitle, 
          { 
            fontFamily: theme.theme.typography.fontFamily.bold,
            color: theme.theme.colors.text
          }
        ]}>Wasser</Text>
      
        <View style={{ height: theme.theme.spacing.xl * 5, marginVertical: theme.theme.spacing.s }}>
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

        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap',
          marginTop: theme.theme.spacing.xs, 
          marginBottom: theme.theme.spacing.xs
        }}>
          {[
            { amount: 100, value: '+100ml' },
            { amount: 250, value: '+250ml' },
            { amount: 330, value: '+330ml' },
            { amount: 500, value: '+500ml' },
          ].map((item) => (
            <TouchableOpacity
              key={item.amount}
              style={{
                backgroundColor: theme.theme.colors.primary,
                borderRadius: theme.theme.borderRadius.medium,
                paddingVertical: theme.theme.spacing.m,
                paddingHorizontal: theme.theme.spacing.s,
                alignItems: 'center',
                justifyContent: 'center',
                margin: theme.theme.spacing.xs,
                minWidth: 60,
                flex: 1,
                maxWidth: 120,
              }}
              onPress={() => addWater(item.amount)}
              disabled={isUpdatingWater}
            >
              <Text style={{
                fontFamily: theme.theme.typography.fontFamily.medium,
                color: "white",
                fontSize: theme.theme.typography.fontSize.s,
                textAlign: 'center',
              }}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Nutrition Report Section */}
      {userProfile && activeGoalTargets && (
        <View style={[
          styles.summaryCard, 
          { 
            backgroundColor: theme.theme.colors.card,
            borderRadius: theme.theme.borderRadius.large,
            marginBottom: 16,
            shadowColor: theme.theme.colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.5,
            elevation: 2,
          }
        ]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[
              styles.cardTitle, 
              { 
                fontFamily: theme.theme.typography.fontFamily.bold,
                color: theme.theme.colors.text
              }
            ]}>Ernährungsbericht</Text>
            
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.theme.colors.primary,
                borderRadius: theme.theme.borderRadius.medium,
                paddingVertical: 6,
                paddingHorizontal: 12,
                marginTop: -theme.theme.spacing.m,
              }}
              onPress={() => navigation.getParent()?.navigate('NutritionReport', { days: 14 })}
            >
              <ChartLine size={theme.theme.typography.fontSize.m} color="white" style={{ marginRight: 4 }} />
              <Text style={{ 
                fontFamily: theme.theme.typography.fontFamily.medium, 
                fontSize: theme.theme.typography.fontSize.xs,
                color: 'white'
              }}>
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
      <View style={[
        styles.summaryCard, 
        { 
          backgroundColor: theme.theme.colors.card,
          borderRadius: theme.theme.borderRadius.large,
          marginBottom: 16,
          shadowColor: theme.theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1.5,
          elevation: 2,
        }
      ]}>
        <Text style={[
          styles.cardTitle, 
          { 
            fontFamily: theme.theme.typography.fontFamily.bold,
            color: theme.theme.colors.text
          }
        ]}>Gewicht</Text>
        
        <View style={{ flexDirection: 'column', marginTop: 8 }}>
          {/* Reihe mit großen Buttons für 0.1 kg Änderungen */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.theme.colors.primary,
              borderRadius: 99,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.theme.colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
              elevation: 2,
            }}
            onPress={decrementWeight}
            disabled={isUpdatingWeight || currentWeight === undefined || currentWeight <= 0.1}
          >
            <Minus size={24} color="white" />
          </TouchableOpacity>
          
          <View style={{
            backgroundColor: theme.theme.colors.background,
            borderRadius: theme.theme.borderRadius.medium,
            paddingVertical: 12,
            paddingHorizontal: 16,
            minWidth: 120,
            alignItems: 'center',
          }}>
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.bold,
              fontSize: 24,
              color: theme.theme.colors.text
            }}>
              {(currentWeight !== undefined && currentWeight !== null) ? `${currentWeight.toFixed(2)} kg` : '-'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              backgroundColor: theme.theme.colors.primary,
              borderRadius: 99,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.theme.colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1,
              elevation: 2,
            }}
            onPress={incrementWeight}
            disabled={isUpdatingWeight || currentWeight === undefined}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
          </View>
          
          {/* Reihe mit kleinen Buttons für 0.01 kg Änderungen */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.theme.colors.primary + '15',
                borderRadius: 99,
                width: 26,
                height: 26,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={decrementWeightSmall}
              disabled={isUpdatingWeight || currentWeight === undefined || currentWeight <= 0.01}
            >
              <Minus size={14} color={theme.theme.colors.primary} />
            </TouchableOpacity>
            
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.regular,
              fontSize: 12,
              color: theme.theme.colors.textLight
            }}>
              ±0.01 kg
            </Text>
            
            <TouchableOpacity
              style={{
                backgroundColor: theme.theme.colors.primary + '15',
                borderRadius: 99,
                width: 26,
                height: 26,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 8,
              }}
              onPress={incrementWeightSmall}
              disabled={isUpdatingWeight || currentWeight === undefined}
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
          <View style={[styles.modalContent, { backgroundColor: theme.theme.colors.card, borderRadius: theme.theme.borderRadius.medium }]}>
            <Text style={[styles.modalTitle, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
              Wasserstand anpassen
            </Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.theme.colors.background,
                    color: theme.theme.colors.text,
                    borderRadius: theme.theme.borderRadius.small,
                    fontFamily: theme.theme.typography.fontFamily.medium,
                    paddingRight: 40 // Platz für die Einheit
                  }]}
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
                <Text style={{
                  position: 'absolute',
                  right: 12,
                  alignSelf: 'center',
                  color: theme.theme.colors.textLight,
                  fontFamily: theme.theme.typography.fontFamily.medium,
                  fontSize: 16,
                  opacity: 0.7
                }}>
                  ml
                </Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.theme.colors.error + '20', borderRadius: theme.theme.borderRadius.small }]}
                onPress={() => setShowWaterModal(false)}
              >
                <Text style={{ color: theme.theme.colors.error, fontFamily: theme.theme.typography.fontFamily.medium }}>
                  Abbrechen
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.theme.colors.primary + '20', borderRadius: theme.theme.borderRadius.small }]}
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

      {/* Health data section */}
      {healthData && (
        <View style={[
          styles.summaryCard, 
          { 
            backgroundColor: theme.theme.colors.card,
            borderRadius: theme.theme.borderRadius.large,
            shadowColor: theme.theme.colors.shadow
          }
        ]}>
          <Text style={[
            styles.cardTitle, 
            { 
              fontFamily: theme.theme.typography.fontFamily.bold,
              color: theme.theme.colors.text
            }
          ]}>Aktivität</Text>
          
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                {healthData.steps}
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                Schritte
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                {caloriesBurned}
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                Kalorien verbrannt
              </Text>
            </View>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert
