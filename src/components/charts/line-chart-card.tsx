import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { 
  VictoryChart, 
  VictoryLine, 
  VictoryScatter,
  VictoryTheme, 
  VictoryAxis, 
  VictoryContainer
} from 'victory-native';
import { useTheme } from '../../theme/theme-context';
import { createLineChartCardStyles } from '../../styles/components/charts/line-chart-card-styles';

export interface DataPoint {
  x: number;
  [key: string]: any; // Erlaubt beliebige Y-Werte mit unterschiedlichen Namen
  dateLabel?: string; // Optionales Label für Datum
  isCheatDay?: boolean; // Markierung für Cheat Days
}

export interface LineConfig {
  dataKey: string;  // Key in den DataPoints (z.B. "calories", "protein", "weight")
  color: string;    // Farbe für die Linie
  label: string;    // Label für die Legende
  strokeWidth?: number; // Optional: Liniendicke
  interpolation?: "basis" | "bundle" | "cardinal" | "catmullRom" | "linear" | "monotoneX" | "monotoneY" | "natural" | "step" | "stepAfter" | "stepBefore"; // Interpolation
  showGoal?: boolean;  // Optional: Soll Ziellinie angezeigt werden?
  goalValue?: number;  // Optional: Wert für Ziellinie
  showScatter?: boolean; // Optional: Punkte auf der Linie anzeigen?
  ignoreCheatDay?: boolean; // Wenn true, wird die Cheat Day Markierung ignoriert
}

interface LineChartCardProps {
  data: DataPoint[];  // Die Datenpunkte
  lines: LineConfig[];  // Konfiguration für die Linien
  title?: string;     // Titel für die Chart-Card
  height?: number;    // Höhe des Charts
  width?: number;     // Breite des Charts
  showLegend?: boolean; // Legende anzeigen?
  xAxis?: {
    label?: string;
    tickFormat?: (value: any) => string;
    tickCount?: number;
  };
  yAxis?: {
    label?: string;     // Label für die Y-Achse (links)
    unit?: string;      // Einheit für die Y-Achse (rechts)
    tickFormat?: (value: any) => string;
  };
  style?: any; // Zusätzliche Styling-Optionen
}

const LineChartCard: React.FC<LineChartCardProps> = ({
  data,
  lines,
  title,
  height = 200,
  width,
  showLegend = true,
  xAxis,
  yAxis,
  style
}) => {
  // Prüfe, ob Cheat Days in den Daten vorhanden sind
  const hasCheatDays = data.some(item => item.isCheatDay);
  const { theme } = useTheme();
  const styles = createLineChartCardStyles(theme);
  const screenWidth = width || Dimensions.get('window').width - 2 * theme.spacing.m;
  
  // Generiere Daten für Ziellinien
  const generateGoalData = (goalValue: number) => {
    return data.map((_, index) => ({
      x: index + 1,
      y: goalValue
    }));
  };
  

  
  // Berechne Label-Intervall basierend auf Datenmenge
  // Unter 14 Tagen: jedes Label anzeigen (Intervall 1)
  // Ab 14 Tagen: nur jedes zweite Label anzeigen (Intervall 2)
  const labelInterval = data.length > 14 ? 2 : 1;
  
  // Formatiere X-Achsen Beschriftung
  const formatXTick = (x: number) => {
    const dataPoint = data[x - 1];
    if (!dataPoint) return '';
    
    if (dataPoint.dateLabel) {
      return dataPoint.dateLabel;
    } else if (dataPoint.day) {
      const date = new Date(dataPoint.day);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    } else {
      return x.toString();
    }
  };
  
  return (
    <View style={[styles.chartCard, style?.container]}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={[styles.chartContainer, style?.chartContainer]}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={screenWidth}
          height={height}
          padding={{ 
            top: theme.spacing.m,
            bottom: theme.spacing.xl, 
            left: theme.spacing.xl + theme.spacing.m, 
            right: theme.spacing.xl 
          }}
          containerComponent={
            <VictoryContainer
              responsive={true}
              style={{
                touchAction: 'auto',
              }}
            />
          }
        >
          {/* Y-Achse mit Werten (links) */}
          <VictoryAxis 
            dependentAxis
            label={yAxis?.label}
            tickFormat={yAxis?.tickFormat || ((t) => `${Math.round(t)}`)}
            style={{
              axis: { stroke: theme.colors.border },
              axisLabel: { padding: 35, fontSize: theme.typography.fontSize.s, fontFamily: theme.typography.fontFamily.regular },
              tickLabels: { 
                fill: theme.colors.textLight,
                fontSize: theme.typography.fontSize.xs,
                fontFamily: theme.typography.fontFamily.regular
              },
              grid: { stroke: theme.colors.border, strokeOpacity: 0.25 }
            }}
          />

          {/* Einheit auf der rechten Seite, falls vorhanden */}
          {yAxis?.unit && (
            <VictoryAxis 
              dependentAxis
              orientation="right"
              label={yAxis.unit}
              tickFormat={() => ""} // Keine Tick-Labels anzeigen
              style={{
                axis: { stroke: theme.colors.border },
                axisLabel: { 
                  fill: theme.colors.textLight,
                  fontSize: theme.typography.fontSize.xs, 
                  fontFamily: theme.typography.fontFamily.regular,
                  padding: theme.spacing.s // Näher an die Achse rücken
                },
                tickLabels: { fill: "transparent" },
                ticks: { stroke: "transparent" }, // Keine Tick-Markierungen anzeigen
                grid: { stroke: "transparent" } // Keine Gitterlinien anzeigen
              }}
            />
          )}
          
          {/* X-Achse mit Gitterlinien für jeden Tag */}
          <VictoryAxis
            label={xAxis?.label}
            tickFormat={xAxis?.tickFormat || formatXTick}
            tickValues={
              xAxis?.tickCount && xAxis.tickCount > 1
                ? (() => {
                    // Lokale Variable definieren, um TypeScript-Fehler zu vermeiden
                    const count = xAxis.tickCount!;
                    return Array.from({ length: count }, (_, i) => {
                      // Vermeide Division durch Null und stelle sicher, dass Werte im gültigen Bereich sind
                      if (i === 0) return 1;
                      if (i === count - 1) return data.length;
                      return Math.ceil(1 + (data.length - 1) * (i / (count - 1)));
                    });
                  })()
                : (() => {
                    // Alle Tage für Gitterlinien
                    const allDays = Array.from({ length: data.length }, (_, i) => i + 1);
                    
                    // Für Labels nur jeden labelInterval-ten Tag nehmen
                    return allDays.filter(day => (day - 1) % labelInterval === 0);
                  })()
            }
            style={{
              axis: { stroke: theme.colors.border },
              axisLabel: { fontSize: theme.typography.fontSize.xs, },
              tickLabels: { 
                fill: theme.colors.textLight,
                fontSize: theme.typography.fontSize.xs * 0.8,
                fontFamily: theme.typography.fontFamily.regular,
                angle: -45
              },
              // Dynamische Grid-Farbe basierend auf Cheat Day Status
              grid: {
                stroke: ({ tick }) => {
                  // Finde den Datenpunkt für den aktuellen Tick
                  const dataPoint = data.find(d => d.x === tick);
                  if (dataPoint && dataPoint.isCheatDay) {
                    // Fehlerfarbe für Cheat Days
                    return theme.colors.errorLight;
                  }
                  return theme.colors.border;
                }
              }
            }}
          />
          
          {/* Zusätzliche X-Achse nur für Gitterlinien (ohne Labels) */}
          <VictoryAxis
            tickValues={Array.from({ length: data.length }, (_, i) => i + 1)}
            tickFormat={() => ""} // Keine Labels anzeigen
            style={{
              axis: { stroke: "transparent" }, // Achsenlinie unsichtbar
              ticks: { stroke: "transparent" }, // Tick-Striche unsichtbar
              grid: { stroke: theme.colors.border, strokeOpacity: 0.25 }
            }}
          />
          
          {/* Render Ziellinien zuerst (im Hintergrund) */}
          {lines.map((line, index) => 
            line.showGoal && line.goalValue !== undefined && (
              <VictoryLine
                key={`goal-${line.dataKey}-${index}`}
                data={generateGoalData(line.goalValue)}
                style={{
                  data: { 
                    stroke: line.color,
                    strokeWidth: 1.5,
                    strokeDasharray: '3,5',
                    strokeOpacity: 0.75
                  }
                }}
              />
            )
          )}
          
          {/* Dann die Datenlinien */}
          {lines.map((line, index) => (
            <VictoryLine
              key={`line-${line.dataKey}-${index}`}
              data={data}
              x="x"
              y={line.dataKey}
              interpolation={line.interpolation || "monotoneX"}
              style={{
                data: { 
                  stroke: line.color,
                  strokeWidth: line.strokeWidth || 3
                }
              }}
            />
          ))}
          
          {/* Und schließlich die Scatter-Punkte */}
          {lines.map((line, index) => 
            line.showScatter !== false && (
              <VictoryScatter
                key={`scatter-${line.dataKey}-${index}`}
                data={data}
                x="x"
                y={line.dataKey}
                size={4}
                symbol={({ datum }) => {
                  // Symbol für Cheat Days
                  const isCheatDay = Boolean(datum.isCheatDay);
                  const hasGoal = line.showGoal && line.goalValue !== undefined;
                  const ignoreCheatDay = line.ignoreCheatDay === true;
                  
                  if (isCheatDay && hasGoal && !ignoreCheatDay) {
                    return "diamond"; // "plus" ist am nächsten an einem X in Victory-Native
                  }
                  return "circle"; // Standard Kreis für normale Tage
                }}
                style={{
                  data: { 
                    fill: ({ datum }) => {
                      // Prüfe, ob dieser Datenpunkt von einem Cheat Day stammt
                      const isCheatDay = Boolean(datum.isCheatDay);
                      const hasGoal = line.showGoal && line.goalValue !== undefined;
                      const ignoreCheatDay = line.ignoreCheatDay === true;
                      
                      // Bei ignoreCheatDay wird die Cheat Day Markierung nicht angezeigt
                      if (isCheatDay && hasGoal && !ignoreCheatDay) {
                        return theme.colors.error;
                      }
                      return line.color;
                    },
                    stroke: ({ datum }) => {
                      const isCheatDay = Boolean(datum.isCheatDay);
                      const hasGoal = line.showGoal && line.goalValue !== undefined;
                      const ignoreCheatDay = line.ignoreCheatDay === true;
                      
                      if (isCheatDay && hasGoal && !ignoreCheatDay) {
                        return theme.colors.errorLight;
                      }
                      return theme.colors.card;
                    },
                    strokeWidth: 2
                  }
                }}
              />
            )
          )}
        </VictoryChart>
      </View>
      
      {/* Optionale Legende */}
      {showLegend && (
        <View style={styles.legendContainer}>
          <View style={styles.legendRow}>
            {lines.map((line, index) => (
              <View key={`legend-${index}`} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: line.color }]} />
                <Text style={styles.legendText}>{line.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default LineChartCard;
