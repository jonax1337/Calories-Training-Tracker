import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { 
  VictoryChart, 
  VictoryLine, 
  VictoryScatter,
  VictoryTheme, 
  VictoryAxis, 
  VictoryContainer
} from 'victory-native';
import LineChartCard from '../charts/line-chart-card';
import { DailyLog, UserProfile, UserGoals } from '../../types';
import { useTheme } from '../../theme/theme-context';
import { useDateContext } from '../../context/date-context';
import { getDailyLogs } from '../../services/storage-service';
import { getTodayFormatted } from '../../utils/date-utils';

interface NutritionReportProps {
  userProfile: UserProfile | null;
  userGoals: UserGoals;
  days?: number; // Anzahl der Tage für den Rückblick, Standard 30
  compact?: boolean; // Kompakte Ansicht für Home-Screen
  selectedDate?: string; // Optional: Übergebenes Datum als Bezugspunkt
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  potassium: number;
  water: number;
  date: string;
}

// Hilfsfunktion zum Berechnen der Nährwerte eines Tages
const calculateDailyTotals = (log: DailyLog): NutritionTotals => {
  if (!log || !log.foodEntries || log.foodEntries.length === 0) {
    return { 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0, 
      sugar: 0,
      fiber: 0,
      sodium: 0,
      potassium: 0,
      water: log?.waterIntake || 0, 
      date: log?.date || '' 
    };
  }

  const totals = log.foodEntries.reduce(
    (acc, entry) => {
      const { nutrition } = entry.foodItem;
      const multiplier = entry.servingAmount;

      return {
        calories: acc.calories + (nutrition?.calories || 0) * (multiplier / 100),
        protein: acc.protein + (nutrition?.protein || 0) * (multiplier / 100),
        carbs: acc.carbs + (nutrition?.carbs || 0) * (multiplier / 100),
        fat: acc.fat + (nutrition?.fat || 0) * (multiplier / 100),
        sugar: acc.sugar + (nutrition?.sugar || 0) * (multiplier / 100),
        fiber: acc.fiber + (nutrition?.fiber || 0) * (multiplier / 100),
        sodium: acc.sodium + (nutrition?.sodium || 0) * (multiplier / 100),
        // NaN-Sicherheit für Kalium hinzugefügt
        potassium: acc.potassium + (nutrition?.potassium !== undefined && !isNaN(nutrition.potassium) ? nutrition.potassium : 0) * (multiplier / 100),
        water: acc.water,
        date: acc.date,
      };
    },
    { 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0, 
      sugar: 0,
      fiber: 0,
      sodium: 0,
      potassium: 0,
      water: log.waterIntake || 0, 
      date: log.date 
    }
  );

  return totals;
};

// Hauptkomponente
const NutritionReportComponent = ({ 
  userGoals, 
  days = 30, 
  compact = false, 
  selectedDate: propSelectedDate, 
}: NutritionReportProps) => {
  const theme = useTheme();
  const styles = createStyles(theme.theme);
  const { selectedDate: contextSelectedDate } = useDateContext();
  
  // Verwende das übergebene Datum oder das Datum aus dem Context, oder als Fallback das heutige Datum
  const selectedDate = propSelectedDate || contextSelectedDate || getTodayFormatted();
  
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<NutritionTotals[]>([]);
  const [averages, setAverages] = useState<NutritionTotals | null>(null);
  const [goalAchievement, setGoalAchievement] = useState<{[key: string]: number}>({});
  // Breite abhängig von Verwendung berechnen
  const isInScreen = !compact; // Wenn nicht compact, wird es in einem Screen verwendet
  const screenWidth = isInScreen 
    ? Dimensions.get('window').width - (theme.theme.spacing.m * 2) // Nur Screen-Padding
    : Dimensions.get('window').width - (theme.theme.spacing.m * 4); // Screen + Card Padding

  // Laden der Log-Daten für die letzten X Tage, ausgehend vom ausgewählten Datum
  useEffect(() => {
    console.log(`Lade Ernährungsbericht mit Bezugsdatum: ${selectedDate}`);
    async function loadNutritionData() {
      setIsLoading(true);
      try {
        // Hole alle täglichen Logs
        const allLogs = await getDailyLogs();
        
        // Referenzdatum erstellen aus dem ausgewählten Datum
        const referenceDate = new Date(selectedDate);
        
        // Erstelle ALLE angeforderten Tage (auch ohne Daten)
        const allRequestedDays: NutritionTotals[] = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const currentDate = new Date(referenceDate);
          currentDate.setDate(currentDate.getDate() - i);
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Suche nach vorhandenem Log für diesen Tag
          const existingLog = allLogs.find(log => log.date === dateString);
          
          if (existingLog) {
            // Verwende vorhandene Daten
            allRequestedDays.push(calculateDailyTotals(existingLog));
          } else {
            // Erstelle leeren Tag
            allRequestedDays.push({
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              sugar: 0,
              fiber: 0,
              sodium: 0,
              potassium: 0,
              water: 0,
              date: dateString
            });
          }
        }
        
        // Sortiere nach Datum (älteste zuerst) für die Charts
        allRequestedDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setReportData(allRequestedDays);
        
        // Berechne Durchschnitte - nur für Tage mit tatsächlichen Einträgen (> 0)
        const daysWithData = allRequestedDays.filter(day => day.calories > 0);
        
        if (daysWithData.length > 0) {
          const avgTotals = {
            calories: daysWithData.reduce((sum, day) => sum + day.calories, 0) / daysWithData.length,
            protein: daysWithData.reduce((sum, day) => sum + day.protein, 0) / daysWithData.length,
            carbs: daysWithData.reduce((sum, day) => sum + day.carbs, 0) / daysWithData.length,
            fat: daysWithData.reduce((sum, day) => sum + day.fat, 0) / daysWithData.length,
            sugar: daysWithData.reduce((sum, day) => sum + day.sugar, 0) / daysWithData.length,
            fiber: daysWithData.reduce((sum, day) => sum + day.fiber, 0) / daysWithData.length,
            sodium: daysWithData.reduce((sum, day) => sum + day.sodium, 0) / daysWithData.length,
            potassium: daysWithData.reduce((sum, day) => sum + day.potassium, 0) / daysWithData.length,
            water: daysWithData.reduce((sum, day) => sum + day.water, 0) / daysWithData.length,
            date: 'average'
          };
          
          console.log(`Durchschnitte berechnet - Tage mit Daten: ${daysWithData.length}/${allRequestedDays.length}`);
          setAverages(avgTotals);
          
          // Berechne Zielerreichung in Prozent
          setGoalAchievement({
            calories: (avgTotals.calories / userGoals.dailyCalories) * 100,
            protein: userGoals.dailyProtein ? (avgTotals.protein / userGoals.dailyProtein) * 100 : 0,
            carbs: userGoals.dailyCarbs ? (avgTotals.carbs / userGoals.dailyCarbs) * 100 : 0,
            fat: userGoals.dailyFat ? (avgTotals.fat / userGoals.dailyFat) * 100 : 0,
            water: userGoals.dailyWater ? (avgTotals.water / userGoals.dailyWater) * 100 : 0
          });
        } else {
          // Keine Daten vorhanden - setze alles auf 0
          setAverages({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sugar: 0,
            fiber: 0,
            sodium: 0,
            potassium: 0,
            water: 0,
            date: 'average'
          });
          setGoalAchievement({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            water: 0
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Ernährungsdaten:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadNutritionData();
  }, [days, userGoals, selectedDate]);

  if (reportData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Keine Ernährungsdaten für die letzten {days} Tage verfügbar.</Text>
      </View>
    );
  }

  // Funktion zur Vorbereitung der Grafik-Daten mit Datenvalidierung
  function prepareNutritionData() {
    const data = reportData.map((day, index) => ({
      x: index + 1,
      calories: day.calories || 0,
      protein: day.protein || 0,
      carbs: day.carbs || 0,
      fat: day.fat || 0,
      sugar: day.sugar || 0,
      fiber: day.fiber || 0,
      sodium: day.sodium || 0,
      potassium: day.potassium || 0,
      water: day.water || 0,
      date: day.date,
      dateLabel: new Date(day.date).getDate() + '.' + (new Date(day.date).getMonth() + 1) + '.'
    }));
    
    return data;
  };
  
  // Ziellinie für das Kaloriendiagramm
  const prepareCalorieGoalData = () => {
    // Flache Linie bei einem konstanten y-Wert (Kalorienziel)
    return reportData.map((_, index) => ({
      x: index + 1,
      y: userGoals.dailyCalories || 0
    }));
  };
  
  // Ziellinien für die Makronährstoffe
  const prepareProteinGoalData = () => {
    return reportData.map((_, index) => ({
      x: index + 1,
      y: userGoals.dailyProtein || 0
    }));
  };
  
  const prepareCarbohydrateGoalData = () => {
    return reportData.map((_, index) => ({
      x: index + 1,
      y: userGoals.dailyCarbs || 0
    }));
  };
  
  const prepareFatGoalData = () => {
    return reportData.map((_, index) => ({
      x: index + 1,
      y: userGoals.dailyFat || 0
    }));
  };

  // Safety check: Wenn keine Durchschnittsdaten vorhanden sind, erstelle leere Defaults
  if (!averages) {
    console.log('Keine Durchschnittsdaten vorhanden, erstelle Default-Werte');
    setAverages({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sugar: 0,
      fiber: 0,
      sodium: 0,
      potassium: 0,
      water: 0,
      date: 'average'
    });
  }

  // Kompakte Ansicht für den Home-Screen
  if (compact) {
    return (
      <View style={styles.compactContainer}>        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItemLeft}>
            <Text style={[styles.summaryLabel, { textAlign: 'center' }]}>Kalorien Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'center' }]}>{averages && !isNaN(averages.calories) ? averages.calories.toFixed(0) : '0'} kcal</Text>
          </View>

          <View style={styles.summaryItemCenter}>
            <Text style={[styles.summaryLabel, { textAlign: 'center' }]}>Protein Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'center' }]}>{averages && !isNaN(averages.protein) ? averages.protein.toFixed(1) : '0'} g</Text>
          </View>
          
          <View style={styles.summaryItemRight}>
            <Text style={[styles.summaryLabel, { textAlign: 'center' }]}>Wasser Ø</Text>
            <Text style={[styles.summaryValue, { textAlign: 'center' }]}>{Math.round((averages && !isNaN(averages.water)) ? averages.water : 0)} ml</Text>
          </View>
        </View>
      </View>
    );
  }

  // Vollständige Ansicht für den Report-Screen (Schritt 3)
  const nutritionData = prepareNutritionData();

  return (
    <ScrollView style={styles.container}>
      {/* Hauptchart mit Kalorienverlauf - Neue modulare Komponente */}
      <LineChartCard 
        title={`Kalorienverlauf`}
        data={nutritionData}
        lines={[
          {
            dataKey: "calories",
            color: theme.theme.colors.nutrition.calories,
            label: "Kalorien",
            showGoal: true,
            goalValue: userGoals.dailyCalories,
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Hauptchart mit Nährwerten - Neue modulare Komponente */}
      <LineChartCard 
        title={`Nährwerte`}
        data={nutritionData}
        lines={[
          {
            dataKey: "protein",
            color: theme.theme.colors.nutrition.protein,
            label: "Protein",
            showGoal: true,
            goalValue: userGoals.dailyProtein,
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "carbs",
            color: theme.theme.colors.nutrition.carbs,
            label: "Kohlenhydrate",
            showGoal: true,
            goalValue: userGoals.dailyCarbs,
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "fat",
            color: theme.theme.colors.nutrition.fat,
            label: "Fett",
            showGoal: true,
            goalValue: userGoals.dailyFat,
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Wasseraufnahme Chart */}
      <LineChartCard 
        title={`Wasseraufnahme`}
        data={nutritionData}
        lines={[
          {
            dataKey: "water",
            color: theme.theme.colors.primary,
            label: "Wasser",
            showGoal: userGoals.dailyWater != null,
            goalValue: userGoals.dailyWater,
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Zucker und Ballaststoffe Chart */}
      <LineChartCard 
        title={`Zucker und Ballaststoffe`}
        data={nutritionData}
        lines={[
          {
            dataKey: "sugar",
            color: theme.theme.colors.warning,  // Akzentfarbe für Zucker
            label: "Zucker",
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "fiber",
            color: theme.theme.colors.success,  // Erfolgsfarbe für Ballaststoffe
            label: "Ballaststoffe",
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        height={150}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Natrium Chart */}
      <LineChartCard 
        title={`Natrium und Kalium`}
        data={nutritionData}
        lines={[
          {
            dataKey: "sodium",
            color: theme.theme.colors.error,  // Sekundärfarbe für Natrium
            label: "Natrium",
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "potassium",
            color: theme.theme.colors.info,  // Info-Farbe für Kalium
            label: "Kalium",
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        height={150}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
        yAxis={{ 
          tickFormat: (t) => `${t && !isNaN(t) ? t.toFixed(1) : '0'}`
        }}
      />
    </ScrollView>
  );
};

// Styles
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  compactContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.m,
    width: '100%',
  },
  loadingContainer: {
    padding: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
  },
  loadingText: {
    marginTop: theme.spacing.s,
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  emptyContainer: {
    padding: theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    elevation: 2,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.m,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.l,
    color: theme.colors.text,
    textAlign: 'center',
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.large,
    elevation: 3,
    overflow: 'hidden', // Wichtig für Charts
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.s,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
  },
  chartContainer: {
    marginBottom: theme.spacing.s,
    alignItems: 'center', // Zentriert die Charts
  },
  legendContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: theme.spacing.xs,
  },
  legendDash: {
    width: 12,
    height: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textLight,
  },
  goalSection: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
  },
  goalLabel: {
    width: 110,
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  goalBarContainer: {
    flex: 1,
    height: 28,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.small,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  goalBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: theme.borderRadius.small,
  },
  goalText: {
    position: 'absolute',
    left: theme.spacing.s,
    top: 6,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.background,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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
    alignItems: 'center',
  },
  summaryItemLeft: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  summaryItemCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryItemRight: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.s,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    width: '100%',
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
  },
});

export default NutritionReportComponent;