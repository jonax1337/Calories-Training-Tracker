import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, ViewStyle, TextStyle } from 'react-native';
import { AddTabScreenProps } from '../types/navigation-types';
import { getFoodDataByBarcode } from '../services/barcode-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ManualBarcodeScreen({ navigation, route }: AddTabScreenProps) {
  // Get theme and safe area insets
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Get mealType parameter if passed
  const { mealType } = route.params || {};
  
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitBarcode = async () => {
    if (!barcodeInput || barcodeInput.trim().length === 0) {
      setError('Bitte geben Sie einen Barcode ein');
      return;
    }

    setIsLoading(true);
    setError(null);
    
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={[styles.instructionText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
          Bitte gib den Barcode manuell ein oder suche nach einem Produkt
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.barcodeInput, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border,
              fontFamily: theme.typography.fontFamily.regular,
              color: theme.colors.text
            }]}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            placeholder="Barcode eingeben (z.B. 4000417025005)"
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleSubmitBarcode}
            placeholderTextColor={theme.colors.textLight}
          />
          
          <TouchableOpacity 
            style={[styles.submitButton, { 
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.medium
            }]}
            onPress={handleSubmitBarcode}
            disabled={isLoading}
          >
            <Text style={[styles.submitButtonText, { fontFamily: theme.typography.fontFamily.bold }]}>
              Produkt suchen
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && (
          <View style={[styles.statusContainer, { 
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.medium
          }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.statusText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
              Produktinformationen werden abgerufen...
            </Text>
          </View>
        )}
        
        {error && (
          <View style={[styles.statusContainer, { 
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.medium
          }]}>
            <Text style={[styles.errorText, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.submitButton, { 
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.medium,
                marginTop: 16
              }]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.submitButtonText, { fontFamily: theme.typography.fontFamily.bold }]}>
                Zurück
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.manualEntryButton, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]} 
          onPress={() => navigation.getParent()?.navigate('FoodDetail', { mealType: mealType })}
        >
          <Text style={[styles.manualEntryButtonText, { 
            fontFamily: theme.typography.fontFamily.medium, 
            color: theme.colors.text 
          }]}>
            Manuell eingeben
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

// Helper functions for meal type emoji and labels
function getMealTypeEmoji(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return '🥞';
    case 'lunch': return '🍲';
    case 'dinner': return '🍽️';
    case 'snack': return '🍪';
    default: return '🍽️';
  }
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

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  instructionText: TextStyle;
  inputContainer: ViewStyle;
  barcodeInput: TextStyle;
  submitButton: ViewStyle;
  submitButtonText: TextStyle;
  statusContainer: ViewStyle;
  statusText: TextStyle;
  errorText: TextStyle;
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
    padding: 16, // 2 Grid-Punkte (16px)
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 24, // 3 Grid-Punkte (24px)
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24, // 3 Grid-Punkte (24px)
  },
  barcodeInput: {
    borderWidth: 1,
    borderRadius: 8, // 1 Grid-Punkt (8px)
    padding: 16, // 2 Grid-Punkte (16px)
    fontSize: 16,
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  submitButton: {
    padding: 16, // 2 Grid-Punkte (16px)
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16, // 2 Grid-Punkte (16px)
    padding: 16, // 2 Grid-Punkte (16px)
  },
  statusText: {
    fontSize: 16,
    marginTop: 8, // 1 Grid-Punkt (8px)
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 8, // 1 Grid-Punkt (8px)
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
