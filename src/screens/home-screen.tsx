import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { HomeTabScreenProps } from '../types/navigation-types';
import { getDailyLogByDate, getUserProfile, saveUserProfile, saveDailyLog } from '../services/storage-service';
import { fetchHealthData, calculateTotalCaloriesBurned } from '../services/health-service';
import ProgressBar from '../components/ui/progress-bar';
import WaveAnimation from '../components/ui/wave-animation';
import { DailyLog, HealthData, UserProfile } from '../types';
import { useTheme } from '../theme/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    profile.activityLevel !== undefined
  );
}

export default function HomeScreen({ navigation }: HomeTabScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeight, setCurrentWeight] = useState<number | undefined>(undefined);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [isUpdatingWater, setIsUpdatingWater] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [manualWaterAmount, setManualWaterAmount] = useState('');

  // Format current date as ISO string date portion for today's log
  const today = new Date().toISOString().split('T')[0];

  // Load user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load user profile
        const profile = await getUserProfile();
        setUserProfile(profile);
        setCurrentWeight(profile?.weight);

        // Load today's log
        const log = await getDailyLogByDate(today);
        setTodayLog(log);

        // Load health data
        const health = await fetchHealthData();
        setHealthData(health);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    // Set up a refresh interval
    const refreshInterval = setInterval(loadUserData, 1000); // Refresh every second

    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [today]);

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
  const getGoals = () => {
    if (userProfile?.goals) {
      return userProfile.goals;
    }
    
    // Default goals if no user profile exists
    return {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000, // ml
    };
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

  // Funktion zum Hinzufügen von Wasser
  const addWater = async (amount: number) => {
    if (!todayLog) return;
    
    setIsUpdatingWater(true);
    try {
      // Aktualisiere lokalen State
      const updatedLog = {
        ...todayLog,
        waterIntake: todayLog.waterIntake + amount
      };
      
      setTodayLog(updatedLog);
      await saveDailyLog(updatedLog);
      
      // Animation wird automatisch durch Änderung des Prozentwerts ausgelöst
      // Optionale Toast/Feedback-Nachricht könnte hier hinzugefügt werden
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Wasserverbrauchs:', error);
    } finally {
      setIsUpdatingWater(false);
    }
  };

  // Funktion zum direkten Setzen des Wasserstands
  const setWaterAmount = async (amount: number) => {
    if (!todayLog) return;
    
    // Sicherstellen, dass der Wert nicht negativ ist
    const newAmount = Math.max(0, amount);
    
    setIsUpdatingWater(true);
    try {
      // Aktualisiere lokalen State
      const updatedLog = {
        ...todayLog,
        waterIntake: newAmount
      };
      
      setTodayLog(updatedLog);
      await saveDailyLog(updatedLog);
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
        <Text style={[
          styles.dateHeader, 
          { 
            fontFamily: theme.theme.typography.fontFamily.bold,
            color: theme.theme.colors.text
          }
        ]}>
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: 10,
    fontSize: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  scrollContent: {
    flex: 1,
  },
  dateHeader: {
    fontSize: 20, // Anpassung an die anderen Screens (wie headerText)
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
    padding: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 22,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
});
