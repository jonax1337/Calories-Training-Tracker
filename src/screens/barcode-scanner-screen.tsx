import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ViewStyle, TextStyle, FlatList } from 'react-native';
import { AddTabScreenProps } from '../types/navigation-types';
import { FoodItem } from '../types';
import { getFoodDataByBarcode, searchFoodByName } from '../services/barcode-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualBarcodeScreen({ navigation, route }: AddTabScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Get mealType parameter if passed
  const { mealType } = route.params || {};
  
  const [barcodeInput, setBarcodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [activeTab, setActiveTab] = useState<'barcode' | 'name'>('barcode');

  const handleSubmitBarcode = async () => {
    if (!barcodeInput || barcodeInput.trim().length === 0) {
      setError('Bitte geben Sie einen Barcode ein');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    
    try {
      // Attempt to fetch food data using the barcode
      const foodData = await getFoodDataByBarcode(barcodeInput.trim());
      
      if (foodData) {
        // If successful, navigate to the food detail screen with the barcode and mealType
        // Using parent navigation to access the root stack
        navigation.getParent()?.navigate('FoodDetail', { 
          barcode: barcodeInput.trim(),
          mealType: mealType // Pass the meal type to the food detail screen
        });
      } else {
        // If no data found, display an error
        setError(`Kein Produkt für Barcode gefunden: ${barcodeInput.trim()}`);
      }
    } catch (error) {
      setError('Fehler beim Abrufen der Produktdaten. Bitte versuchen Sie es erneut.');
      console.error('Barcode input error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByName = async () => {
    if (!nameInput || nameInput.trim().length === 0) {
      setError('Bitte geben Sie einen Produktnamen ein');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    
    try {
      // Search for products by name
      const results = await searchFoodByName(nameInput.trim());
      
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        setError(`Keine Produkte mit dem Namen '${nameInput.trim()}' gefunden`);
      }
    } catch (error) {
      setError('Fehler bei der Suche. Bitte versuchen Sie es erneut.');
      console.error('Product search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (foodItem: FoodItem) => {
    // Navigate to food detail screen with the selected food item
    navigation.getParent()?.navigate('FoodDetail', { 
      foodId: foodItem.id,
      mealType: mealType // Pass the meal type to the food detail screen
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={[styles.instructionText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
          Bitte gib den Barcode ein oder suche nach einem Produktnamen
        </Text>
        
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'barcode' && [styles.activeTab, { borderColor: theme.colors.primary }]
            ]} 
            onPress={() => setActiveTab('barcode')}
          >
            <Text style={[
              styles.tabButtonText, 
              { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
              activeTab === 'barcode' && { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }
            ]}>
              Barcode
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'name' && [styles.activeTab, { borderColor: theme.colors.primary }]
            ]} 
            onPress={() => setActiveTab('name')}
          >
            <Text style={[
              styles.tabButtonText, 
              { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
              activeTab === 'name' && { color: theme.colors.primary, fontFamily: theme.typography.fontFamily.bold }
            ]}>
              Produktname
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Barcode Input */}
        {activeTab === 'barcode' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.barcodeInput, { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="Barcode eingeben"
              placeholderTextColor={theme.colors.textLight}
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.medium 
                }
              ]} 
              onPress={handleSubmitBarcode}
              disabled={isLoading}
            >
              <Text style={[styles.submitButtonText, { fontFamily: theme.typography.fontFamily.bold, color: '#fff' }]}>
                Suchen
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Name Input */}
        {activeTab === 'name' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.barcodeInput, { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                color: theme.colors.text
              }]}
              placeholder="Produktname eingeben"
              placeholderTextColor={theme.colors.textLight}
              value={nameInput}
              onChangeText={setNameInput}
            />
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.medium 
                }
              ]} 
              onPress={handleSearchByName}
              disabled={isLoading}
            >
              <Text style={[styles.submitButtonText, { fontFamily: theme.typography.fontFamily.bold, color: '#fff' }]}>
                Suchen
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text }]}>
              Produkt wird gesucht...
            </Text>
          </View>
        )}
        
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
              Suchergebnisse:
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.resultItem, { 
                    backgroundColor: theme.colors.card,
                    borderRadius: theme.borderRadius.small
                  }]}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Text style={[styles.resultName, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  {item.brand && (
                    <Text style={[styles.resultBrand, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
                      {item.brand}
                    </Text>
                  )}
                  <Text style={[styles.resultCalories, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textLight }]}>
                    {Math.round(item.nutrition.calories)} kcal/100g
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        
        {/* Manual Entry Button */}
        <TouchableOpacity 
          style={[
            styles.manualEntryButton, 
            { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium,
              marginTop: 16 // 2 Grid-Punkte (16px)
            }
          ]} 
          onPress={() => navigation.getParent()?.navigate('FoodDetail', { mealType: mealType })}
        >
          <Text style={[
            styles.manualEntryButtonText, 
            { 
              fontFamily: theme.typography.fontFamily.medium, 
              color: theme.colors.text 
            }
          ]}>
            Manuell eingeben
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  instructionText: TextStyle;
  tabContainer: ViewStyle;
  tabButton: ViewStyle;
  activeTab: ViewStyle;
  tabButtonText: TextStyle;
  inputContainer: ViewStyle;
  barcodeInput: TextStyle;
  submitButton: ViewStyle;
  submitButtonText: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  resultsContainer: ViewStyle;
  resultsTitle: TextStyle;
  resultItem: ViewStyle;
  resultName: TextStyle;
  resultBrand: TextStyle;
  resultCalories: TextStyle;
  manualEntryButton: ViewStyle;
  manualEntryButtonText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingTop: 16, // 2 Grid-Punkte (16px)
  },
  content: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  tabButton: {
    flex: 1,
    padding: 12, // 1.5 Grid-Punkte (12px)
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24, // 3 Grid-Punkte (24px)
  },
  barcodeInput: {
    flex: 1,
    height: 48, // 6 Grid-Punkte (48px)
    borderWidth: 1,
    borderRadius: 8, // 1 Grid-Punkt (8px)
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    fontSize: 16,
    marginRight: 8, // 1 Grid-Punkt (8px)
  },
  submitButton: {
    height: 48, // 6 Grid-Punkte (48px)
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24, // 3 Grid-Punkte (24px)
  },
  loadingText: {
    marginTop: 8, // 1 Grid-Punkt (8px)
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 24, // 3 Grid-Punkte (24px)
    padding: 16, // 2 Grid-Punkte (16px)
    borderRadius: 8, // 1 Grid-Punkt (8px)
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16, // 2 Grid-Punkte (16px)
  },
  resultsTitle: {
    fontSize: 18,
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  resultItem: {
    padding: 16, // 2 Grid-Punkte (16px)
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  resultName: {
    fontSize: 16,
    marginBottom: 4, // 0.5 Grid-Punkt (4px)
  },
  resultBrand: {
    fontSize: 14,
    marginBottom: 4, // 0.5 Grid-Punkt (4px)
  },
  resultCalories: {
    fontSize: 14,
  },
  manualEntryButton: {
    borderWidth: 1,
    padding: 16, // 2 Grid-Punkte (16px)
    alignItems: 'center',
    marginTop: 24, // 3 Grid-Punkte (24px)
  },
  manualEntryButtonText: {
    fontSize: 16,
  },
});
