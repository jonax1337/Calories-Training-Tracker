import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DailyLog, UserProfile, UserGoals } from '../../types';
import { useTheme } from '../../theme/theme-context';
import { getDailyLogs } from '../../services/storage-service';

interface NutritionReportProps {
  userProfile: UserProfile | null;
  userGoals: UserGoals;
  days?: number; // Anzahl der Tage für den Rückblick, Standard 30
  compact?: boolean; // Kompakte Ansicht für Home-Screen
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  date: string;
}

// Hilfsfunktion zum Berechnen der Nährwerte eines Tages
const calculateDailyTotals = (log: DailyLog): NutritionTotals => {
  if (!log || !log.foodEntries || log.foodEntries.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, water: log?.waterIntake || 0, date: log?.date || '' };
  }

  const totals = log.foodEntries.reduce(
    (acc, entry) => {
      const { nutrition } = entry.foodItem;
      const multiplier = entry.servingAmount;

      return {
        calories: acc.calories + nutrition.calories * (multiplier / 100),
        protein: acc.protein + nutrition.protein * (multiplier / 100),
        carbs: acc.carbs + nutrition.carbs * (multiplier / 100),
        fat: acc.fat + nutrition.fat * (multiplier / 100),
        water: acc.water,
        date: acc.date,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, water: log.waterIntake || 0, date: log.date }
  );

  return totals;
};

// Hauptkomponente
const NutritionReportComponent = ({ userProfile, userGoals, days = 30, compact = false }: NutritionReportProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.theme);
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<NutritionTotals[]>([]);
  const [averages, setAverages] = useState<NutritionTotals | null>(null);
  const [goalAchievement, setGoalAchievement] = useState<{[key: string]: number}>({});
  const screenWidth = Dimensions.get('window').width - 32; // 16px Padding auf jeder Seite

  // Laden der Log-Daten für die letzten X Tage
  useEffect(() => {
    async function loadNutritionData() {
      setIsLoading(true);
      try {
        // Hole alle täglichen Logs
        const allLogs = await getDailyLogs();
        
        // Sortiere nach Datum (neueste zuerst) und beschränke auf die angegebene Anzahl von Tagen
        const sortedLogs = allLogs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, days);
        
        // Berechne Nährwert-Totals für jeden Tag
        const totals = sortedLogs.map(log => calculateDailyTotals(log));
        
        // Sortiere wieder nach Datum (älteste zuerst) für die Charts
        totals.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setReportData(totals);
        
        // Berechne Durchschnitte
        if (totals.length > 0) {
          const avgTotals = {
            calories: totals.reduce((sum, day) => sum + day.calories, 0) / totals.length,
            protein: totals.reduce((sum, day) => sum + day.protein, 0) / totals.length,
            carbs: totals.reduce((sum, day) => sum + day.carbs, 0) / totals.length,
            fat: totals.reduce((sum, day) => sum + day.fat, 0) / totals.length,
            water: totals.reduce((sum, day) => sum + day.water, 0) / totals.length,
            date: 'average'
          };
          setAverages(avgTotals);
          
          // Berechne Zielerreichung in Prozent
          setGoalAchievement({
            calories: (avgTotals.calories / userGoals.dailyCalories) * 100,
            protein: userGoals.dailyProtein ? (avgTotals.protein / userGoals.dailyProtein) * 100 : 0,
            carbs: userGoals.dailyCarbs ? (avgTotals.carbs / userGoals.dailyCarbs) * 100 : 0,
            fat: userGoals.dailyFat ? (avgTotals.fat / userGoals.dailyFat) * 100 : 0,
            water: userGoals.dailyWater ? (avgTotals.water / userGoals.dailyWater) * 100 : 0
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ernährungsdaten:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNutritionData();
  }, [days, userGoals]);

  // Wenn noch geladen wird oder keine Daten verfügbar sind
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.theme.colors.primary} />
        <Text style={styles.loadingText}>Ernährungsdaten werden geladen...</Text>
      </View>
    );
  }

  if (reportData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Keine Ernährungsdaten für die letzten {days} Tage verfügbar.</Text>
      </View>
    );
  }

  // Daten für Kalorien-Chart vorbereiten
  const caloriesChartData = {
    labels: reportData.map(day => {
      // Formatiere das Datum als Tag.Monat
      const date = new Date(day.date);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    }).slice(-7), // Beschränke auf die letzten 7 Tage für bessere Lesbarkeit
    datasets: [
      {
        data: reportData.map(day => day.calories).slice(-7),
        color: (opacity = 1) => theme.theme.colors.nutrition.calories + opacity.toString().substring(1),
        strokeWidth: 2
      },
      {
        data: Array(Math.min(reportData.length, 7)).fill(userGoals.dailyCalories),
        color: (opacity = 1) => theme.theme.colors.success + opacity.toString().substring(1),
        strokeWidth: 2,
        strokeDashArray: [5, 5] // Gestrichelte Linie
      }
    ],
    legend: ["Kalorien", "Ziel"]
  };

  // Daten für Nährstoff-Verteilung (Protein, Kohlenhydrate, Fett)
  const macrosData = {
    labels: ["Protein", "Kohlenhydrate", "Fett"],
    datasets: [{
      data: [
        averages?.protein || 0,
        averages?.carbs || 0,
        averages?.fat || 0
      ]
    }],
    barColors: [
      theme.theme.colors.nutrition.protein,
      theme.theme.colors.nutrition.carbs,
      theme.theme.colors.nutrition.fat
    ]
  };

  // Kompakte Ansicht für den Home-Screen
  if (compact) {
    return (
      <View style={styles.compactContainer}>        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItemLeft}>
            <Text style={[styles.summaryLabel, { textAlign: 'left' }]}>Kalorien Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'left' }]}>{averages?.calories.toFixed(0)} kcal</Text>
          </View>

          <View style={styles.summaryItemCenter}>
            <Text style={[styles.summaryLabel, { textAlign: 'center' }]}>Protein Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'center' }]}>{averages?.protein.toFixed(2)} g</Text>
          </View>
          
          <View style={styles.summaryItemRight}>
            <Text style={[styles.summaryLabel, { textAlign: 'right' }]}>Wasser Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'right' }]}>{((averages?.water || 0) / 1000).toFixed(2)} L</Text>
          </View>
        </View>
      </View>
    );
  }

  // Vollständige Ansicht für den Report-Screen
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ernährungsbericht der letzten {days} Tage</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kalorienverlauf (letzte 7 Tage)</Text>
        <LineChart
          data={caloriesChartData}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: theme.theme.colors.card,
            backgroundGradientFrom: theme.theme.colors.card,
            backgroundGradientTo: theme.theme.colors.card,
            decimalPlaces: 2,
            color: (opacity = 1) => theme.theme.colors.nutrition.calories + opacity.toString().substring(1),
            labelColor: (opacity = 1) => theme.theme.colors.text,
            style: {
              borderRadius: theme.theme.borderRadius.medium
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: theme.theme.colors.primary
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Makronährstoffe (Durchschnitt)</Text>
        <BarChart
          data={macrosData}
          width={screenWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix="g"
          chartConfig={{
            backgroundColor: theme.theme.colors.card,
            backgroundGradientFrom: theme.theme.colors.card,
            backgroundGradientTo: theme.theme.colors.card,
            decimalPlaces: 2,
            color: (opacity = 1) => theme.theme.colors.text + opacity.toString().substring(1),
            labelColor: (opacity = 1) => theme.theme.colors.text,
            style: {
              borderRadius: theme.theme.borderRadius.medium
            },
            barPercentage: 0.8,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zielerreichung (Durchschnitt)</Text>
        
        <View style={styles.goalItem}>
          <Text style={styles.goalLabel}>Kalorien:</Text>
          <View style={styles.goalBarContainer}>
            <View 
              style={[
                styles.goalBar, 
                {width: `${Math.min(goalAchievement.calories, 150)}%`},
                goalAchievement.calories < 90 ? styles.belowGoalBar : 
                goalAchievement.calories > 110 ? styles.aboveGoalBar : 
                styles.onTargetBar
              ]} 
            />
            <Text style={styles.goalText}>
              {averages?.calories.toFixed(2)} / {userGoals.dailyCalories} kcal ({goalAchievement.calories.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {userGoals.dailyProtein && (
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Protein:</Text>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  {width: `${Math.min(goalAchievement.protein, 150)}%`},
                  goalAchievement.protein < 90 ? styles.belowGoalBar : 
                  goalAchievement.protein > 110 ? styles.aboveGoalBar : 
                  styles.onTargetBar
                ]} 
              />
              <Text style={styles.goalText}>
                {averages?.protein.toFixed(2)} / {userGoals.dailyProtein} g ({goalAchievement.protein.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}

        {userGoals.dailyCarbs && (
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Kohlenhydrate:</Text>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  {width: `${Math.min(goalAchievement.carbs, 150)}%`},
                  goalAchievement.carbs < 90 ? styles.belowGoalBar : 
                  goalAchievement.carbs > 110 ? styles.aboveGoalBar : 
                  styles.onTargetBar
                ]} 
              />
              <Text style={styles.goalText}>
                {averages?.carbs.toFixed(2)} / {userGoals.dailyCarbs} g ({goalAchievement.carbs.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}

        {userGoals.dailyFat && (
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Fett:</Text>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  {width: `${Math.min(goalAchievement.fat, 150)}%`},
                  goalAchievement.fat < 90 ? styles.belowGoalBar : 
                  goalAchievement.fat > 110 ? styles.aboveGoalBar : 
                  styles.onTargetBar
                ]} 
              />
              <Text style={styles.goalText}>
                {averages?.fat.toFixed(2)} / {userGoals.dailyFat} g ({goalAchievement.fat.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}

        {userGoals.dailyWater && (
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Wasser:</Text>
            <View style={styles.goalBarContainer}>
              <View 
                style={[
                  styles.goalBar, 
                  {width: `${Math.min(goalAchievement.water, 150)}%`},
                  goalAchievement.water < 90 ? styles.belowGoalBar : 
                  goalAchievement.water > 110 ? styles.aboveGoalBar : 
                  styles.onTargetBar
                ]} 
              />
              <Text style={styles.goalText}>
                {((averages?.water || 0) / 1000).toFixed(2)} / {(userGoals.dailyWater / 1000).toFixed(2)} L ({goalAchievement.water.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Styles
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  compactContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m,
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.m,
    color: theme.colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    width: 110,
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  goalBarContainer: {
    flex: 1,
    height: 25,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  goalBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  goalText: {
    position: 'absolute',
    left: theme.spacing.s,
    top: 4,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.background,
  },
  belowGoalBar: {
    backgroundColor: theme.colors.warning,
  },
  onTargetBar: {
    backgroundColor: theme.colors.success,
  },
  aboveGoalBar: {
    backgroundColor: theme.colors.error,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.xs,
  },
  summaryItemCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  summaryItemRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
    marginBottom: 4,
    width: '100%', // Damit die Labels die volle Breite des Containers nutzen
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
  percentText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 2,
    width: '100%', // Damit die Prozenttexte die volle Breite des Containers nutzen
  },
  belowGoal: {
    color: theme.colors.warning,
  },
  onTarget: {
    color: theme.colors.success,
  },
  aboveGoal: {
    color: theme.colors.error,
  },
});

export default NutritionReportComponent;
