import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { 
  VictoryChart, 
  VictoryLine, 
  VictoryScatter,
  VictoryTheme, 
  VictoryAxis, 
  VictoryContainer,
  VictoryLegend
} from 'victory-native';
import { useTheme } from '../../theme/theme-context';

export interface DataPoint {
  x: number;
  [key: string]: any; // Erlaubt beliebige Y-Werte mit unterschiedlichen Namen
  dateLabel?: string; // Optionales Label für Datum
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
}

interface LineChartCardProps {
  data: DataPoint[];  // Die Datenpunkte
  lines: LineConfig[];  // Konfiguration für die Linien
  title?: string;     // Titel für die Chart-Card
  height?: number;    // Höhe des Charts
  width?: number;     // Breite des Charts
  showLegend?: boolean; // Legende anzeigen?
  legendPosition?: 'top' | 'bottom'; // Position der Legende
  xAxis?: {
    label?: string;
    tickFormat?: (value: any) => string;
    tickCount?: number;
  };
  yAxis?: {
    label?: string;
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
  legendPosition = 'bottom',
  xAxis,
  yAxis,
  style
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const screenWidth = width || Dimensions.get('window').width - 2 * theme.theme.spacing.m;
  
  // Generiere Daten für Ziellinien
  const generateGoalData = (goalValue: number) => {
    return data.map((_, index) => ({
      x: index + 1.2,
      y: goalValue
    }));
  };
  
  // Berechne Tick-Intervall basierend auf Datenmenge
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 7) : 2;
  
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
      {title && <Text style={{ 
        color: theme.theme.colors.text,
        fontSize: theme.theme.typography.fontSize.l,
        fontFamily: theme.theme.typography.fontFamily.bold,
        textAlign: 'left',
        paddingTop: theme.theme.spacing.xs,
        }}>{title}</Text>}
      
      <View style={[styles.chartContainer, style?.chartContainer]}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={screenWidth}
          height={height}
          padding={{ 
            top: theme.theme.spacing.m,
            bottom: theme.theme.spacing.xl, 
            left: theme.theme.spacing.xl + theme.theme.spacing.m, 
            right: theme.theme.spacing.m 
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
          {/* Y-Achse */}
          <VictoryAxis 
            dependentAxis
            label={yAxis?.label}
            tickFormat={yAxis?.tickFormat || ((t) => `${Math.round(t)}`)}
            style={{
              axis: { stroke: theme.theme.colors.border},
              axisLabel: { padding: 35, fontSize: theme.theme.typography.fontSize.s, fontFamily: theme.theme.typography.fontFamily.regular },
              tickLabels: { 
                fill: theme.theme.colors.textLight,
                fontSize: theme.theme.typography.fontSize.xs,
                fontFamily: theme.theme.typography.fontFamily.regular
              },
              grid: { stroke: theme.theme.colors.border, strokeOpacity: 0.25 }
            }}
          />
          
          {/* X-Achse */}
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
                : data.filter((_, i) => i % tickInterval === 0).map((d, i) => i * tickInterval + 1).filter(x => x <= data.length)
            }
            style={{
              axis: { stroke: theme.theme.colors.border },
              axisLabel: { fontSize: theme.theme.typography.fontSize.s, },
              tickLabels: { 
                fill: theme.theme.colors.textLight,
                fontSize: theme.theme.typography.fontSize.xs,
                fontFamily: theme.theme.typography.fontFamily.regular,
                angle: -45
              },
              grid: { stroke: theme.theme.colors.border}
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
                style={{
                  data: { 
                    fill: line.color,
                    stroke: theme.theme.colors.card,
                    strokeWidth: 2,
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

// Styles mithilfe des Themes definieren
const createStyles = (theme: any) => StyleSheet.create({
  chartCard: {
    borderRadius: theme.theme.borderRadius.m,
    backgroundColor: theme.theme.colors.card,
    padding: theme.theme.spacing.m,
    marginVertical: theme.theme.spacing.s,
  },
  chartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  legendContainer: {
    marginTop: theme.theme.spacing.xs,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.theme.spacing.s,
    marginVertical: theme.theme.spacing.xs,
  },
  legendColor: {
    width: theme.theme.spacing.s,
    height: theme.theme.spacing.s,
    borderRadius: theme.theme.spacing.s / 2,
    marginRight: theme.theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.theme.typography.fontSize.xs,
    fontFamily: theme.theme.typography.fontFamily.regular,
    color: theme.theme.colors.text,
  },
});

export default LineChartCard;
