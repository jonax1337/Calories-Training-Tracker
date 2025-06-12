import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Vibration, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import SliderWithInput from '../components/ui/slider-with-input';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { FoodItem, MealType, FoodEntry } from '../types';
import NutritionalInfoCard from '../components/ui/nutritional-info-card';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { saveFoodItem, getDailyLogByDate, saveDailyLog } from '../services/storage-service';
import generateSimpleId from '../utils/id-generator';
import { formatToLocalISODate, getTodayFormatted, dateToMySQLDateTime } from '../utils/date-utils';
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
  
  // Add state for the selected date (use passed date or default to today)
  const [selectedDate, setSelectedDate] = useState<string>(passedDate || getTodayFormatted());
  
  // Flag to indicate if we're editing an existing entry
  const isEditing = Boolean(existingEntryId);
  
  // Bestimme die Einheit basierend auf servingSize (ml oder g)
  const [servingUnit, setServingUnit] = useState<"Gramm" | "Milliliter">("Gramm");

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
        
        // Setze die Einheit basierend auf der servingSize
        if (passedFoodItem.nutrition && passedFoodItem.nutrition.servingSize) {
          const servingSizeStr = passedFoodItem.nutrition.servingSize.toLowerCase();
          if (servingSizeStr.includes('ml') || servingSizeStr.includes('l')) {
            setServingUnit("Milliliter");
          } else {
            setServingUnit("Gramm");
          }
        }
        
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
            
            // Setze die Einheit basierend auf der servingSize
            if (data.nutrition && data.nutrition.servingSize) {
              const servingSizeStr = data.nutrition.servingSize.toLowerCase();
              if (servingSizeStr.includes('ml') || servingSizeStr.includes('l')) {
                setServingUnit("Milliliter");
              } else {
                setServingUnit("Gramm");
              }
            }
            
            // Setze die Portionsgröße auf die tatsächliche Füllmenge des Produkts
            if (data.nutrition && data.nutrition.servingSizeGrams) {
              const productSize = data.nutrition.servingSizeGrams;
              setServings(productSize.toFixed(2));
              setSliderValue(productSize);
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
      
      // Prüfen, ob es sich um ein Produkt mit Milliliter-Einheit handelt und wir es zum ersten Mal hinzufügen
      const isLiquidProduct = servingUnit === "Milliliter";
      
      // Nur bei Flüssigkeiten und nur beim Hinzufügen (nicht beim Bearbeiten)
      if (!isEditing && isLiquidProduct) {
        // Zeige Dialog an, der fragt, ob das Getränk zum Wasserstand hinzugefügt werden soll
        let waterAmount = Math.round(parseFloat(servings)); // ML basierend auf der Portionsgröße
        
        // Sicherstellen, dass der Wasserwert sinnvoll ist (min. 50ml)
        if (waterAmount >= 50) {
          Alert.alert(
            'Wasser hinzufügen?',
            `Möchtest du ${waterAmount}ml zum heutigen Wasserstand hinzufügen?`,
            [
              {
                text: 'Nein',
                style: 'cancel',
                onPress: () => navigation.goBack()
              },
              {
                text: 'Ja',
                onPress: async () => {
                  try {
                    // Wasserstand im DailyLog aktualisieren
                    dailyLog.waterIntake += waterAmount;
                    await saveDailyLog(dailyLog);
                    
                    // Erfolgs-Feedback
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    navigation.goBack();
                  } catch (error) {
                    console.error('Fehler beim Aktualisieren des Wasserstands:', error);
                    navigation.goBack();
                  }
                }
              }
            ]
          );
        } else {
          navigation.goBack();
        }
      } else {
        // Wenn kein Getränk oder beim Bearbeiten, einfach zurückgehen
        navigation.goBack();
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? theme.spacing.xl * 2 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingRight: theme.spacing.m,
          paddingLeft: theme.spacing.m,
          paddingBottom: theme.spacing.xl, // Extra padding at bottom for keyboard space
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
      >
        {isLoading ? (
          <View style={[styles.loadingContainer, { marginTop: theme.spacing.xl }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.medium,
              marginTop: theme.spacing.m 
            }]}>Lade Produktdaten...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Abstand zur oberen Kante */}
            <View style={{ marginTop: theme.spacing.m }} />
            
            {/* Produktinformationen - Name und Marke */}
            <View style={[styles.card]}>
              
              {/* Produktname */}
              <Text style={[styles.cardTitle, {
                color: theme.colors.text,
                marginBottom: foodItem?.brand ? theme.spacing.s : theme.spacing.m
              }]}>
                {foodItem?.name || customName}
              </Text>
              
              {/* Marke (falls vorhanden) */}
              {foodItem?.brand && (
                <View style={{ 
                  marginBottom: theme.spacing.s,
                  backgroundColor: theme.colors.surfaceVariant,
                  padding: theme.spacing.s,
                  borderRadius: theme.borderRadius.small
                }}>
                  <Text style={[styles.label, { 
                    color: theme.colors.textLight,
                    marginBottom: 0
                  }]}>
                    <Text style={{ fontFamily: theme.typography.fontFamily.medium }}>{foodItem.brand}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Nutrition information */}
            {foodItem?.nutrition && (
            <View style={{ marginBottom: theme.spacing.s }}>
              <NutritionalInfoCard
              nutrition={foodItem.nutrition}
              servingMultiplier={parseFloat(servings) / 100} 
            />
            </View>
            )}

            {/* Portionsinformationen */}
            {foodItem?.nutrition?.servingDescription && (
              <View style={{ 
                marginBottom: theme.spacing.m, 
                backgroundColor: theme.colors.surfaceVariant,
                padding: theme.spacing.m,
                borderRadius: theme.borderRadius.small,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.primary
              }}>
                <Text style={{
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.medium,
                  marginBottom: theme.spacing.xs
                }}>
                  Portionsinformationen:
                </Text>
                {foodItem.nutrition.servingDescription && (
                  <Text style={{
                    color: theme.colors.text,
                    opacity: 0.7,
                    fontFamily: theme.typography.fontFamily.regular,
                    marginTop: theme.spacing.xs
                  }}>
                    {foodItem.nutrition.servingDescription}
                  </Text>
                )}
              </View>
            )}

            {/* Mengeneingabe mit wiederverwendbarem SliderWithInput */}
            <SliderWithInput
              minValue={1}
              maxValue={1000}
              middleValue={500}
              step={0.01}
              decimalPlaces={2}
              allowDecimals={true}
              value={parseFloat(servings) || 100}
              onValueChange={(value: number) => {
                setServings(value.toFixed(2));  // Formatiere mit 2 Nachkommastellen
                // Wir brauchen sliderValue für die Konsistenz im bestehenden Code
                setSliderValue(value);
              }}
              label="Menge"
              unit={servingUnit}
              placeholder="100"
            />
            
            {/* Mahlzeitenauswahl - nur im Bearbeitungsmodus anzeigen */}
            {isEditing && (
              <View style={[styles.card, { marginTop: theme.spacing.m, borderWidth: 1, borderColor: theme.colors.border }]}>
                <Text style={styles.sectionTitle}>
                  Mahlzeit auswählen
                </Text>
                <View style={styles.mealTypeContainer}>
                  {Object.values(MealType).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        {
                          minWidth: '47%',
                          alignItems: 'center',
                          padding: theme.spacing.m,
                          borderRadius: theme.borderRadius.medium,
                          borderWidth: 1,
                          marginBottom: theme.spacing.s,
                        },
                        selectedMeal === type 
                          ? { 
                              borderColor: theme.colors.primary,
                              backgroundColor: theme.colors.primary + '15',
                            }
                          : {
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.background,
                            }
                      ]}
                      onPress={() => {
                        setSelectedMeal(type);
                        // Haptic feedback
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        textAlign: 'center',
                        fontSize: theme.typography.fontSize.m,
                        fontFamily: selectedMeal === type 
                          ? theme.typography.fontFamily.bold 
                          : theme.typography.fontFamily.regular,
                        color: selectedMeal === type ? theme.colors.primary : theme.colors.text,
                      }}>
                        {getMealTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Add to log button */}
            <TouchableOpacity
              style={[styles.addButton, { 
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                marginTop: theme.spacing.l,
                marginBottom: theme.spacing.xl
              }]}
              onPress={handleAddToLog}
            >
              <Text style={styles.addButtonText}>{isEditing ? 'Aktualisieren' : 'Hinzufügen'}</Text>
            </TouchableOpacity>
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