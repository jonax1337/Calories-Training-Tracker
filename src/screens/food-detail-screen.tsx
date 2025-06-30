import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Vibration, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import * as Animatable from 'react-native-animatable';
import SliderWithInput from '../components/ui/slider-with-input';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType, FoodEntry } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { saveFoodItem, getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import generateSimpleId from '../utils/id-generator';
import { formatToLocalISODate, getTodayFormatted, dateToMySQLDateTime } from '../utils/date-utils';
import { determineDisplayUnit, getDisplayUnitString, getShortUnitString } from '../utils/unit-utils';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createFoodDetailStyles } from '../styles/screens/food-detail-styles';
import * as Haptics from 'expo-haptics';
import { sendSoundCommand } from '../components/webview/sound-webview';

type FoodDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export default function FoodDetailScreen({ route, navigation }: FoodDetailScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createFoodDetailStyles(theme);

  // Get parameters from navigation
  const { barcode, foodId, mealType, foodItem: passedFoodItem, selectedDate: passedDate, existingEntryId, servingAmount: passedServingAmount } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(false);
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  
  const initialServingSize = 
    typeof passedServingAmount === 'number' ? passedServingAmount : 
    (passedFoodItem?.nutrition?.servingSizeGrams || 100);
    
  const [servings, setServings] = useState(initialServingSize.toFixed(2));
  
  // sliderValue sollte identisch mit dem numerischen Wert sein
  const [sliderValue, setSliderValue] = useState(initialServingSize);
  
  // Set selected meal based on navigation parameter or default to Lunch
  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    mealType ? MealType[mealType.charAt(0).toUpperCase() + mealType.slice(1) as keyof typeof MealType] : MealType.Lunch
  );
  
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Simple animation state for food detail screen
  const [animationKey, setAnimationKey] = useState(0);
  
  // Add state for the selected date (use passed date or default to today)
  const [selectedDate, setSelectedDate] = useState<string>(passedDate || getTodayFormatted());
  
  // Flag to indicate if we're editing an existing entry
  const isEditing = Boolean(existingEntryId);
  
  // Bestimme die Einheit intelligent basierend auf dem FoodItem
  const displayUnit = determineDisplayUnit(foodItem);
  const servingUnit = getDisplayUnitString(displayUnit);
  
  // Portionen-Modus: Bestimme ob wir Portionen anstatt Gramm anzeigen können
  const canUsePortionMode = foodItem?.nutrition?.servingSizeGrams && foodItem.nutrition.servingSizeGrams !== 100;
  const [usePortionMode, setUsePortionMode] = useState(false);
  
  // Debug-Log für Portionen-Modus
  useEffect(() => {
    if (foodItem?.nutrition) {
      console.log('DEBUG: Portionen-Modus Analyse:', {
        productName: foodItem.name,
        servingSizeGrams: foodItem.nutrition.servingSizeGrams,
        canUsePortionMode,
        usePortionMode
      });
    }
  }, [foodItem, canUsePortionMode, usePortionMode]);

  // Referenz zum ScrollView, um Scrollposition zu kontrollieren
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Aktuellen Scrollstatus speichern und wiederherstellen
  const [scrollPosition, setScrollPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  // Diese Funktion hilft, die Scrollposition beizubehalten
  const maintainScrollPosition = () => {
    if (scrollViewRef.current) {
      // Aktuelle Position speichern
      scrollViewRef.current.scrollTo({x: scrollPosition.x, y: scrollPosition.y, animated: false});
    }
  };
  
  // Scroll-Position beim Text-Input-Fokus beibehalten
  const handleScrollPositionChange = (e: any) => {
    setScrollPosition({
      x: e.nativeEvent.contentOffset.x,
      y: e.nativeEvent.contentOffset.y
    });
  };

  // Load food data when component mounts or create empty food item for manual entry
  useEffect(() => {
    const loadFoodData = async () => {
      if (isEditing && existingEntryId && passedServingAmount) {
        setServings(passedServingAmount.toFixed(2));
        setSliderValue(passedServingAmount);
      }
      
      // Wenn ein FoodItem direkt übergeben wurde, verwende dieses
      if (passedFoodItem) {
        setFoodItem(passedFoodItem);
        setCustomName(passedFoodItem.name);
        
        // Einheit wird jetzt dynamisch basierend auf selectedMeal bestimmt
        
        // Setze die Portionsgröße NUR, wenn wir KEINEN existierenden Eintrag bearbeiten
        // Ansonsten verwenden wir die Menge aus dem Food Entry!
        if (!isEditing && passedFoodItem.nutrition) {
          // Entscheide, welche Portionsgröße wir verwenden:
          // 1. Bei neuen Einträgen verwenden wir eine Portion (servingSizeGrams) anstatt 100g
          // 2. Beim Editieren verwenden wir die übergebene Portionsgröße
          
          // Servingsize verwenden, wenn vorhanden - Standardwert ist 100g oder ml
          let portionSize = 100;
          
          // Verwende die Portionsgröße in Gramm, wenn diese aus der API extrahiert wurde
          if (passedFoodItem.nutrition.servingSizeGrams) {
            portionSize = passedFoodItem.nutrition.servingSizeGrams;
          }
          
          // Setze den Slider-Wert auf die Portionsgröße
          setServings(portionSize.toFixed(2));
          setSliderValue(portionSize);
        }
        
        setIsLoading(false);
        return;
      }

      // Ansonsten versuche, Daten über Barcode oder ID zu laden
      if (barcode) {
        setIsLoading(true);
        try {
          const data = await getFoodDataByBarcode(barcode);
          if (data) {
            // Entferne das Bild aus dem Food Item
            const foodWithoutImage = {
              ...data,
              image: undefined
            };
            setFoodItem(foodWithoutImage);
            setCustomName(data.name);
            
            // Einheit wird jetzt dynamisch basierend auf selectedMeal bestimmt
            
            // Setze die Portionsgröße auf die tatsächliche Füllmenge des Produkts
            if (data.nutrition && data.nutrition.servingSizeGrams) {
              // Konvertiere servingSizeGrams zu einer Zahl, falls es ein String ist
              let productSize: string | number = data.nutrition.servingSizeGrams as any;
              
              // Konvertiere String zu Zahl oder entferne "g", "ml" usw.
              if (typeof productSize === 'string') {
                // Entferne nicht-numerische Zeichen, behalte aber dezimale Punkte
                productSize = parseFloat(productSize.replace(/[^0-9.]/g, ''));
              }

              // Prüfe, ob die Konvertierung erfolgreich war und wir eine gültige Zahl haben
              if (!isNaN(productSize) && typeof productSize === 'number') {
                setServings(productSize.toFixed(2));
                setSliderValue(productSize);
              } else {
                // Fallback auf einen Standardwert
                console.log('Ungültiger servingSizeGrams-Wert:', data.nutrition.servingSizeGrams);
                setServings('100.00');
                setSliderValue(100);
              }
            } else {
              // Fallback, wenn keine servingSizeGrams angegeben sind
              console.log('Keine servingSizeGrams vorhanden');
              setServings('100.00');
              setSliderValue(100);
            }
          } else {
            setError('Produkt nicht gefunden.');
          }
        } catch (err) {
          setError('Fehler beim Abrufen der Produktdaten');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadFoodData();
    
    // Trigger initial animation when screen mounts
    setAnimationKey(prev => prev + 1);
  }, [barcode, foodId, passedFoodItem]);

  const handleAddToLog = async () => {
    if (!foodItem) return;

    try {
      // Create a copy with the custom name if it was changed
      const updatedFoodItem = {
        ...foodItem,
        name: customName || foodItem.name,
      };

      
      try {
        await saveFoodItem(updatedFoodItem);
      } catch (saveError) {
        Alert.alert('Fehler beim Speichern', 'Das Lebensmittel konnte nicht in der Datenbank gespeichert werden.');
        // Haptics
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return;
      }

      // Use the selected date instead of today for the daily log
      
      // Format the entry time for MySQL compatibility
      const now = new Date();
      const mysqlCompatibleTime = dateToMySQLDateTime(now);
      
      // Get the daily log for the selected date
      let dailyLog;
      try {
        dailyLog = await getDailyLogByDate(selectedDate);
      } catch (logError) {
        // Create a default log if one doesn't exist
        dailyLog = {
          date: selectedDate,
          foodEntries: [],
          waterIntake: 0,
          dailyNotes: ''
        };
      }
      
      if (isEditing && existingEntryId) {
        // Update existing entry
        
        // Find index of entry to update
        const entryIndex = dailyLog.foodEntries.findIndex(entry => entry.id === existingEntryId);
        
        if (entryIndex !== -1) {
          // Update the existing entry
          const updatedEntry = {
            ...dailyLog.foodEntries[entryIndex],
            foodItem: updatedFoodItem,
            servingAmount: parseFloat(servings) || 1,
            mealType: selectedMeal
            // Don't update timeConsumed to preserve original consumption time
          };
          
          // Replace the entry in the array
          dailyLog.foodEntries[entryIndex] = updatedEntry;
        } else {
          Alert.alert('Fehler', 'Der zu aktualisierende Eintrag wurde nicht gefunden');
          return;
        }
      } else {
        // ADD MODE: Create a new entry
        const entry: FoodEntry = {
          id: generateSimpleId(),
          foodItem: updatedFoodItem,
          servingAmount: parseFloat(servings) || 1,
          mealType: selectedMeal,
          timeConsumed: now.toISOString(),
        };
        
        // Add the new entry to the daily log
        dailyLog.foodEntries.push(entry);
      }
      
      // STEP 3: Save the updated log
      try {
        await saveDailyLog(dailyLog);
      } catch (saveLogError) {
        Alert.alert('Fehler beim Speichern', 'Der Tageseintrag konnte nicht gespeichert werden');
        // Haptics
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return;
      }

      // Success Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Kurzen Erfolgssound abspielen (falls Gerät nicht stumm ist)
      try {
        // Kurzen Ping für erfolgreiches Hinzufügen abspielen
        sendSoundCommand({ type: 'playSuccessPing' });
      } catch (soundError) {
        console.warn('Could not play success sound:', soundError);
      }

      Vibration.vibrate([0, 100, 0, 100]);
      
      // Check if food item is liquid and prompt for water intake
      if (displayUnit === 'ml') {
        const waterAmount = Math.round(parseFloat(servings) || 0);
        Alert.alert(
          `Getränk erkannt`,
          `Möchten Sie ${waterAmount}ml zu Ihrem Wasserstand hinzufügen?`,
          [
            {
              text: 'Nein',
              style: 'cancel',
              onPress: () => handleSuccessNavigation()
            },
            {
              text: 'Ja',
              onPress: async () => {
                await addToWaterIntake(waterAmount);
                handleSuccessNavigation();
              }
            }
          ]
        );
      } else {
        handleSuccessNavigation();
      }
      
    } catch (err) {
      console.error('Error in handleAddToLog:', err);
      Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten beim Hinzufügen des Lebensmittels');
      // Error Haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Vibration.vibrate([0, 500, 0, 500]);
    }
  };

  // Helper function to add water intake
  const addToWaterIntake = async (amount: number) => {
    try {
      // Get current daily log
      const currentLog = await getDailyLogByDate(selectedDate);
      
      // Add water amount to existing intake
      const updatedLog = {
        ...currentLog,
        waterIntake: (currentLog.waterIntake || 0) + amount
      };
      
      // Save updated log
      await saveDailyLog(updatedLog);
      console.log(`Added ${amount}ml to water intake for ${selectedDate}`);
    } catch (error) {
      console.error('Error adding to water intake:', error);
      Alert.alert('Fehler', 'Konnte nicht zum Wasserstand hinzufügen');
    }
  };

  // Helper function to handle navigation after successful addition
  const handleSuccessNavigation = () => {
    // Always navigate back to previous screen to avoid stacking
    navigation.goBack();
  };

  // Helper function to extract product size in grams from quantity string
  const getProductSizeGrams = (quantity: string | undefined): number | null => {
    if (!quantity) return null;
    
    const quantityLower = quantity.toLowerCase();
    
    // Match patterns like "345g", "1.5kg", "500ml", "33cl", "2l"
    const match = quantityLower.match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|l)\b/);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      const unit = match[2];
      
      // Convert to grams
      if (unit === 'kg') return amount * 1000;
      if (unit === 'l') return amount * 1000; // 1l ≈ 1000g for liquids
      if (unit === 'cl') return amount * 10; // 1cl = 10ml ≈ 10g for liquids
      if (unit === 'ml') return amount; // 1ml ≈ 1g for liquids
      if (unit === 'g') return amount;
    }
    
    // If we can't parse the quantity (like "20pcs"), return null
    return null;
  };


  const renderMealTypeButton = (mealType: MealType, label: string) => (
    <TouchableOpacity
      style={[
        styles.mealButton,
        selectedMeal === mealType && styles.selectedMealButton,
        { borderColor: theme.colors.border, borderRadius: theme.borderRadius.small },
      ]}
      onPress={() => setSelectedMeal(mealType)}
    >
      <Text
        style={[
          styles.mealButtonText,
          selectedMeal === mealType && styles.selectedMealButtonText,
          { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? theme.spacing.xl * 2 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Lade Produktdaten...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Food Item Name and Edit */}
            <Animatable.View 
              key={`food-name-${animationKey}`}
              animation="fadeInUp" 
              duration={600} 
              delay={50}
            >
              {/* Abstand zur oberen Kante */}
            <View style={styles.topSpacer} />
            
            {/* Produktinformationen - Name und Marke */}
            <View style={styles.card}>
              
              {/* Produktname */}
              <Text style={[
                styles.cardTitle,
                foodItem?.brand && styles.cardTitleWithBrand
              ]}>
                {foodItem?.name || customName}
              </Text>
              
              {/* Marke (falls vorhanden) */}
              {foodItem?.brand && (
                <View>
                  <Text style={[styles.brandText]}>
                    <Text style={{ fontFamily: theme.typography.fontFamily.medium }}>{foodItem.brand}</Text>
                  </Text>
                </View>
              )}
            </View>
            </Animatable.View>

            {/* Nutrition information */}
            {foodItem?.nutrition && (
            <Animatable.View 
              key={`nutrition-${animationKey}`}
              animation="fadeInUp" 
              duration={600} 
              delay={100}
              style={styles.nutritionContainer}
            >
              <NutritionalInfoCard
              nutrition={foodItem.nutrition}
              servingMultiplier={parseFloat(servings) / 100} 
            />
            </Animatable.View>
            )}

            {/* Portionsinformationen - nur anzeigen wenn es sich um eine echte Portion handelt */}
            {(() => {
              // Null-Check für foodItem
              if (!foodItem || !foodItem.nutrition) {
                console.log('DEBUG: Keine Portionsinformationen - foodItem oder nutrition ist null');
                return null;
              }
              
              const hasServingDescription = foodItem.nutrition.servingDescription;
              const servingSize = foodItem.nutrition.servingSize;
              const servingSizeGrams = foodItem.nutrition.servingSizeGrams;
              
              // Im Edit-Modus: Zeige Portionsdaten aus der DB wenn sie nicht Standard-100g sind
              if (isEditing) {
                const isStandardServing = servingSizeGrams === 100;
                
                console.log('DEBUG: Edit-Modus Portionslogik:', {
                  productName: foodItem.name,
                  servingSizeGrams,
                  isStandardServing,
                  hasServingDescription: !!hasServingDescription
                });
                
                // Zeige Portionsinformationen wenn nicht Standard-100g
                if (isStandardServing) return null;
                
                // Im Edit-Modus zeigen wir die DB-Portionsdaten (OHNE Originalgröße)
                const displayUnit = determineDisplayUnit(foodItem);
                const portionText = hasServingDescription 
                  ? foodItem.nutrition.servingDescription 
                  : `Eine Portion entspricht ${servingSizeGrams}${getShortUnitString(displayUnit)}`;
                
                return (
                  <Animatable.View 
                    key={`portion-info-${animationKey}`}
                    animation="fadeInUp" 
                    duration={600} 
                    delay={150}
                    style={styles.portionInfoContainer}
                  >
                    <Text style={styles.portionInfoTitle}>
                      Portionsinformationen:
                    </Text>
                    <Text style={styles.portionInfoDescription}>
                      {portionText}
                    </Text>
                  </Animatable.View>
                );
              }
              
              // Nicht im Edit-Modus: Normale API-basierte Logik
              const productQuantity = foodItem.nutrition.productQuantity;
              const productSizeGrams = getProductSizeGrams(productQuantity);
              
              let shouldShowPortionInfo = false;
              
              console.log('DEBUG: Portionslogik analysieren (Neu-Modus):', {
                productName: foodItem.name,
                servingSizeGrams,
                productQuantity,
                productSizeGrams
              });
              
              if (productSizeGrams !== null && servingSizeGrams) {
                // Wir können das Produkt verstehen - vergleiche Portion vs Produkt
                const tolerance = Math.max(productSizeGrams * 0.05, 5); // 5% Toleranz oder mindestens 5g
                const isPortionSameAsProduct = Math.abs(servingSizeGrams - productSizeGrams) <= tolerance;
                
                // Zeige Portionsinformationen nur wenn Portion ≠ Produktgröße
                shouldShowPortionInfo = !isPortionSameAsProduct;
                
                console.log(`DEBUG: Portion vs Produkt: ${servingSizeGrams}g vs ${productSizeGrams}g (${productQuantity}) - ${isPortionSameAsProduct ? 'GLEICH' : 'UNTERSCHIEDLICH'}`);
              } else {
                // Wir können das Produkt nicht verstehen (z.B. "20pcs") - Fallback auf 100g
                // Zeige Portionsinformationen nur wenn sie nicht der Standard-100g entsprechen
                const isStandardServing = servingSizeGrams === 100;
                shouldShowPortionInfo = !isStandardServing;
                
                console.log(`DEBUG: Unbekannte Produktgröße (${productQuantity}) - Portion: ${servingSizeGrams}g - ${isStandardServing ? 'STANDARD' : 'CUSTOM'}`);
              }
              
              console.log('DEBUG: Portionsinformationen anzeigen (Neu-Modus)?', shouldShowPortionInfo);
              
              if (!shouldShowPortionInfo) return null;
              
              return (
                <Animatable.View 
                  key={`portion-info-${animationKey}`}
                  animation="fadeInUp" 
                  duration={600} 
                  delay={150}
                  style={styles.portionInfoContainer}
                >
                  <Text style={styles.portionInfoTitle}>
                    Portionsinformationen:
                  </Text>
                  {hasServingDescription && (
                    <Text style={styles.portionInfoDescription}>
                      {foodItem.nutrition.servingDescription}
                    </Text>
                  )}
                  {productQuantity && (
                    <Text style={styles.portionInfoDescription}>
                      Originalgröße: {productQuantity}
                    </Text>
                  )}
                </Animatable.View>
              );
            })()}

            {/* Mengeneingabe mit wiederverwendbarem SliderWithInput */}
            <Animatable.View 
              key={`serving-input-${animationKey}`}
              animation="fadeInUp" 
              duration={600} 
              delay={200}
            >
              {/* Portionen-Modus Toggle */}
              {canUsePortionMode && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.medium,
                  padding: theme.spacing.m,
                  marginBottom: theme.spacing.m,
                  borderColor: theme.colors.border,
                  borderWidth: 1
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: theme.colors.text,
                      fontFamily: theme.typography.fontFamily.medium,
                      fontSize: theme.typography.fontSize.m
                    }}>
                      {usePortionMode ? 'Portionen' : `${servingUnit}`}
                    </Text>
                    <Text style={{
                      color: theme.colors.textLight,
                      fontFamily: theme.typography.fontFamily.regular,
                      fontSize: theme.typography.fontSize.s,
                      marginTop: theme.spacing.xs
                    }}>
                      {usePortionMode 
                        ? `1 Portion = ${foodItem.nutrition.servingSizeGrams}${getShortUnitString(displayUnit)}`
                        : 'Direkte Gewichts-/Volumenangabe'
                      }
                    </Text>
                  </View>
                  <Switch
                    value={usePortionMode}
                    onValueChange={(newValue) => {
                      // Beim Wechsel zwischen Modi den aktuellen Wert beibehalten
                      setUsePortionMode(newValue);
                      
                      // Haptic feedback
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="white"
                  />
                </View>
              )}
              
              <SliderWithInput
              minValue={usePortionMode ? 0.5 : 1}
              maxValue={usePortionMode ? 50 : 1000}
              middleValue={usePortionMode ? 25 : 500}
              step={usePortionMode ? 0.5 : 0.01}
              decimalPlaces={usePortionMode ? 1 : 2}
              allowDecimals={true}
              value={usePortionMode 
                ? (parseFloat(servings) || 100) / (foodItem?.nutrition?.servingSizeGrams || 100)
                : (parseFloat(servings) || 100)
              }
              onValueChange={(value: number) => {
                // Konvertiere zwischen Portionen und Gramm
                const gramsValue = usePortionMode 
                  ? value * (foodItem?.nutrition?.servingSizeGrams || 100)
                  : value;
                  
                setServings(gramsValue.toFixed(2));
                setSliderValue(gramsValue);
              }}
              label={usePortionMode ? "Anzahl Portionen" : "Menge"}
              unit={usePortionMode ? "Portionen" : servingUnit}
              placeholder={usePortionMode ? "1" : "100"}
            />
            </Animatable.View>
            
            {/* Mahlzeitenauswahl - nur im Bearbeitungsmodus anzeigen */}
            {isEditing && (
              <Animatable.View 
                key={`meal-selection-${animationKey}`}
                animation="fadeInUp" 
                duration={600} 
                delay={250}
                style={[styles.card, styles.mealSelectionCard]}
              >
                <Text style={styles.sectionTitle}>
                  Mahlzeit auswählen
                </Text>
                <View style={styles.mealTypeContainer}>
                  {Object.values(MealType).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealButton,
                        selectedMeal === type 
                          ? styles.mealButtonSelected
                          : styles.mealButtonUnselected
                      ]}
                      onPress={() => {
                        setSelectedMeal(type);
                        // Haptic feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={
                        selectedMeal === type 
                          ? styles.mealButtonTextSelected
                          : styles.mealButtonText
                      }>
                        {getMealTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animatable.View>
            )}

            {/* Add to log button */}
            <Animatable.View 
              key={`add-button-${animationKey}`}
              animation="fadeInUp" 
              duration={600} 
              delay={300}
            >
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddToLog}
              >
                <Text style={styles.addButtonText}>{isEditing ? 'Aktualisieren' : 'Hinzufügen'}</Text>
              </TouchableOpacity>
            </Animatable.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getMealTypeLabel(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return 'Frühstück';
    case 'lunch': return 'Mittagessen';
    case 'dinner': return 'Abendessen';
    case 'snack': return 'Snack';
    default: return 'Mahlzeit';
  }
}