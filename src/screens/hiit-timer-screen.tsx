import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
// Sound-Funktionen importieren
import { playWorkSound, playRestSound, playCompleteSound, playCountdownBeep } from '../utils/sound-utils'
import { Pause, Play, SkipForward, RefreshCcw } from 'lucide-react-native';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CircularTimer from '../components/ui/circular-timer';
// Define styles directly inside the component until the import issue is resolved
const createHIITTimerStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  settingsScroll: {
    flex: 1,
  },
  settingsContainer: {
    padding: theme.spacing.m,
  },
  settingsTitle: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    marginVertical: theme.spacing.l,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.m,
    flex: 1,
  },
  settingInput: {
    width: 80,
    height: 45,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.typography.fontSize.m,
  },
  // 🔥 WICHTIGSTE ÄNDERUNG: Feste Dimensionen für stabiles Layout
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: theme.spacing.xl,
    minHeight: 450, // Mindesthöhe für stabiles Layout
    // Alternative: height: 450 für exakte Höhe
  },
  timerControls: {
    marginTop: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
    height: 120, // Feste Höhe für die Controls
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    maxWidth: 280,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButton: {
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.medium,
    marginTop: theme.spacing.l,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
  },
  linkButton: {
    padding: theme.spacing.m,
  },
  linkButtonText: {
    fontSize: theme.typography.fontSize.m,
    textAlign: 'center',
  },
});

// Navigation Types
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, HIITSettings } from '../navigation';

type HIITTimerScreenProps = NativeStackScreenProps<RootStackParamList, 'HIITTimer'>;

const defaultSettings: HIITSettings = {
  workDuration: 30,
  restDuration: 15,
  prepareDuration: 5,
  cycles: 8,
};

// 🔥 VEREINFACHT: Kein 'starting' Status mehr - direkt von idle zu running
type TimerState = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  phase: 'prepare' | 'work' | 'rest' | 'completed';
  currentCycle: number;
  remainingTime: number;
  startTime: number | null;
  pausedAt: number | null;
  elapsedBeforePause: number;
};

const HIITTimerScreen: React.FC<HIITTimerScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createHIITTimerStyles(theme);
  
  // Get settings from route params or use defaults
  const [settings] = useState<HIITSettings>(route.params?.settings || defaultSettings);
  
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    phase: 'prepare',
    currentCycle: 1,
    remainingTime: settings.prepareDuration, // Verwende settings statt defaultSettings
    startTime: null,
    pausedAt: null,
    elapsedBeforePause: 0,
  });

  // Intensives Vibrationsmuster für verschiedene Phasen
  const vibrateForPhase = useCallback((phase: TimerState['phase'] | 'countdown') => {
    // Abbruch, wenn Gerät keine Vibration unterstützt
    if (!Vibration) return;
    
    switch (phase) {
      case 'work':
        // Starke, lange Vibration für Arbeitsphase
        if (Platform.OS === 'ios') {
          // Längerer, einzelner Heavy Impact (am deutlichsten spürbar)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          
          // Kontinuierliche Vibration für bessere Wahrnehmung
          Vibration.vibrate([0, 500]);
        } else {
          // Auf Android: Längere, einfache Vibration
          Vibration.vibrate([0, 500]);
        }
        break;
        
      case 'rest':
        // Andere Vibration für Ruhephase (mittlere Intensität, aber deutlich)
        if (Platform.OS === 'ios') {
          // Medium Impact für andere Wahrnehmung als Work
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          // Andere Vibrationsdauer als Work
          Vibration.vibrate([0, 100]);
        } else {
          // Auf Android: Kürzere Vibration als Work
          Vibration.vibrate([0, 100]);
        }
        break;
        
      case 'completed':
        // Längste und stärkste Vibration für Abschluss
        if (Platform.OS === 'ios') {
          // Auf iOS: Erfolgs-Notification + Heavy Impact
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          // Drei deutliche Vibrationsimpulse (einfaches Muster)
          Vibration.vibrate([0, 500, 0, 500]);
        } else {
          // Auf Android: Drei deutliche Vibrationsimpulse
          Vibration.vibrate([0, 500, 0, 500]);
        }
        break;

      case 'countdown':
        // Einzelner kurzer Impuls pro Countdown-Tick (3,2,1)
        if (Platform.OS === 'ios') {
          // iOS: Medium Impact (spürbar, aber nicht zu stark)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          
          // Kurze Vibration
          Vibration.vibrate(100);
        } else {
          // Android: Kurze Vibration
          Vibration.vibrate(100);
        }
        break;
        
      default:
        break;
    }
  }, []);

  // Get duration based on current phase
  const getPhaseDuration = (phase: TimerState['phase']): number => {
    switch (phase) {
      case 'prepare':
        return settings.prepareDuration;
      case 'work':
        return settings.workDuration;
      case 'rest':
        return settings.restDuration;
      case 'completed':
        return 0;
    }
  };

  // Reset timer to initial state
  const resetTimer = () => {
    setTimerState({
      status: 'idle',
      phase: 'prepare',
      currentCycle: 1,
      remainingTime: settings.prepareDuration,
      startTime: null,
      pausedAt: null,
      elapsedBeforePause: 0,
    });
  };

  // 🔥 VEREINFACHT: Start the timer - KEIN starting-State mehr
  const startTimer = () => {
    if (timerState.status === 'paused') {
      // Resume from pause
      setTimerState(prev => ({
        ...prev,
        status: 'running',
        startTime: Date.now() - prev.elapsedBeforePause,
        pausedAt: null,
      }));
    } else {
      // Start fresh - DIREKT zu running
      setTimerState(prev => ({
        ...prev,
        status: 'running',
        startTime: Date.now(),
        elapsedBeforePause: 0,
        pausedAt: null,
      }));
    }
  };

  // 🔥 VEREINFACHT: Pause the timer - KEIN starting-State handling
  const pauseTimer = () => {
    if (timerState.status === 'running') {
      const now = Date.now();
      const elapsed = timerState.startTime ? now - timerState.startTime : 0;
      
      setTimerState(prev => ({
        ...prev,
        status: 'paused',
        pausedAt: now,
        elapsedBeforePause: elapsed,
      }));
    }
  };

  // 🔥 VEREINFACHT: Skip to next phase - KEIN starting-State handling
  const skipToNextPhase = () => {
    if (timerState.status === 'running' || timerState.status === 'paused') {
      let nextPhase: TimerState['phase'] = 'prepare';
      let nextCycle = timerState.currentCycle;
      
      // Determine the next phase
      if (timerState.phase === 'prepare') {
        nextPhase = 'work';
      } else if (timerState.phase === 'work') {
        nextPhase = 'rest';
      } else if (timerState.phase === 'rest') {
        nextCycle += 1;
        if (nextCycle > settings.cycles) {
          nextPhase = 'completed';
        } else {
          nextPhase = 'work';
        }
      }
      
      const nextPhaseDuration = getPhaseDuration(nextPhase);
      
      setTimerState(prev => ({
        ...prev,
        phase: nextPhase,
        currentCycle: nextCycle,
        remainingTime: nextPhaseDuration,
        status: nextPhase === 'completed' ? 'completed' : 'running',
        startTime: nextPhase === 'completed' ? null : Date.now(),
        pausedAt: null,
        elapsedBeforePause: 0,
      }));
    }
  };

  // 🔥 VEREINFACHT: Timer effect läuft bei 'running' Status
  useEffect(() => {
    let animationFrame: number;
    
    const updateTimer = () => {
      setTimerState(prev => {
        // Nur laufen lassen wenn Status 'running' ist
        if (prev.status !== 'running' || !prev.startTime) return prev;
        
        const now = Date.now();
        const elapsed = now - prev.startTime;
        const currentPhaseDuration = getPhaseDuration(prev.phase);
        const newRemainingTime = Math.max(0, currentPhaseDuration - Math.floor(elapsed / 1000));
        
        // If phase is complete, move to next phase
        if (newRemainingTime === 0) {
          let nextPhase: TimerState['phase'] = prev.phase;
          let nextCycle = prev.currentCycle;
          
          if (prev.phase === 'prepare') {
            nextPhase = 'work';
            // Haptisches und Sound-Feedback für Arbeitsphase
            vibrateForPhase('work');
            try { playWorkSound(); } catch (e) { console.warn('Sound-Fehler:', e); }
          } else if (prev.phase === 'work') {
            // Nach der Work-Phase prüfen, ob es der letzte Zyklus war
            if (prev.currentCycle >= settings.cycles) {
              // Letzter Zyklus abgeschlossen - direkt zu Completed gehen
              // Haptisches und Sound-Feedback für Abschluss
              vibrateForPhase('completed');
              try { playCompleteSound(); } catch (e) { console.warn('Sound-Fehler:', e); }
              return {
                ...prev,
                status: 'completed',
                phase: 'completed',
                currentCycle: settings.cycles,
                remainingTime: 0,
                startTime: null,
                pausedAt: null,
                elapsedBeforePause: 0,
              };
            } else {
              // Noch nicht der letzte Zyklus - normal zur Rest-Phase gehen
              nextPhase = 'rest';
              // Haptisches und Sound-Feedback für Ruhephase
              vibrateForPhase('rest');
              try { playRestSound(); } catch (e) { console.warn('Sound-Fehler:', e); }
            }
          } else if (prev.phase === 'rest') {
            nextCycle += 1;
            nextPhase = 'work';
            // Haptisches und Sound-Feedback für Arbeitsphase
            vibrateForPhase('work');
            try { playWorkSound(); } catch (e) { console.warn('Sound-Fehler:', e); }
          }
          
          const nextPhaseDuration = getPhaseDuration(nextPhase);
          
          return {
            ...prev,
            phase: nextPhase,
            currentCycle: nextCycle,
            remainingTime: nextPhaseDuration,
            startTime: now,
            elapsedBeforePause: 0,
          };
        }
        
        // Countdown-Feedback (Ton + Vibration) für jede Sekunde
        if (Math.floor(newRemainingTime) !== Math.floor(prev.remainingTime)) {
          // Zusätzlich Sound für die letzten drei Sekunden
          if (newRemainingTime <= 3 && newRemainingTime > 0) {
            vibrateForPhase('countdown');
            try { playCountdownBeep(); } catch (e) { console.warn('Sound-Fehler:', e); }
          }
        }
        
        // Update remaining time only
        return {
          ...prev,
          remainingTime: newRemainingTime,
        };
      });
      
      animationFrame = requestAnimationFrame(updateTimer);
    };
    
    // Bei 'running' Status starten
    if (timerState.status === 'running') {
      animationFrame = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [timerState.status, timerState.phase, settings, vibrateForPhase]);

  // 🔥 VEREINFACHT: Render timer UI - KEIN starting-State mehr
  const renderTimer = () => (
    <View style={styles.timerContainer}>
      <CircularTimer
        size={280}
        strokeWidth={15}
        duration={getPhaseDuration(timerState.phase)}
        remainingTime={timerState.remainingTime}
        status={timerState.phase}
        currentCycle={timerState.currentCycle}
        totalCycles={settings.cycles}
      />
      
      <View style={styles.timerControls}>
        {timerState.status === 'completed' ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={resetTimer}
          >
            <Text style={[styles.actionButtonText, { color: 'white', fontFamily: theme.typography.fontFamily.bold }]}>
              Neu starten
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={timerState.status === 'running' ? pauseTimer : startTimer}
            >
              {timerState.status === 'running' ? (
                <Pause size={24} color={theme.colors.text} />
              ) : (
                <Play size={24} color={theme.colors.text} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={skipToNextPhase}
              disabled={timerState.phase === 'completed'}
            >
              <SkipForward size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={resetTimer}
            >
              <RefreshCcw size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {renderTimer()}
    </View>
  );
};

export default HIITTimerScreen;