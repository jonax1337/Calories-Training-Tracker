import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { getDailyLogs } from '../services/storage-service';
import { fetchUserProfile } from '../services/profile-api';
import CalendarModal from '../components/ui/calendar-modal';
import LineChartCard, { DataPoint, LineConfig } from '../components/charts/line-chart-card';

// Definiere den Typen für Weight-History-Screen
type WeightHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeightHistory'>;
  route: RouteProp<RootStackParamList, 'WeightHistory'>;
};

type WeightDataPoint = {
  date: string;
  weight: number;
  formattedDate: string; // für Label im Chart (DD.MM.)
};

export default function WeightHistoryScreen({ navigation, route }: WeightHistoryScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  
  const [isLoading, setIsLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [defaultWeight, setDefaultWeight] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30); // Standardmäßig 30 Tage
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Funktion zum Laden der Gewichtsdaten
  const loadWeightData = async () => {
    setIsLoading(true);
    try {
      // Lade Benutzerprofil für Standard-/Fallback-Gewicht
      const userProfile = await fetchUserProfile();
      setDefaultWeight(userProfile?.weight || null);
      
      // Lade tägliche Logs für den ausgewählten Zeitraum
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - timeRange);
      
      // Format: YYYY-MM-DD
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = now.toISOString().split('T')[0];
      
      // Lade Logs vom API
      console.log(`Lade Gewichtsdaten von ${formattedStartDate} bis ${formattedEndDate}`);
      const logs = await getDailyLogs(formattedStartDate, formattedEndDate);
      
      // Konvertiere Logs zu einer Map für schnellen Zugriff per Datum
      const logsByDate = new Map();
      logs
        .filter(log => log.date)
        .forEach(log => {
          logsByDate.set(log.date, log);
        });
      
      // Erzeuge einen Array mit allen Tagen im ausgewählten Zeitraum
      const allDaysInRange = [];
      const currentDate = new Date(startDate);
      // Gehe alle Tage im Zeitraum durch
      while (currentDate <= now) {
        allDaysInRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1); // Nächster Tag
      }
      
      // Extrahiere Gewichtsdaten mit "carry-forward"-Logik
      let lastKnownWeight: number | null = null;
      
      // Erzeuge Datenpunkte für ALLE Tage im Zeitraum
      const weightPoints = allDaysInRange.map(dateObj => {
        // Formatiere das Datum
        const dateStr = dateObj.toISOString().split('T')[0];
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const formattedDate = `${day}.${month}.`;
        
        // Versuche das Log für diesen Tag zu finden
        const log = logsByDate.get(dateStr);
        
        // Prüfe, ob das aktuelle Log ein Gewicht hat
        if (log && log.weight !== null && log.weight !== undefined) {
          // Wenn ja, aktualisiere das letzte bekannte Gewicht
          lastKnownWeight = log.weight;
        }
        
        // Wenn kein Gewicht für diesen Tag existiert, verwende das letzte bekannte Gewicht
        // Falls auch kein bekanntes Gewicht existiert, fallback auf das Profilgewicht
        const weight = lastKnownWeight !== null ? lastKnownWeight : defaultWeight;
        
        return {
          date: dateStr,
          weight: weight as number,
          formattedDate
        };
      }).filter(point => point.weight !== null && point.weight !== undefined); // Filtere Einträge ohne Gewicht
      
      setWeightData(weightPoints);
    } catch (error) {
      console.error('Fehler beim Laden der Gewichtsdaten:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lade Daten beim ersten Render und bei Änderungen des Zeitraums
  useEffect(() => {
    loadWeightData();
  }, [timeRange, defaultWeight]);
  
  // Berechne Statistiken
  const calculateStats = () => {
    if (weightData.length === 0) return { start: 0, end: 0, change: 0, trend: 'neutral' };
    
    const startWeight = weightData[0]?.weight || 0;
    const endWeight = weightData[weightData.length - 1]?.weight || 0;
    const change = endWeight - startWeight;
    let trend = 'neutral';
    
    if (change < 0) trend = 'down';
    else if (change > 0) trend = 'up';
    
    return {
      start: startWeight,
      end: endWeight,
      change: Math.abs(change),
      trend
    };
  };
  
  const stats = calculateStats();
  
  // Chart-Linien-Konfiguration für LineChartCard
  const lineConfig: LineConfig[] = [
    {
      dataKey: 'weight',
      color: theme.theme.colors.primary,
      label: 'Gewicht',
      strokeWidth: 2,
      showScatter: true,
      interpolation: 'monotoneX'
    }
  ];
  
  // Zeitraum-Optionen
  const timeRangeOptions = [
    { label: '14 Tage', value: 14 },
    { label: '30 Tage', value: 30 },
    { label: '90 Tage', value: 90 },
    { label: '6 Monate', value: 180 }
  ];
  
  // Bereite Daten für LineChartCard vor
  const prepareChartData = (): DataPoint[] => {
    if (weightData.length === 0) return [];
    
    return weightData.map((point, index) => ({
      x: index + 1, // X-Wert als Index (1-basiert)
      weight: point.weight,
      dateLabel: point.formattedDate // Für X-Achsen-Label
    }));
  };
  
  // Rendere Chart nur, wenn Daten vorhanden sind
  const renderChart = () => {
    if (weightData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color: theme.theme.colors.textLight }]}>
            Keine Gewichtsdaten im gewählten Zeitraum verfügbar
          </Text>
        </View>
      );
    }
    
    const chartData = prepareChartData();
    
    return (
      <LineChartCard
        data={chartData}
        lines={lineConfig}
        height={220}
        width={screenWidth - 32}
        showLegend={false}
        yAxis={{
          label: undefined,
          unit: 'Kilogramm',
          tickFormat: (t: number) => t.toFixed(1)
        }}
        xAxis={{
          tickFormat: (x: number) => {
            // Finde den entsprechenden Datenpunkt anhand des X-Werts
            const dataPoint = chartData[x - 1]; // x ist 1-basiert, Array-Index 0-basiert
            return dataPoint?.dateLabel || '';
          },
          tickCount: timeRange > 30 ? 7 : undefined // Für längere Zeiträume weniger Tick-Marks
        }}
        style={{
          container: {
            marginVertical: 8,
            backgroundColor: theme.theme.colors.card,
            borderRadius: theme.theme.borderRadius.medium,
            padding: 8
          }
        }}
      />
    );
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.theme.colors.background,
    }]}>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Zeitraum Auswahl */}
        <View style={styles.timeRangeSelector}>
          {timeRangeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeRangeButton,
                timeRange === option.value && { 
                  backgroundColor: theme.theme.colors.primary,
                  borderColor: theme.theme.colors.primary,
                },
                { borderColor: theme.theme.colors.border }
              ]}
              onPress={() => setTimeRange(option.value)}
            >
              <Text style={[
                styles.timeRangeText,
                { 
                  color: timeRange === option.value ? 'white' : theme.theme.colors.text,
                  fontFamily: timeRange === option.value ? 
                    theme.theme.typography.fontFamily.bold : 
                    theme.theme.typography.fontFamily.medium
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Statistiken */}
        <View style={[styles.statsCard, {
          backgroundColor: theme.theme.colors.card,
          borderRadius: theme.theme.borderRadius.medium,
        }]}>
          <Text style={[styles.cardTitle, { 
            color: theme.theme.colors.text,
            fontFamily: theme.theme.typography.fontFamily.bold
          }]}>
            Zusammenfassung
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textLight }]}>
                Startgewicht
              </Text>
              <Text style={[styles.statValue, { 
                color: theme.theme.colors.text,
                fontFamily: theme.theme.typography.fontFamily.medium
              }]}>
                {stats.start.toFixed(2)} kg
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textLight }]}>
                Aktuelles Gewicht
              </Text>
              <Text style={[styles.statValue, { 
                color: theme.theme.colors.text,
                fontFamily: theme.theme.typography.fontFamily.medium
              }]}>
                {stats.end.toFixed(2)} kg
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.theme.colors.textLight }]}>
                Veränderung
              </Text>
              <Text style={[styles.statValue, { 
                color: stats.trend === 'down' 
                  ? theme.theme.colors.success
                  : stats.trend === 'up'
                    ? theme.theme.colors.error
                    : theme.theme.colors.text,
                fontFamily: theme.theme.typography.fontFamily.medium
              }]}>
                {stats.trend === 'neutral' ? '0 kg' : 
                 `${stats.trend === 'down' ? '−' : '+'} ${stats.change.toFixed(2)} kg`}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Chart */}
        <View style={[styles.chartCard, {
          backgroundColor: theme.theme.colors.card,
          borderRadius: theme.theme.borderRadius.medium,
        }]}>
          <Text style={[styles.cardTitle, { 
            color: theme.theme.colors.text,
            fontFamily: theme.theme.typography.fontFamily.bold
          }]}>
            Gewichtsverlauf
          </Text>
          
          {isLoading ? (
            <ActivityIndicator 
              size="large" 
              color={theme.theme.colors.primary} 
              style={{ marginVertical: 40 }}
            />
          ) : renderChart()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
  },
  statsCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
