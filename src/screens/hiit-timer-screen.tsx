import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, StatusBar, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
// Sound-Funktionen importieren
import { playWorkSound, playRestSound, playCompleteSound, playCountdownBeep } from '../utils/sound-utils'
import { Ionicons } from '@expo/vector-icons';
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
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  timerControls: {
    marginTop: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
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
    remainingTime: defaultSettings.prepareDuration,
    startTime: null,
    pausedAt: null,
    elapsedBeforePause: 0,
  });



  // Intensives Vibrationsmuster für verschiedene Phasen
  const vibrateForPhase = useCallback((phase: TimerState['phase']) => {
    // Abbruch, wenn Gerät keine Vibration unterstützt
    if (!Vibration) return;
    
    switch (phase) {
      case 'work':
        // SEHR INTENSIVES Vibrationsmuster für Arbeitsphase (mehrere starke Vibrationen)
        if (Platform.OS === 'ios') {
          // Auf iOS mehrere Haptics schnell hintereinander auslösen
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          
          // Zusätzliche Impulse mit Verzögerung
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 150);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 300);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 450);
        } else {
          // Auf Android: Intensives Muster mit mehreren Wiederholungen
          // [Pause, Vibration, Pause, Vibration, ...]
          Vibration.vibrate([0, 300, 100, 300, 100, 300, 100, 300]);
        }
        break;
        
      case 'rest':
        // Anderes Vibrationsmuster für Ruhephase (deutlich spürbar, aber anders als Work)
        if (Platform.OS === 'ios') {
          // Auf iOS andere Art von Haptics für Rest
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 400);
          setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 600);
        } else {
          // Auf Android: Anderes Muster als Work (längere Pausen, kürzere Vibrationen)
          Vibration.vibrate([0, 400, 200, 200, 200, 200]);
        }
        break;
        
      case 'completed':
        // SEHR STARKES Vibrationsmuster für Abschluss (länger, mehrere Impulse)
        if (Platform.OS === 'ios') {
          // Auf iOS: Serie von starken Impulsen
          const completionPattern = async () => {
            // Erste Runde starker Impulse
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await new Promise(resolve => setTimeout(resolve, 150));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await new Promise(resolve => setTimeout(resolve, 150));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Kurze Pause
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Zweite Runde
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await new Promise(resolve => setTimeout(resolve, 150));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          };
          
          completionPattern();
        } else {
          // Auf Android: Sehr langes, intensives Muster
          // Mehrere lange Vibrationen mit kurzen Pausen
          Vibration.vibrate([
            0, 500, 100, 500, 100, 500,  // Erste Sequenz
            300,                          // Längere Pause
            500, 100, 700                // Finale Sequenz
          ]);
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

  // Start the timer
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
      // Start fresh
      setTimerState(prev => ({
        ...prev,
        status: 'running',
        startTime: Date.now(),
        elapsedBeforePause: 0,
        pausedAt: null,
      }));
    }
  };

  // Pause the timer
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

  // Skip to next phase
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
        startTime: prev.status === 'running' ? Date.now() : null,
        pausedAt: prev.status === 'paused' ? Date.now() : null,
        elapsedBeforePause: 0,
      }));
    }
  };

  // Go back to settings screen
  const goToSettings = () => {
    // Navigate back to settings with current settings
    navigation.goBack();
  };

  // Timer effect
  useEffect(() => {
    let animationFrame: number;
    
    const updateTimer = () => {
      setTimerState(prev => {
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
            nextPhase = 'rest';
            // Haptisches und Sound-Feedback für Ruhephase
            vibrateForPhase('rest');
            try { playRestSound(); } catch (e) { console.warn('Sound-Fehler:', e); }
          } else if (prev.phase === 'rest') {
            nextCycle += 1;
            if (nextCycle > settings.cycles) {
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
            }
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
        
        // Kurzen Countdown-Beep für die letzten Sekunden
        if (newRemainingTime <= 3 && newRemainingTime > 0 && Math.floor(newRemainingTime) !== Math.floor(prev.remainingTime)) {
          try { playCountdownBeep(); } catch (e) { console.warn('Sound-Fehler:', e); }
        }
        
        // Update remaining time only
        return {
          ...prev,
          remainingTime: newRemainingTime,
        };
      });
      
      animationFrame = requestAnimationFrame(updateTimer);
    };
    
    if (timerState.status === 'running') {
      animationFrame = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [timerState.status, timerState.phase, settings, vibrateForPhase]);



  // Render timer UI
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
              <Ionicons
                name={timerState.status === 'running' ? 'pause-outline' : 'play-outline'}
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={skipToNextPhase}
              disabled={timerState.phase === 'completed'}
            >
              <Ionicons name="play-skip-forward-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={resetTimer}
            >
              <Ionicons name="refresh-outline" size={24} color={theme.colors.text} />
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