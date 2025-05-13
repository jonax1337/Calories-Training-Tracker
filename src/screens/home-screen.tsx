import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { HomeTabScreenProps } from '../types/navigation-types';
import { getDailyLogByDate, getUserProfile } from '../services/storage-service';
import { fetchHealthData, calculateTotalCaloriesBurned } from '../services/health-service';
import ProgressBar from '../components/ui/progress-bar';
import { DailyLog, HealthData, UserProfile } from '../types';
import { useTheme } from '../theme/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }: HomeTabScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const refreshInterval = setInterval(loadUserData, 30000); // Refresh every 30 seconds

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
          calories: totals.calories + nutrition.calories * multiplier,
          protein: totals.protein + nutrition.protein * multiplier,
          carbs: totals.carbs + nutrition.carbs * multiplier,
          fat: totals.fat + nutrition.fat * multiplier,
          water: totals.water + todayLog.waterIntake,
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
  
  // Calculate calories burned
  const caloriesBurned = healthData 
    ? calculateTotalCaloriesBurned(
        healthData.steps, 
        healthData.activeCaloriesBurned, 
        userProfile?.weight
      )
    : 0;

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
            fontFamily: theme.theme.typography.fontFamily.medium,
            color: theme.theme.colors.text
          }
        ]}>
          {new Date().toLocaleDateString(undefined, { 
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
        ]}>Today's Nutrition</Text>
        
        <ProgressBar 
          label="Calories"
          current={Math.round(totals.calories)}
          target={goals.dailyCalories}
          color="#FF5722"
        />
        
        <ProgressBar 
          label="Protein"
          current={Math.round(totals.protein)}
          target={goals.dailyProtein || 50}
          color="#2196F3"
        />
        
        <ProgressBar 
          label="Carbs"
          current={Math.round(totals.carbs)}
          target={goals.dailyCarbs || 250}
          color="#4CAF50"
        />
        
        <ProgressBar 
          label="Fat"
          current={Math.round(totals.fat)}
          target={goals.dailyFat || 70}
          color="#FFC107"
        />
        
        <ProgressBar 
          label="Water (ml)"
          current={totals.water}
          target={goals.dailyWater || 2000}
          color="#03A9F4"
        />
      </View>

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
          ]}>Activity</Text>
          
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                {healthData.steps}
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                Steps
              </Text>
            </View>
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                {caloriesBurned}
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                Calories Burned
              </Text>
            </View>
            
            {healthData.heartRate && (
              <View style={styles.stat}>
                <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                  {healthData.heartRate}
                </Text>
                <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                  Heart Rate
                </Text>
              </View>
            )}
          </View>
          
          {healthData.sleepHours && (
            <View style={styles.stat}>
              <Text style={[styles.statValue, { fontFamily: theme.theme.typography.fontFamily.bold, color: theme.theme.colors.text }]}>
                {healthData.sleepHours}h
              </Text>
              <Text style={[styles.statLabel, { fontFamily: theme.theme.typography.fontFamily.regular, color: theme.theme.colors.textLight }]}>
                Sleep
              </Text>
            </View>
          )}
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
