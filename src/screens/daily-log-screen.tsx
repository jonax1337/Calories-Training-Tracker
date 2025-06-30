import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, FlatList, TouchableOpacity, Alert, ScrollView, Modal, Animated, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { Swipeable, RectButton, LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';
import CalendarModal from '../components/ui/calendar-modal';
import DateNavigationHeader from '../components/ui/date-navigation-header';
import { CircleChevronUp, CircleChevronDown, ChevronsLeft, ChevronsRight, X, Trash2, Info, ChevronLeft, ChevronRight, Edit2, Plus, ShieldOff, ShieldCheck, PlusCircle, ListPlus, CirclePlus, ScanLine, ScanBarcode, ScanQrCode } from 'lucide-react-native';
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

  // Wiederverwendbarer Button für "Eintrag hinzufügen" Funktionalität
  const AddEntryButton = ({ mealType, label, iconSize, fontSize }: { mealType: string; label?: string; iconSize?: number; fontSize?: number }) => {
    return (
      <TouchableOpacity
        style={styles.addEntryButton}
        onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType })}
      >
        <CirclePlus size={iconSize ?? theme.typography.fontSize.m} color="white" style={{ marginRight: label ? theme.spacing.s : 0 }} />
        {label ? <Text style={[styles.addEntryButtonText, { fontSize: fontSize ?? theme.typography.fontSize.s }]}>
          {label}
        </Text> : null}
      </TouchableOpacity>
    );
  };

  // Wiederverwendbare Komponente für eine komplette Mahlzeiten-Kategorie
  const MealCategory = ({ mealType, emoji, title, calories, isLast = false }: MealCategoryProps) => {
    return (
      <View style={styles.mealSectionContainer}>
        {/* Header-Bereich - klickbar für Scanner */}
        <TouchableOpacity 
          style={[
            styles.mealCategoryCard,
            expandedMeals[mealType] && styles.mealCategoryCardExpanded
          ]}
        >
          <View style={styles.mealCategoryContent}>
            {/* Linke Seite - Mahlzeiteninfo mit Scan-Icon */}
            <TouchableOpacity 
              style={styles.mealCategoryLeftSection}
              onPress={() => navigation.getParent()?.navigate('BarcodeScanner', { mealType })}
            >
              <View>
                <View style={styles.mealTitleContainer}>
                  <ScanQrCode size={theme.typography.fontSize.xl} color={theme.colors.text} style={styles.scanIcon} />
                  <Text style={styles.mealCategoryTitle}>
                    {title} {emoji}
                  </Text>
                </View>
                {dailyLog && dailyLog.foodEntries.filter(entry => entry.mealType === mealType).length > 0 ? (
                  <Text style={styles.mealCategorySubtitle}>
                    {dailyLog.foodEntries.filter(entry => entry.mealType === mealType).length} 
                    {dailyLog.foodEntries.filter(entry => entry.mealType === mealType).length === 1 ? ' Eintrag' : ' Einträge'}
                  </Text>
                ) : (
                  <Text style={styles.mealCategorySubtitle}>
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
      style={styles.mealCategoryRightSection}
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
      <Text style={styles.mealCategoryCalories}>
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
      <Animated.View style={[
        styles.accordionContent,
        isLast && styles.accordionContentLast,
        {
          opacity: animatedValue, // Animation der Transparenz
          transform: [{ 
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0] // Gleitet von oben ein
            })
          }]
        }
      ]}>
        {entries.length > 0 ? (
          // Wenn Einträge vorhanden sind, nur die Einträge anzeigen
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
                    style={[
                      styles.swipeActionContainer,
                      index === array.length - 1 ? styles.lastSwipeActionContainerRight : null,
                      {
                        backgroundColor: theme.colors.error,
                        opacity,
                      }
                    ]}
                  >
                    <RectButton
                      style={styles.swipeActionButton}
                      onPress={() => handleRemoveEntry(entry.id)}
                    >
                      <Animated.View
                        style={[
                          styles.swipeActionContent,
                          { transform: [{ translateX: trans }] }
                        ]}
                      >
                        <Trash2 size={theme.typography.fontSize.l} color="white" />
                        <Text style={styles.swipeActionText}>
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
                    style={[
                      styles.swipeActionContainer,
                      index === array.length - 1 ? styles.lastSwipeActionContainerLeft : null,
                      {
                        backgroundColor: theme.colors.accent,
                        opacity,
                      }
                    ]}
                  >
                    <RectButton
                      style={styles.swipeActionButton}
                      onPress={() => handleOpenFoodDetails(entry)}
                    >
                      <Animated.View
                        style={[
                          styles.swipeActionContent,
                          { transform: [{ translateX: trans }] }
                        ]}
                      >
                        <Edit2 size={theme.typography.fontSize.l} color="white" />
                        <Text style={styles.swipeActionText}>
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
                <View style={[styles.foodEntryContainer, index === array.length - 1 ? styles.lastFoodEntryContainer : null]}>
                  <View style={styles.foodEntryLeftSection}>
                    <Text style={styles.foodName}>
                      {entry.foodItem.name}
                    </Text>
                    <Text style={styles.foodServing}>
                      {entry.servingAmount}{entry.foodItem.nutrition?.servingSize?.toLowerCase().includes('ml') || entry.foodItem.nutrition?.servingSize?.toLowerCase().includes('l') ? 'ml' : 'g'}
                    </Text>
                  </View>
                  <Text style={styles.foodCalories}>
                    {Math.round((entry.foodItem.nutrition?.calories ?? 0) * (entry.servingAmount / 100))} kcal
                  </Text>
                </View>
              </LongPressGestureHandler>
            </Swipeable>
          ))
        ) : (
          // Wenn keine Einträge vorhanden sind, eine Meldung anzeigen
          <View style={styles.noEntriesContainer}>
            <Text style={styles.noEntriesText}>Keine Einträge vorhanden</Text>
          </View>
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
  const [animationKey, setAnimationKey] = useState(0);
  const [isScreenVisible, setIsScreenVisible] = useState(false); // Start hidden until first focus
  const [hasBeenFocused, setHasBeenFocused] = useState(false); // Track if screen was ever focused
  const isInitialMount = useRef(true);
  const lastFocusTime = useRef(0);
  
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
      
      const currentTime = Date.now();
      const timeSinceLastFocus = currentTime - lastFocusTime.current;
      
      // Mark screen as focused at least once
      if (!hasBeenFocused) {
        setHasBeenFocused(true);
      }
      
      // Only trigger animations on tab navigation (quick successive focus events)
      // Stack navigation typically has longer delays between focus events
      if (!isInitialMount.current && timeSinceLastFocus < 1000) {
        // This is likely a tab navigation - hide content briefly, then show with animation
        setIsScreenVisible(false);
        const timer = setTimeout(() => {
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }, 50);
        
        lastFocusTime.current = currentTime;
        return () => {
          clearTimeout(timer);
        };
      } else {
        // First mount or stack navigation return - no animation disruption
        if (isInitialMount.current) {
          isInitialMount.current = false;
          setIsScreenVisible(true);
          setAnimationKey(prev => prev + 1);
        }
        lastFocusTime.current = currentTime;
      }
      
      return () => {};
    }, [loadDailyLog, selectedDate, hasBeenFocused])
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
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
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
        contentContainerStyle={styles.scrollContentContainer}
      >
        {isScreenVisible && (
          <>
          {/* Daily summary */}
          <Animatable.View 
            key={`summary-${animationKey}`}
            animation="fadeInUp" 
            duration={600} 
            delay={50}
            style={styles.summaryCard}
          >
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>
              Tagesübersicht
            </Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.nutrition.calories }]}>
                {Math.round(totals.calories)}
              </Text>
              <Text style={styles.summaryLabel}>
                Kalorien
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.nutrition.protein }]}>
                {Math.round(totals.protein)}g
              </Text>
              <Text style={styles.summaryLabel}>
                Protein
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.nutrition.carbs }]}>
                {Math.round(totals.carbs)}g
              </Text>
              <Text style={styles.summaryLabel}>
                Kohlenhydrate
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.nutrition.fat }]}>
                {Math.round(totals.fat)}g
              </Text>
              <Text style={styles.summaryLabel}>
                Fette
              </Text>
            </View>
          </View>
        </Animatable.View>
        
        {/* Alle Mahlzeiten */}
        <Animatable.View 
          key={`breakfast-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={100}
        >
          <MealCategory 
            mealType="breakfast"
            emoji="🥞"
            title="Frühstück"
            calories={totals.mealTotals.breakfast?.calories || 0}
          />
        </Animatable.View>
        
        <Animatable.View 
          key={`lunch-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={150}
        >
          <MealCategory 
            mealType="lunch"
            emoji="🌮"
            title="Mittagessen"
            calories={totals.mealTotals.lunch?.calories || 0}
          />
        </Animatable.View>
        
        <Animatable.View 
          key={`dinner-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={200}
        >
          <MealCategory 
            mealType="dinner"
            emoji="🍽️"
            title="Abendessen"
            calories={totals.mealTotals.dinner?.calories || 0}
          />
        </Animatable.View>
        
        <Animatable.View 
          key={`snack-${animationKey}`}
          animation="fadeInUp" 
          duration={600} 
          delay={250}
        >
          <MealCategory 
            mealType="snack"
            emoji="🍪"
            title="Snacks"
            calories={totals.mealTotals.snack?.calories || 0}
            isLast={false}
          />
        </Animatable.View>
        </>
        )}
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