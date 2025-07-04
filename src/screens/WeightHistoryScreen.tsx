import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { createWeightHistoryStyles } from '../styles/screens/WeightHistoryStyles';
import { getDailyLogs } from '../services/storageService';
import { fetchUserProfile } from '../services/profileApi';
import LineChartCard, { DataPoint } from '../components/charts/LineChartCard';
import { ChevronsUp, ChevronsDown, Minus } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

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
  const screenWidth = Dimensions.get('window').width - (theme.theme.spacing.m * 2);
  
  // Theme-basierte Styles
  const styles = useMemo(() => createWeightHistoryStyles(theme.theme), [theme.theme]);

  const [isLoading, setIsLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [defaultWeight, setDefaultWeight] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<number>(14); // Standardmäßig 14 Tage
  
  // Animation state management
  const animationTriggered = useRef<boolean>(false);
  const [showAnimations, setShowAnimations] = useState(false);
  
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
      
      // Schritt 1: Erzeugt alle Datenpunkte für die Tage im Zeitraum (ohne Gewichte)
      const initialPoints = allDaysInRange.map(dateObj => {
        // Formatiere das Datum
        const dateStr = dateObj.toISOString().split('T')[0];
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const formattedDate = `${day}.${month}.`;
        
        // Versuche das Log für diesen Tag zu finden
        const log = logsByDate.get(dateStr);
        
        return {
          date: dateStr,
          formattedDate,
          weight: (log?.weight !== undefined && log?.weight !== null) ? log.weight : null,
          hasActualWeight: !!(log?.weight !== undefined && log?.weight !== null)
        };
      });
      
      // Schritt 2: Carry-Forward von NEUESTEM zu ÄLTESTEM Datum
      // Sortiere Tage vom neuesten zum ältesten
      const reversedPoints = [...initialPoints].reverse();
      let lastKnownWeight: number | null = null;
      
      // Trage das letzte bekannte Gewicht nach hinten weiter
      reversedPoints.forEach(point => {
        if (point.hasActualWeight) {
          // Wenn dieser Tag ein tatsächliches Gewicht hat, speichere es
          lastKnownWeight = point.weight;
        } else if (lastKnownWeight !== null) {
          // Sonst benutze das letzte bekannte Gewicht (wenn vorhanden)
          point.weight = lastKnownWeight;
        }
      });
      
      // Schritt 3: Für alle Tage, die noch kein Gewicht haben, nutze das Profilgewicht
      const weightPoints = reversedPoints
        .reverse() // Zurück zur ursprünglichen Reihenfolge (älteste zuerst)
        .map(point => ({
          date: point.date,
          formattedDate: point.formattedDate,
          weight: point.weight !== null ? point.weight : (defaultWeight as number)
        }))
        .filter(point => point.weight !== null && point.weight !== undefined); // Filtere Einträge ohne Gewicht
      
      setWeightData(weightPoints);
    } catch (error) {
      console.error('Fehler beim Laden der Gewichtsdaten:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Focus detection for smooth animations
  useFocusEffect(
    React.useCallback(() => {
      // Reset animation state when screen is focused
      animationTriggered.current = false;
      setShowAnimations(false);
      
      // Wait for screen to be properly in focus, then trigger animations
      const focusTimer = setTimeout(() => {
        if (!animationTriggered.current && !isLoading) {
          animationTriggered.current = true;
          setShowAnimations(true);
        }
      }, 150); // Short delay to ensure smooth focus transition

      return () => {
        clearTimeout(focusTimer);
      };
    }, [isLoading])
  );

  // Trigger animations when loading is complete and screen is focused
  useEffect(() => {
    if (!isLoading && !animationTriggered.current) {
      const animationTimer = setTimeout(() => {
        animationTriggered.current = true;
        setShowAnimations(true);
      }, 100);
      
      return () => clearTimeout(animationTimer);
    }
  }, [isLoading]);

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
  
  // Zeitraum-Optionen
  const timeRangeOptions = [
    { label: '14 Tage', value: 14 },
    { label: '30 Tage', value: 30 },
    { label: '90 Tage', value: 90 }
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
          <Text style={styles.noDataText}>
            Keine Gewichtsdaten im gewählten Zeitraum verfügbar
          </Text>
        </View>
      );
    }
    
    const chartData = prepareChartData();
    
    return (
      <LineChartCard
        title="Gewichtsverlauf"
        data={chartData}
        lines={[
          {
            dataKey: 'weight',
            color: theme.theme.colors.primary,
            label: 'Gewicht',
            strokeWidth: 2,
            showScatter: true,
          }
        ]}
        height={220}
        width={screenWidth}
        showLegend={true}
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
          container: styles.chartContainer,
          title: styles.chartTitle,
        }}
      />
    );
  };
  
  return (
    <View style={styles.container}>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Show content only after animations are ready */}
        {showAnimations && (
          <>
            {/* Zeitraum Auswahl */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={100}
              style={styles.timeRangeSelector}
            >
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeRangeButton,
                    timeRange === option.value && styles.timeRangeButtonActive
                  ]}
                  onPress={() => setTimeRange(option.value)}
                >
                  <Text style={[
                    styles.timeRangeText,
                    timeRange === option.value && styles.timeRangeTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animatable.View>
            
            {/* Statistiken */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={200}
              style={styles.statsCard}
            >
              <Text style={styles.cardTitle}>
                Zusammenfassung
              </Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    Startgewicht
                  </Text>
                  <Text style={styles.statValue}>
                    {stats.start.toFixed(2)}kg
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    Aktuelles Gewicht
                  </Text>
                  <Text style={styles.statValue}>
                    {stats.end.toFixed(2)}kg
                  </Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.theme.colors.textLight }]}>
                    Veränderung
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {stats.trend === 'down' ? (
                      <ChevronsDown 
                        size={theme.theme.typography.fontSize.l} 
                        color={theme.theme.colors.success} 
                      />
                    ) : stats.trend === 'up' ? (
                      <ChevronsUp 
                        size={theme.theme.typography.fontSize.l} 
                        color={theme.theme.colors.warning}
                      />
                    ) : stats.trend === 'neutral' ? (
                      <Minus 
                        size={theme.theme.typography.fontSize.l} 
                        color={theme.theme.colors.text} 
                      />
                    ) : null}
                    <Text style={[styles.statValue, { 
                      color: stats.trend === 'down' 
                        ? theme.theme.colors.success
                        : stats.trend === 'up'
                          ? theme.theme.colors.warning
                          : theme.theme.colors.text,
                      fontFamily: theme.theme.typography.fontFamily.medium
                    }]}>
                      {stats.trend === 'neutral' ? '0kg' : `${stats.change.toFixed(2)}kg`}
                    </Text>
                  </View>
                </View>
              </View>
            </Animatable.View>
            
            {/* Chart */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={300}
            >
              {renderChart()}
            </Animatable.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
