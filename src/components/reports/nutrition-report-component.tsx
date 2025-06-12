import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
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
import { createNutritionReportComponentStyles } from '../../styles/components/reports/nutrition-report-component-styles';

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
  isCheatDay?: boolean; // Cheat Day Status
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
      date: log?.date || '',
      isCheatDay: log?.isCheatDay || false // Cheat Day Status übernehmen
    };
  }

  const totals = log.foodEntries.reduce<NutritionTotals>(
    (acc, entry) => {
      const { nutrition } = entry.foodItem;
      const multiplier = entry.servingAmount;

      return {
        calories: acc.calories + ((nutrition?.calories || 0) * (multiplier / 100)),
        protein: acc.protein + ((nutrition?.protein || 0) * (multiplier / 100)),
        carbs: acc.carbs + ((nutrition?.carbs || 0) * (multiplier / 100)),
        fat: acc.fat + ((nutrition?.fat || 0) * (multiplier / 100)),
        sugar: acc.sugar + ((nutrition?.sugar || 0) * (multiplier / 100)),
        fiber: acc.fiber + ((nutrition?.fiber || 0) * (multiplier / 100)),
        sodium: acc.sodium + ((nutrition?.sodium !== undefined && !isNaN(nutrition.sodium) ? nutrition.sodium : 0) * (multiplier / 100)),
        potassium: acc.potassium + ((nutrition?.potassium !== undefined && !isNaN(nutrition.potassium) ? nutrition.potassium : 0) * (multiplier / 100)),
        water: acc.water,
        date: acc.date,
        isCheatDay: acc.isCheatDay // Cheat Day Status übernehmen
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
      date: log.date,
      isCheatDay: log.isCheatDay || false
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
  const { theme } = useTheme();
  const styles = createNutritionReportComponentStyles(theme);
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
    ? Dimensions.get('window').width - (theme.spacing.m * 2) // Nur Screen-Padding
    : Dimensions.get('window').width - (theme.spacing.m * 4); // Screen + Card Padding

  // Laden der Log-Daten für die letzten X Tage, ausgehend vom ausgewählten Datum
  useEffect(() => {
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
        // Sammle Tage mit Daten und Tage mit Wasserdaten separat
        const daysWithData = allRequestedDays.filter(day => {
          // Filtere Tage mit Daten
          const hasData = day.calories > 0;
          
          // Im Compact-Modus ignorieren wir Cheat Days für Durchschnittswerte von Nährstoffen
          // aber nicht für Wasser
          if (compact && day.isCheatDay) {
            return false;
          }
          
          return hasData;
        });
        
        // Sammle alle Tage mit Wasserdaten, einschließlich Cheat Days
        const daysWithWaterData = allRequestedDays.filter(day => day.water > 0);
        
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
            // Wasser wird auch für Cheat Days gezählt
            water: daysWithWaterData.length > 0 ? daysWithWaterData.reduce((sum, day) => sum + day.water, 0) / daysWithWaterData.length : 0,
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

  // Berechne die verfügbare Höhe basierend auf der Bildschirmgröße
  const screenHeight = Dimensions.get('window').height;
  
  if (reportData.length === 0) {
    return (
      <View style={{ 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: screenHeight * 0.7, // 70% der Bildschirmhöhe
        width: '100%',
        paddingVertical: theme.spacing.xl
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
      dateLabel: new Date(day.date).getDate() + '.' + (new Date(day.date).getMonth() + 1) + '.',
      isCheatDay: day.isCheatDay || false // Übertrage die Cheat Day Information
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
        title={`Kalorien`}
        data={nutritionData}
        lines={[
          {
            dataKey: "calories",
            color: theme.colors.nutrition.calories,
            label: "Kalorien",
            showGoal: true,
            goalValue: userGoals.dailyCalories,
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        yAxis={{
          unit: "Kilokalorien"
        }}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Hauptchart mit Nährwerten - Neue modulare Komponente */}
      <LineChartCard 
        title={`Kohlenhydrate im Detail`}
        data={nutritionData}
        lines={[
          {
            dataKey: "carbs",
            color: theme.colors.nutrition.carbs,
            label: "Kohlenhydrate",
            showGoal: true,
            goalValue: userGoals.dailyCarbs,
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "sugar",
            color: theme.colors.warning,  // Akzentfarbe für Zucker
            label: "Zucker",
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "fiber",
            color: theme.colors.success,  // Erfolgsfarbe für Ballaststoffe
            label: "Ballaststoffe",
            showScatter: true,
            interpolation: "linear"
          },
        ]}
        yAxis={{
          unit: "Gramm"
        }}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Zucker und Ballaststoffe Chart */}
      <LineChartCard 
        title={`Protein & Fett`}
        data={nutritionData}
        lines={[
          {
            dataKey: "protein",
            color: theme.colors.nutrition.protein,
            label: "Protein",
            showGoal: true,
            goalValue: userGoals.dailyProtein,
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "fat",
            color: theme.colors.nutrition.fat,
            label: "Fett",
            showGoal: true,
            goalValue: userGoals.dailyFat,
            showScatter: true,
            interpolation: "linear"
          },
        ]}
        yAxis={{
          unit: "Gramm"
        }}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Wasseraufnahme Chart */}
      <LineChartCard 
        title={`Wasser`}
        data={nutritionData}
        lines={[
          {
            dataKey: "water",
            color: theme.colors.primary,
            label: "Wasser",
            showGoal: userGoals.dailyWater != null,
            goalValue: userGoals.dailyWater,
            showScatter: true,
            interpolation: "linear",
            ignoreCheatDay: true // Wasser zählt immer, auch an Cheat Days
          }
        ]}
        yAxis={{
          unit: "Mililiter"
        }}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />

      {/* Natrium Chart */}
      <LineChartCard 
        title={`Elektrolyte`}
        data={nutritionData}
        lines={[
          {
            dataKey: "sodium",
            color: theme.colors.error,  // Sekundärfarbe für Natrium
            label: "Natrium",
            showScatter: true,
            interpolation: "linear"
          },
          {
            dataKey: "potassium",
            color: theme.colors.info,  // Info-Farbe für Kalium
            label: "Kalium",
            showScatter: true,
            interpolation: "linear"
          }
        ]}
        yAxis={{
          unit: "Miligramm",
          tickFormat: (t) => `${t && !isNaN(t) ? t.toFixed(1) : '0'}`
        }}
        height={200}
        width={screenWidth}
        style={{
          container: styles.section,
          title: styles.sectionTitle
        }}
      />
    </ScrollView>
  );
};

export default NutritionReportComponent;