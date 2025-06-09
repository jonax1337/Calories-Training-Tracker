import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ScrollView, Modal, Animated, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Swipeable, RectButton, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';
import CalendarModal from '../components/ui/calendar-modal';
import DateNavigationHeader from '../components/ui/date-navigation-header';
import { CircleChevronUp, CircleChevronDown, ChevronsLeft, ChevronsRight, X, Trash2, Info, ChevronLeft, ChevronRight, Edit2, Plus, ShieldOff, ShieldCheck, PlusCircle } from 'lucide-react-native';
import { JournalTabScreenProps } from '../types/navigation-types';
import { DailyLog, FoodEntry, MealType } from '../types';
import { getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { formatToLocalISODate, formatDateForDisplay, getTodayFormatted } from '../utils/date-utils';
import { useDateContext } from '../context/date-context';
import { createDailyLogStyles } from '../styles/screens/daily-log-styles';

function DailyLogScreenContent({ navigation }: JournalTabScreenProps) {
  // Refs für die Animation der verschiedenen Mahlzeiten
  const animationRefs = useRef<{[key: string]: Animated.Value}>({});
  // State für aktuelle Animation
  const [animatingMealType, setAnimatingMealType] = useState<string | null>(null);
  
  // Typdefinition für eine Mahlzeiten-Kategorie
  type MealCategoryProps = {
    mealType: string;
    emoji: string;
    title: string;
    calories: number;
    isLast?: boolean;
  };

  // Wiederverwendbare Komponente für eine komplette Mahlzeiten-Kategorie
  const MealCategory = ({ mealType, emoji, title, calories, isLast = false }: MealCategoryProps) => {
    return (
      <View style={{ marginBottom: expandedMeals[mealType] ? 0 : theme.spacing.m }}>
        {/* Header-Bereich - klickbar für Scanner */}
        <TouchableOpacity 
          style={[styles.mealCategoryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, 
            borderBottomLeftRadius: expandedMeals[mealType] ? 0 : theme.borderRadius.medium,
            borderBottomRightRadius: expandedMeals[mealType] ? 0 : theme.borderRadius.medium,
            marginBottom: expandedMeals[mealType] ? 0 : undefined,
          }]}
        >
          <View style={styles.mealCategoryContent}>
            {/* Linke Seite - Mahlzeiteninfo mit Plus-Icon */}
            <TouchableOpacity 
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType })}
            >
              <View>
                <Text style={[styles.mealCategoryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                  {emoji} {title}
                </Text>
                {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === mealType).length > 0 ? (
                  <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                    {dailyLog.foodEntries.filter(entry => entry.mealType === mealType).length} Einträge
                  </Text>
                ) : (
                  <Text style={[styles.mealCategorySubtitle, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                    Noch keine Einträge
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            
            {/* Rechte Seite - Kalorien + Akkordeon-Button */}
            <MealAccordionButton mealType={mealType} calories={calories} />
          </View>
        </TouchableOpacity>
        
        {/* Ausklappbarer Bereich für die Einträge */}
        <MealAccordionContent mealType={mealType} isLast={isLast} />
      </View>
    );
  };

  // Wiederverwendbare Komponente für den Kalorien-Anzeige und Akkordeon-Button Bereich
  const MealAccordionButton = ({ mealType, calories }: { mealType: string, calories: number }) => (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center' }}
      onPress={(e) => {
        e.stopPropagation();
        // Animation auslösen und Timer für Reset setzen
        setAnimatingMealType(mealType);
        // Nach 300ms (Animation + etwas Puffer) den animierenden Status zurücksetzen
        setTimeout(() => setAnimatingMealType(null), 500);
        // State ändern
        toggleMealAccordion(mealType);
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={[styles.mealCategoryCalories, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, marginRight: 8 }]}>
        {Math.round(calories)} kcal
      </Text>
      {/* Akkordeon-Icon */}
      {expandedMeals[mealType] ? (
        <CircleChevronUp size={24} color={theme.colors.primary} />
      ) : (
        <CircleChevronDown size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  // Wiederverwendbare Komponente für den ausklappbaren Bereich mit Einträgen
  const MealAccordionContent = ({ mealType, isLast = false }: { mealType: string, isLast?: boolean }) => {
    const entries = dailyLog?.foodEntries.filter(entry => entry.mealType === mealType) || [];
    
    // Sicherstellen, dass wir eine Animation-Ref für diesen meal type haben
    useEffect(() => {
      if (!animationRefs.current[mealType]) {
        animationRefs.current[mealType] = new Animated.Value(0);
      }
    }, [mealType]);
    
    // Starte Animation, wenn sich expandedMeals ändert oder animatingMealType gesetzt ist
    useEffect(() => {
      if (mealType === animatingMealType) {
        // Animation starten
        Animated.timing(animationRefs.current[mealType], {
          toValue: expandedMeals[mealType] ? 1 : 0,
          duration: 250,
          useNativeDriver: true
        }).start();
      } else {
        // Sofort ohne Animation setzen
        animationRefs.current[mealType]?.setValue(expandedMeals[mealType] ? 1 : 0);
      }
    }, [expandedMeals[mealType], animatingMealType, mealType]);
    
    // Wir rendern nichts, wenn nicht expandiert
    if (!expandedMeals[mealType]) return null;
    
    // Sicherheitsprüfung, falls animationRefs.current[mealType] noch nicht existiert
    const animatedValue = animationRefs.current[mealType] || new Animated.Value(1);
    
    return (
      <Animated.View style={{
        backgroundColor: theme.colors.card,
        borderBottomLeftRadius: theme.borderRadius.medium,
        borderBottomRightRadius: theme.borderRadius.medium,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '40',
        paddingHorizontal: theme.spacing.s,
        paddingTop: theme.spacing.s,
        paddingBottom: theme.spacing.m,
        marginBottom: isLast ? 0 : theme.spacing.m,
        opacity: animatedValue, // Animation der Transparenz
        transform: [{ 
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0] // Gleitet von oben ein
          })
        }]
      }}>
        {entries.length > 0 ? (
          entries.map((entry, index, array) => (
            <Swipeable
              key={entry.id}
              ref={ref => {
                // Ref zum Zurücksetzen des Swipe-Zustands speichern
                // WICHTIG: Immer aktualisieren, auch wenn bereits vorhanden
                if (ref) {
                  swipeableRefs.current.set(entry.id, ref);
                }
              }}
              friction={2}      // Höherer Wert = langsameres Schwingen
              leftThreshold={80} // Schwellenwert für automatische Aktion (Bearbeiten)
              rightThreshold={80} // Schwellenwert für automatische Aktion (Löschen)
              overshootLeft={false}  // Keine Überschwingung nach links
              overshootRight={false} // Keine Überschwingung nach rechts
              onSwipeableOpen={(direction) => {
                if (direction === 'left') {
                  handleOpenFoodDetails(entry);
                } else if (direction === 'right') {
                  handleRemoveEntry(entry.id);
                }
              }}
              // Nach rechts wischen zeigt den Löschen-Button
              renderRightActions={(progress, dragX) => {
                // Animation für Löschen (nach rechts wischen)
                const trans = dragX.interpolate({
                  inputRange: [-80, 0],
                  outputRange: [0, 80],
                  extrapolate: 'clamp',
                });
                
                // Farbübergang: Je weiter gewischt, desto intensiver
                const opacity = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                });
                
                return (
                  <Animated.View 
                    style={{
                      width: 80,
                      backgroundColor: theme.colors.error,
                      opacity,
                      borderTopRightRadius: index === 0 ? theme.borderRadius.small : 0,
                      borderBottomRightRadius: index === array.length - 1 ? theme.borderRadius.small : 0,
                      height: '100%',
                      overflow: 'hidden',
                      // Verbesserte Ausrichtung ohne absolute Positionierung
                      justifyContent: 'center',
                      alignSelf: 'stretch'
                      
                    }}
                  >
                    <RectButton
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                      }}
                      onPress={() => handleRemoveEntry(entry.id)}
                    >
                      <Animated.View
                        style={{
                          transform: [{ translateX: trans }],
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={24} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontFamily: theme.typography.fontFamily.medium, marginTop: 4 }}>
                          Löschen
                        </Text>
                      </Animated.View>
                    </RectButton>
                  </Animated.View>
                );
              }}
              // Nach links wischen zeigt den Bearbeiten-Button
              renderLeftActions={(progress, dragX) => {
                // Animation für Bearbeiten (nach links wischen)
                const trans = dragX.interpolate({
                  inputRange: [0, 80],
                  outputRange: [-80, 0],
                  extrapolate: 'clamp',
                });
                
                // Farbübergang: Je weiter gewischt, desto intensiver
                const opacity = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                });
                
                return (
                  <Animated.View 
                    style={{
                      width: 80,
                      backgroundColor: theme.colors.accent,
                      opacity,
                      borderTopLeftRadius: index === 0 ? theme.borderRadius.small : 0,
                      borderBottomLeftRadius: index === array.length - 1 ? theme.borderRadius.small : 0,
                      height: '100%',
                      overflow: 'hidden',
                      // Verbesserte Ausrichtung ohne absolute Positionierung
                      justifyContent: 'center',
                      alignSelf: 'stretch'
                      
                    }}
                  >
                    <RectButton
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                      }}
                      onPress={() => handleOpenFoodDetails(entry)}
                    >
                      <Animated.View
                        style={{
                          transform: [{ translateX: trans }],
                          alignItems: 'center',
                        }}
                      >
                        <Edit2 size={24} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontFamily: theme.typography.fontFamily.medium, marginTop: 4 }}>
                          Bearbeiten
                        </Text>
                      </Animated.View>
                    </RectButton>
                  </Animated.View>
                );
              }}
            >
              <LongPressGestureHandler
                onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.ACTIVE) {
                    // Haptisches Feedback beim Long Press
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleEntryActions(entry);
                  }
                }}
                minDurationMs={400}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12, // Größere Touchfläche für bessere Benutzererfahrung
                  paddingHorizontal: theme.spacing.m,
                  backgroundColor: theme.colors.card,
                  // Konstante Höhe für bessere Ausrichtung
                  minHeight: 56,
                  ...index < array.length - 1 ? {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border + '40',
                  } : {
                    // Kein margin beim letzten Element, da wir padding im Container haben
                    marginBottom: 0
                  }
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }}>
                      {entry.foodItem.name}
                    </Text>
                    <Text style={{ fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight, fontSize: 12 }}>
                      {entry.servingAmount}{entry.foodItem.nutrition?.servingSize?.toLowerCase().includes('ml') || entry.foodItem.nutrition?.servingSize?.toLowerCase().includes('l') ? 'ml' : 'g'}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary }}>
                    {Math.round((entry.foodItem.nutrition?.calories ?? 0) * (entry.servingAmount / 100))} kcal
                  </Text>
                </View>
              </LongPressGestureHandler>
            </Swipeable>
          ))
        ) : (
          <Text style={{ 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.textLight, 
            textAlign: 'center', 
            paddingVertical: 16, // 2 Grid Punkte (8px * 2)
          }}>
            Keine Einträge vorhanden
          </Text>
        )}
      </Animated.View>
    )
  };
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // Ref für Swipeable-Komponenten, um sie zurücksetzen zu können
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createDailyLogStyles(theme);
  
  // Verwende den gemeinsamen DateContext statt lokalem State
  const { selectedDate, setSelectedDate } = useDateContext();
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // State for tracking expanded meal sections
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

  // Format the date for display using our utility function
  const formattedDate = formatDateForDisplay(selectedDate);

  // Toggle expand/collapse state for meal sections
  const toggleMealAccordion = (mealType: string) => {
    // State aktualisieren (expandiert/nicht expandiert)
    setExpandedMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };
  // Function to handle date changes
  const handleChangeDate = useCallback((newDate: string) => {
    setSelectedDate(newDate);
  }, [setSelectedDate]);
  
  // Funktion zum Umschalten des Cheat Day Status
  const handleToggleCheatDay = async () => {
    if (!dailyLog) return;
    
    try {
      // Haptisches Feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Neuen Status festlegen (umkehren des aktuellen Status)
      const updatedLog = {
        ...dailyLog,
        isCheatDay: !dailyLog.isCheatDay
      };
      
      // Log im State aktualisieren für sofortiges UI-Feedback
      setDailyLog(updatedLog);
      
      // In der Datenbank speichern
      await saveDailyLog(updatedLog);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Cheat Day Status:', error);
      Alert.alert('Fehler', 'Der Status konnte nicht aktualisiert werden.');
    }
  };

  // Function to load daily log data
  const loadDailyLog = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      console.log(`Current time in ISO format: ${now.toISOString()}`);
      console.log(`Local timezone offset: ${now.getTimezoneOffset()} minutes`);

      const log = await getDailyLogByDate(selectedDate);
      
      if (log) {
        setDailyLog(log);
      } else {
        const newLog: DailyLog = {
          date: selectedDate,
          foodEntries: [],
          waterIntake: 0,
          dailyNotes: ''
        };
        setDailyLog(newLog);
        await saveDailyLog(newLog);
      }
    } catch (error) {
      console.error('Error loading daily log:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]); // Füge selectedDate als Abhängigkeit hinzu, damit die Funktion bei Datumsänderungen neu erstellt wird

  // Use useFocusEffect to reload data when the screen comes into focus or when date changes
  useFocusEffect(
    useCallback(() => {
      loadDailyLog();
      return () => {};
    }, [loadDailyLog, selectedDate])
  );

  // Also load on initial mount
  useEffect(() => {
    loadDailyLog();
  }, [loadDailyLog]);

  // Action Sheet Hook
  const { showActionSheetWithOptions } = useActionSheet();
  
  // Handle removing a food entry mit Action Sheet
  const handleRemoveEntry = async (entryId: string) => {
    // Action Sheet Options
    const options = ['Abbrechen', 'Löschen'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 0;
    
    // Action Sheet Styling und Options
    const actionSheetOptions: any = {
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
      // Setze das Theme für das Action Sheet
      userInterfaceStyle: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light',
      // Für iOS: Container Styling
      containerStyle: { backgroundColor: theme.colors.card },
      // Für iOS: Text Styling für Optionen
      textStyle: { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
      // Für iOS: Title Styling
      titleTextStyle: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
      // Für iOS: Message Styling
      messageTextStyle: { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
    };
    
    // iOS-spezifisch
    if (Platform.OS === 'ios') {
      actionSheetOptions.userInterfaceStyle = isDarkMode ? 'dark' : 'light';
    }
    
    showActionSheetWithOptions(actionSheetOptions, async (selectedIndex) => {
      // Abbrechen wurde ausgewählt oder Sheet wurde geschlossen
      if (selectedIndex === cancelButtonIndex) {
        // Swipeable Element zurücksetzen
        const swipeable = swipeableRefs.current.get(entryId);
        if (swipeable) {
          // Haptisches Feedback für Abbruch
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Swipe zurücksetzen
          swipeable.close();
        }
        return;
      }
      
      // Entfernen wurde ausgewählt
      if (selectedIndex === destructiveButtonIndex) {
        if (!dailyLog) return;
        
        try {
          // Haptisches Feedback für Löschen
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Lokalen State aktualisieren für sofortiges UI-Feedback
          const updatedEntries = dailyLog.foodEntries.filter(
            entry => entry.id !== entryId
          );

          const updatedLog = {
            ...dailyLog,
            foodEntries: updatedEntries
          };

          // Log im State aktualisieren
          setDailyLog(updatedLog);
          
          // In der Datenbank speichern
          await saveDailyLog(updatedLog);

          await loadDailyLog();
        } catch (error) {
          Alert.alert('Fehler', 'Der Eintrag konnte nicht entfernt werden.');
        }
      }
    });
  };

  // Funktion zum Öffnen der Food-Details eines Eintrags
  const handleOpenFoodDetails = (entry: FoodEntry) => {
    navigation.getParent()?.navigate('FoodDetail', {
      foodItem: entry.foodItem,
      mealType: entry.mealType,
      // Bearbeitung eines existierenden Eintrags
      existingEntryId: entry.id,
      servingAmount: entry.servingAmount,
      // Wichtig: Gib das Datum des Eintrags mit, nicht das aktuell ausgewählte Datum
      selectedDate: dailyLog?.date || selectedDate
    });
  };

  // Funktion zum Anzeigen des ActionSheets mit Optionen für einen Eintrag
  const handleEntryActions = (entry: FoodEntry) => {
    // Action Sheet Options
    const options = ['Abbrechen', 'Bearbeiten', 'Löschen'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 0;
    
    // Action Sheet Styling und Options
    const actionSheetOptions: any = {
      options,
      cancelButtonIndex,
      destructiveButtonIndex,
      // Setze das Theme für das Action Sheet
      userInterfaceStyle: (isDarkMode ? 'dark' : 'light') as 'dark' | 'light',
      // Für iOS: Container Styling
      containerStyle: { backgroundColor: theme.colors.card },
      // Für iOS: Text Styling für Optionen
      textStyle: { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
      // Für iOS: Title Styling
      titleTextStyle: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
      // Für iOS: Message Styling
      messageTextStyle: { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
    };
    
    // iOS-spezifisch
    if (Platform.OS === 'ios') {
      actionSheetOptions.userInterfaceStyle = isDarkMode ? 'dark' : 'light';
    }
    
    showActionSheetWithOptions(actionSheetOptions, async (selectedIndex) => {
      // Abbrechen wurde ausgewählt oder Sheet wurde geschlossen
      if (selectedIndex === cancelButtonIndex) {
        return;
      }
      
      // Bearbeiten wurde ausgewählt
      if (selectedIndex === 1) {
        handleOpenFoodDetails(entry);
        return;
      }
      
      // Löschen wurde ausgewählt
      if (selectedIndex === destructiveButtonIndex) {
        handleRemoveEntry(entry.id);
      }
    });
  };

  // Calculate nutrition totals
  const calculateTotals = () => {
    if (!dailyLog || dailyLog.foodEntries.length === 0) {
      return { 
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0,
        mealTotals: {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
      };
    }

    // Initialize totals object
    const initialTotals = { 
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0,
      mealTotals: {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }
    };

    return dailyLog.foodEntries.reduce(
      (totals, entry) => {
        const { nutrition } = entry.foodItem;
        const multiplier = entry.servingAmount;
        const mealType = entry.mealType as keyof typeof totals.mealTotals;

        // Calculate nutrition values for this entry
        const entryCalories = (nutrition?.calories ?? 0) * (multiplier / 100);
        const entryProtein = (nutrition?.protein ?? 0) * (multiplier / 100);
        const entryCarbs = (nutrition?.carbs ?? 0) * (multiplier / 100);
        const entryFat = (nutrition?.fat ?? 0) * (multiplier / 100);

        // Update meal-specific totals
        totals.mealTotals[mealType].calories += entryCalories || 0;
        totals.mealTotals[mealType].protein += entryProtein || 0;
        totals.mealTotals[mealType].carbs += entryCarbs || 0;
        totals.mealTotals[mealType].fat += entryFat || 0;

        // Update overall totals
        return {
          calories: totals.calories + entryCalories,
          protein: totals.protein + entryProtein,
          carbs: totals.carbs + entryCarbs,
          fat: totals.fat + entryFat,
          mealTotals: totals.mealTotals
        };
      },
      initialTotals
    );
  };

  const totals = calculateTotals();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }
      ]}>
        {/* Wiederverwendbare Datumsnavigations-Komponente */}
        <DateNavigationHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onCalendarOpen={() => setShowCalendarModal(true)}
        />
      </View>
      
      {/* Wiederverwendbare Calendar Modal Komponente */}
      <CalendarModal
        isVisible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        selectedDate={selectedDate}
        onDateSelect={(date) => setSelectedDate(date)}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ padding: 16, paddingTop: 16 }} // 2 Grid-Punkte
      >

        {/* Daily summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.medium, marginBottom: theme.spacing.m }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s }}>
            <Text style={[styles.summaryTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
              Tagesübersicht
            </Text>
            
            {/* Cheat Day Button */}
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: dailyLog?.isCheatDay ? theme.colors.primary : 'transparent',
                borderRadius: theme.borderRadius.medium,
                borderColor: theme.colors.primary,
                borderWidth: 1,
                paddingVertical: theme.spacing.xs,
                paddingHorizontal: theme.spacing.s,
                marginTop: -theme.spacing.s,
              }}
              onPress={handleToggleCheatDay}
            >
              {dailyLog?.isCheatDay ? (
                <ShieldOff size={theme.typography.fontSize.s} color="white" style={{ marginRight: theme.spacing.xs }} />
              ) : (
                <ShieldCheck size={theme.typography.fontSize.m} color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
              )}
              <Text style={{
                color: dailyLog?.isCheatDay ? 'white' : theme.colors.primary,
                fontFamily: theme.typography.fontFamily.medium,
                fontSize: theme.typography.fontSize.xs
              }}>
                {dailyLog?.isCheatDay ? 'Cheat Day' : 'Normaler Tag'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.calories }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kalorien
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.protein }]}>
                {Math.round(totals.protein)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Protein
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.carbs }]}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Kohlenhydrate
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.nutrition.fat }]}>
                {Math.round(totals.fat)}g
              </Text>
              <Text style={[styles.summaryLabel, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                Fette
              </Text>
            </View>
          </View>
        </View>
        
        {/* Alle Mahlzeiten */}
        <MealCategory 
          mealType="breakfast"
          emoji="🥞"
          title="Frühstück"
          calories={totals.mealTotals.breakfast?.calories || 0}
        />
        
        <MealCategory 
          mealType="lunch"
          emoji="🌮"
          title="Mittagessen"
          calories={totals.mealTotals.lunch?.calories || 0}
        />
        
        <MealCategory 
          mealType="dinner"
          emoji="🍽️"
          title="Abendessen"
          calories={totals.mealTotals.dinner?.calories || 0}
        />
        
        <MealCategory 
          mealType="snack"
          emoji="🍪"
          title="Snacks"
          calories={totals.mealTotals.snack?.calories || 0}
          isLast={true}
        />
      </ScrollView>
    </View>
  );
};

// Wrapper-Komponente mit ActionSheetProvider
export default function DailyLogScreen(props: JournalTabScreenProps) {
  return (
    <ActionSheetProvider>
      <DailyLogScreenContent {...props} />
    </ActionSheetProvider>
  );
}