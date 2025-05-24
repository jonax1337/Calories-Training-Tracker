import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { HomeTabScreenProps } from '../types/navigation-types';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyLogByDate, saveUserProfile, saveDailyLog } from '../services/storage-service';
import { fetchUserProfile, fetchUserGoals } from '../services/profile-api';
import { fetchHealthData, calculateTotalCaloriesBurned } from '../services/health-service';
import ProgressBar from '../components/ui/progress-bar';
import WaveAnimation from '../components/ui/wave-animation';
import { DailyLog, HealthData, UserProfile, UserGoals } from '../types';
import { useTheme } from '../theme/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatToLocalISODate, getTodayFormatted } from '../utils/date-utils';
import { useDateContext } from '../context/date-context';
import { createHomeStyles } from '../styles/screens/home-styles';

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

      // Load active user goal's nutritional targets
      const currentUserGoals = await fetchUserGoals(); // Fetches UserGoal[]
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
        console.log('[DEBUG] HomeScreen - Active goal targets set from fetchUserGoals:', activeGoal);
        console.log('[DEBUG] HomeScreen - activeGoalTargets.dailyCalories:', activeGoalTargets?.dailyCalories, 'Type:', typeof activeGoalTargets?.dailyCalories);
      } else if (profile?.goals) {
        // Fallback to goals possibly stored in the main user profile if no specific active goal found
        setActiveGoalTargets(profile.goals);
        console.log('[DEBUG] HomeScreen - Active goal targets set from profile.goals (fallback).');
        console.log('[DEBUG] HomeScreen - Fallback activeGoalTargets.dailyCalories:', activeGoalTargets?.dailyCalories, 'Type:', typeof activeGoalTargets?.dailyCalories);
      } else {
        setActiveGoalTargets(null); // Or set to default goals
        console.log('[DEBUG] HomeScreen - No active goal targets found, set to null.');
      }

      // Load the selected date's log
      console.log(`Loading data for date: ${selectedDate}`);
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
          calories: totals.calories + nutrition.calories * (multiplier / 100),
          protein: totals.protein + nutrition.protein * (multiplier / 100),
          carbs: totals.carbs + nutrition.carbs * (multiplier / 100),
          fat: totals.fat + nutrition.fat * (multiplier / 100),
          water: totals.water,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayLog.waterIntake }
    );
  };

  // Get default goals or from user profile
  const getGoals = (): UserGoals => {
    console.log('[DEBUG] HomeScreen - getGoals called. Current activeGoalTargets:', JSON.stringify(activeGoalTargets));
    console.log('[DEBUG] HomeScreen - getGoals: userProfile.goals:', JSON.stringify(userProfile?.goals));
    if (activeGoalTargets && typeof activeGoalTargets.dailyCalories === 'number') {
      console.log('[DEBUG] HomeScreen - getGoals returning activeGoalTargets:', JSON.stringify(activeGoalTargets));
      return activeGoalTargets;
    } else if (activeGoalTargets) {
      console.warn('[DEBUG] HomeScreen - getGoals: activeGoalTargets found but dailyCalories is not a number. Value:', activeGoalTargets.dailyCalories);
    }
    // Fallback to userProfile.goals if activeGoalTargets isn't set (e.g. during initial load or error)
    if (userProfile?.goals) {
      console.warn('[DEBUG] HomeScreen - getGoals falling back to userProfile.goals');
      return userProfile.goals;
    }
    
    // Default goals if no user profile or active goal targets exist
    console.warn('[DEBUG] HomeScreen - getGoals falling back to default hardcoded goals');
    const defaultGoals = {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000, // ml
    };
    console.log('[DEBUG] HomeScreen - getGoals returning default goals:', JSON.stringify(defaultGoals));
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

  // Funktion zum Erhöhen des Gewichts
  const incrementWeight = () => {
    if (currentWeight !== undefined) {
      updateWeight(parseFloat((currentWeight + 0.1).toFixed(1)));
    }
  };
  
  // Funktion zum Verringern des Gewichts
  const decrementWeight = () => {
    if (currentWeight !== undefined && currentWeight > 0.1) {
      updateWeight(parseFloat((currentWeight - 0.1).toFixed(1)));
    }
  };

  // Funktion zum Hinzufügen von Wasser mit Debouncing
  const addWater = async (amount: number) => {
    // Skip if no log or already updating
    if (!todayLog) return;
    
    // Implement debouncing - prevent updates too close together
    const now = Date.now();
    const minTimeBetweenUpdates = 500; // 500ms minimum between updates
    
    if (isUpdatingWater || (now - lastWaterUpdateTime < minTimeBetweenUpdates)) {
      console.log('Skipping water update - too soon after previous update');
      return;
    }
    
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

  // Check if profile is complete - if not, show a message directing to profile screen
  if (!isProfileComplete(userProfile)) {
    return (
      <View style={[styles.container, { 
        backgroundColor: theme.theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 
      }]}>
        <View style={{
          backgroundColor: theme.theme.colors.card,
          borderRadius: 16,
          padding: 24,
          width: '100%',
          alignItems: 'center',
          shadowColor: theme.theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Ionicons name="person-circle-outline" size={80} color={theme.theme.colors.primary} style={{ marginBottom: 20 }} />
          <Text style={{
            fontFamily: theme.theme.typography.fontFamily.bold,
            fontSize: 22,
            color: theme.theme.colors.text,
            textAlign: 'center',
            marginBottom: 12
          }}>
            Profil vervollständigen
          </Text>
          <Text style={{
            fontFamily: theme.theme.typography.fontFamily.regular,
            fontSize: 16,
            color: theme.theme.colors.secondary,
            textAlign: 'center',
            marginBottom: 24
          }}>
            Bitte vervollständige dein Profil, um deine Kalorien und Aktivitäten richtig zu verfolgen.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.theme.colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              width: '100%',
              alignItems: 'center'
            }}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.medium,
              fontSize: 16,
              color: '#fff'
            }}>
              Zum Profil
            </Text>
          </TouchableOpacity>
        </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
          <TouchableOpacity
            onPress={() => {
              const prevDate = new Date(selectedDate);
              prevDate.setDate(prevDate.getDate() - 1);
              setSelectedDate(formatToLocalISODate(prevDate));
            }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowCalendarModal(true)}>
            <Text style={[
              styles.dateHeader, 
              { 
                fontFamily: theme.theme.typography.fontFamily.bold,
                color: selectedDate === getTodayFormatted() ? theme.theme.colors.primary : theme.theme.colors.text
              }
            ]}>
              {new Date(selectedDate).toLocaleDateString('de-DE', { 
                weekday: 'long', 
                day: 'numeric',
                month: 'long', 
                year: 'numeric'
              })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              const nextDate = new Date(selectedDate);
              nextDate.setDate(nextDate.getDate() + 1);
              setSelectedDate(formatToLocalISODate(nextDate));
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <View 
            style={{
              width: '100%',
              backgroundColor: theme.theme.colors.card,
              borderRadius: 16,
              padding: 16,
              shadowColor: theme.theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ 
                fontFamily: theme.theme.typography.fontFamily.bold,
                fontSize: 18,
                color: theme.theme.colors.text
              }}>
                Datum auswählen
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Ionicons name="close" size={24} color={theme.theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowCalendarModal(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: theme.theme.colors.primary }
              }}
              theme={{
                calendarBackground: theme.theme.colors.card,
                textSectionTitleColor: theme.theme.colors.text,
                selectedDayBackgroundColor: theme.theme.colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.theme.colors.primary,
                dayTextColor: theme.theme.colors.text,
                textDisabledColor: theme.theme.colors.border,
                monthTextColor: theme.theme.colors.text,
                arrowColor: theme.theme.colors.primary,
                textDayFontFamily: theme.theme.typography.fontFamily.regular,
                textMonthFontFamily: theme.theme.typography.fontFamily.medium,
                textDayHeaderFontFamily: theme.theme.typography.fontFamily.medium
              }}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.theme.colors.border,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setSelectedDate(getTodayFormatted());
                  setShowCalendarModal(false);
                }}
              >
                <Text style={{ 
                  fontFamily: theme.theme.typography.fontFamily.medium,
                  color: theme.theme.colors.text
                }}>
                  Heute
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: theme.theme.colors.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center'
                }}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={{ 
                  fontFamily: theme.theme.typography.fontFamily.medium,
                  color: '#ffffff'
                }}>
                  Schließen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
        <Text style={[
          styles.cardTitle, 
          { 
            fontFamily: theme.theme.typography.fontFamily.bold,
            color: theme.theme.colors.text
          }
        ]}>Heutige Nährwerte</Text>
        
        <ProgressBar 
          label="🔥 Kalorien"
          current={Math.round(totals.calories)}
          target={goals.dailyCalories}
          color="#FF5722"
        />
        
        <ProgressBar 
          label="🍗 Protein"
          current={Math.round(totals.protein)}
          target={goals.dailyProtein || 50}
          color="#2196F3"
        />
        
        <ProgressBar 
          label="🍞 Kohlenhydrate"
          current={Math.round(totals.carbs)}
          target={goals.dailyCarbs || 250}
          color="#4CAF50"
        />
        
        <ProgressBar 
          label="🧈 Fette"
          current={Math.round(totals.fat)}
          target={goals.dailyFat || 70}
          color="#FFC107"
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
      
        <View style={{ height: 160, marginVertical: 8 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openWaterModal}
            style={{ width: '100%', height: '100%' }}
          >
            <WaveAnimation 
              fillPercentage={Math.min((totals.water / (goals.dailyWater || 2000)) * 100, 100)} 
              color="#03A9F4"
              text={`${totals.water} / ${goals.dailyWater || 2000} ml`}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 8 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(3, 169, 244, 0.2)",
              borderRadius: theme.theme.borderRadius.medium,
              paddingVertical: 16,
              paddingHorizontal: 16,
              width: 96,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 8,
            }}
            onPress={() => addWater(100)}
            disabled={isUpdatingWater}
          >
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.medium,
              color: "#03A9F4",
              fontSize: 16,
            }}>
              +100 ml
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(3, 169, 244, 0.2)",
              borderRadius: theme.theme.borderRadius.medium,
              paddingVertical: 16,
              paddingHorizontal: 16,
              width: 96,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 8,
            }}
            onPress={() => addWater(250)}
            disabled={isUpdatingWater}
          >
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.medium,
              color: "#03A9F4",
              fontSize: 16,
            }}>
              +250 ml
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(3, 169, 244, 0.2)",
              borderRadius: theme.theme.borderRadius.medium,
              paddingVertical: 16,
              paddingHorizontal: 16,
              width: 96,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 8,
            }}
            onPress={() => addWater(500)}
            disabled={isUpdatingWater}
          >
            <Text style={{
              fontFamily: theme.theme.typography.fontFamily.medium,
              color: "#03A9F4",
              fontSize: 16,
            }}>
              +500 ml
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
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
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
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
            <Ionicons name="remove" size={24} color="white" />
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
              {(currentWeight !== undefined && currentWeight !== null) ? `${currentWeight.toFixed(1)} kg` : '-'}
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
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
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
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.theme.colors.background,
                  color: theme.theme.colors.text,
                  borderRadius: theme.theme.borderRadius.small,
                  fontFamily: theme.theme.typography.fontFamily.medium
                }]}
                value={manualWaterAmount}
                onChangeText={setManualWaterAmount}
                keyboardType="number-pad"
                placeholder="Wassermenge in ml"
                placeholderTextColor={theme.theme.colors.textLight}
              />
              <Text style={{ fontFamily: theme.theme.typography.fontFamily.medium, color: theme.theme.colors.textLight, marginLeft: 8 }}>ml</Text>
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
