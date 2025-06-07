import React, { useState, useEffect, useRef } from 'react';
import { useDateContext } from '../context/date-context';
import { 
  Text, 
  View, 
  TextInput, 
  ActivityIndicator, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  FlatList, 
  Dimensions, 
  Alert, 
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { BarcodeScreenProps } from "../types/navigation-types";
import { FoodItem } from "../types";
import { getFoodDataByBarcode, searchFoodByName } from "../services/barcode-service";
import { useTheme } from "../theme/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import { Search, Zap, ZapOff } from "lucide-react-native";
import { createBarcodeScannerStyles } from "../styles/screens/barcode-scanner-styles";

// Dimensions werden jetzt in der Style-Datei importiert

export default function BarcodeScannerScreen({ navigation, route }: BarcodeScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createBarcodeScannerStyles(theme);
  const { mealType } = route.params || {};
  
  // Verwende den DateContext, um das ausgewählte Datum zu bekommen
  const { selectedDate } = useDateContext();

  // States für manuelle Suche
  const [barcodeInput, setBarcodeInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [activeTab, setActiveTab] = useState<"barcode" | "name">("barcode");

  // States für Kamera-Scanner
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [lastScannedType, setLastScannedType] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [autofocus, setAutofocus] = useState<'on' | 'off'>('on');

  // Scanner-Steuerung
  const isScanningRef = useRef(false); // Ref statt State für sofortige Wirkung ohne Re-Rendering

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Hilfsfunktion: schalte kurz aus…
  const triggerFocus = () => {
    setAutofocus('off');
    setTimeout(() => setAutofocus('on'), 150); // nach 100 ms neu fokussieren
  };

  useEffect(() => {
    const interval = setInterval(triggerFocus, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // Automatisches Reset des Scanners, wenn der Screen wieder fokussiert wird
  useFocusEffect(
    React.useCallback(() => {
      // Scanner zurücksetzen, wenn der Screen wieder fokussiert wird
      setScanned(false);
      isScanningRef.current = false;
      setTimeout(() => setIsTorchOn(false), 500);
      return () => {
        // Optional: Clean-up beim Verlassen des Screens
      };
    }, [])
  );

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // KRITISCH: Sofortiger und definitiver Ausstieg, wenn bereits gescannt
    if (isScanningRef.current) {
      return;
    }

    // SOFORT Scanner blockieren - vor allem anderen!
    isScanningRef.current = true;
    setScanned(true); // Deaktiviert den Scanner in der UI

    setLastScannedData(data);
    setLastScannedType(type);

    // Vorprüfung, ob Produkt existiert
    setIsLoading(true);
    try {
      const productData = await getFoodDataByBarcode(data);
      setIsLoading(false);

      // Direkt zum FoodDetail-Screen navigieren, unabhängig davon, ob Produkt gefunden wurde
      try {
        // Vereinfachte Navigation: Versuche zuerst Parent-Navigator
        const parent = navigation.getParent();

        if (parent) {
          // Wenn Produkt nicht gefunden, mit manualEntry-Flag navigieren
          const params = productData 
            ? { barcode: data, mealType, selectedDate } 
            : { barcode: data, mealType, selectedDate, manualEntry: true };
            
          parent.navigate("FoodDetail", params);
          console.log("Navigation erfolgt über Parent-Navigator");
          return;
        }

        // Fallback: Direkte Navigation
        const params = productData 
          ? { barcode: data, mealType, selectedDate } 
          : { barcode: data, mealType, selectedDate, manualEntry: true };
          
        // @ts-ignore - Ignoriere TypeScript-Fehler, da wir wissen, dass dieser Screen existiert
        navigation.navigate("FoodDetail", params);
        console.log("Navigation erfolgt direkt");
      } catch (e) {
        // Im Fehlerfall
        console.error("Navigation error:", e);
        setScanned(false);
        isScanningRef.current = false;
      }
    } catch (error) {
      // API-Fehler
      console.error("Error checking product:", error);
      setIsLoading(false);
      
      // Trotz Fehler zum Detail-Screen navigieren (manuelle Eingabe)
      try {
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate("FoodDetail", { barcode: data, mealType, selectedDate, manualEntry: true });
        } else {
          // @ts-ignore
          navigation.navigate("FoodDetail", { barcode: data, mealType, selectedDate, manualEntry: true });
        }
      } catch (e) {
        console.error("Navigation error:", e);
        setScanned(false);
        isScanningRef.current = false;
      }
    }
  };

  const handleSearchByName = async () => {
    if (!nameInput.trim()) {
      setError("Bitte geben Sie einen Produktnamen ein");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const results = await searchFoodByName(nameInput.trim());
      if (results.length) setSearchResults(results);
      else setError(`Keine Produkte zu '${nameInput.trim()}' gefunden`);
    } catch (e) {
      console.error(e);
      setError("Fehler bei der Suche. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (item: FoodItem) => {
    try {
      // Erste Variante: Über Parent-Navigator - mit vollständigem FoodItem-Objekt
      const parent = navigation.getParent();

      if (parent) {
        parent.navigate("FoodDetail", { 
          foodId: item.id, 
          mealType,
          foodItem: item, // Übergebe das vollständige FoodItem-Objekt
          selectedDate: selectedDate // Übergebe das ausgewählte Datum aus dem DateContext
        });
        console.log("Navigation zum FoodDetail mit vollständigem FoodItem:", item.name);
        return;
      }
      
      // Zweite Variante: Direkte Navigation
      // @ts-ignore - Ignoriere TypeScript-Fehler, da wir wissen, dass dieser Screen existiert
      navigation.navigate("FoodDetail", { 
        foodId: item.id, 
        mealType,
        foodItem: item, // Übergebe das vollständige FoodItem-Objekt
        selectedDate: selectedDate // Übergebe das ausgewählte Datum aus dem DateContext
      });
      console.log("Direkte Navigation zum FoodDetail mit vollständigem FoodItem:", item.name);
    } catch (e) {
      console.error("Navigation error:", e);
      Alert.alert("Fehler", "Es gab ein Problem bei der Navigation.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: theme.spacing.m }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["barcode", "name"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === tab
                  ? { 
                      color: theme.colors.primary, 
                      fontFamily: theme.typography.fontFamily.bold 
                    }
                  : { 
                      color: theme.colors.text, 
                      fontFamily: theme.typography.fontFamily.bold 
                    }
              ]}>
                {tab === "barcode" ? "Barcode" : "Produktname"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Barcode-Scanner */}
        {activeTab === "barcode" && (
          <View style={styles.scannerContainer}>
            {hasPermission === null && <Text>Kamera-Berechtigung anfragen…</Text>}
            {hasPermission === false && <Text>Kein Kamera-Zugriff</Text>}
            {hasPermission && (
              <View style={[styles.previewWrapper, { borderRadius: theme.borderRadius.large }]}>
                <CameraView
                  style={styles.preview}
                  facing="back"
                  enableTorch={isTorchOn}
                  autofocus={autofocus}
                  onCameraReady={() => setTimeout(() => setIsTorchOn(false), 500)}
                  onMountError={(err) => console.error("Camera error:", err)}
                  onBarcodeScanned={scanned || isScanningRef.current ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "codabar",
                      "code128",
                      "code39",
                      "code93",
                      "ean13",
                      "ean8",
                      "itf14",
                      "upc_e"
                    ],
                  }}
                  videoStabilizationMode="auto"
                />
                <View style={{ borderColor: theme.colors.primary }} />

                {/* Taschenlampen-Button */}
                <TouchableOpacity
                  style={[styles.torchButton, { backgroundColor: isTorchOn ? theme.colors.primary : 'rgba(0,0,0,0.5)' }]}
                  onPress={() => setIsTorchOn(prev => !prev)}
                >
                  {isTorchOn ? (
                    <Zap size={24} color="white" />
                  ) : (
                    <ZapOff size={24} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Namenssuche */}
        {activeTab === "name" && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.barcodeInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
              placeholder="Produktnamen eingeben"
              placeholderTextColor={theme.colors.textLight}
              value={nameInput}
              onChangeText={setNameInput}
              enterKeyHint="search"
              onSubmitEditing={handleSearchByName}
            />
          </View>
        )}

        {/* Loader - nur anzeigen, wenn aktiv nach Namen gesucht wird */}
        {activeTab === "name" && isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Error - nur anzeigen, wenn im Namen-Tab */}
        {activeTab === "name" && error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        )}

        {/* Suchergebnisse - nur anzeigen, wenn im Namen-Tab */}
        {activeTab === "name" && searchResults.length > 0 && (
          <View style={{ height: 500 }}>
          <FlatList
            style={{ flexGrow: 1 }}              // verhindert, dass der List-Container unbegrenzt wächst
            scrollEnabled={true}              // eigentlich Standard, aber zur Sicherheit
            nestedScrollEnabled={true}        // wichtig, wenn du in einem ScrollView bist (Android)
            showsVerticalScrollIndicator={true}
            data={searchResults}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { backgroundColor: theme.colors.card }]}
                onPress={() => handleSelectProduct(item)}
              >
                <Text style={{ fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }}>{item.name}</Text>
                {item.brand && <Text style={{ color: theme.colors.textLight, fontFamily: theme.typography.fontFamily.regular }}>{item.brand}</Text>}
                <Text style={{ color: theme.colors.textLight, fontFamily: theme.typography.fontFamily.regular }}>
                  {Math.round(item.nutrition.calories)} kcal/100{item.nutrition.servingSize?.toLowerCase().includes('ml') || item.nutrition.servingSize?.toLowerCase().includes('l') ? 'ml' : 'g'}
                </Text>
              </TouchableOpacity>
            )}
          />
          </View>
        )}

        {/* Manueller Eintrag */}
        <TouchableOpacity
          style={[styles.manualEntryButton, { borderColor: theme.colors.border }]}
          onPress={() => {
            const navigationParams = { 
              mealType,
              selectedDate // Übergebe auch das ausgewählte Datum an den manuellen Eingabe-Screen
            };
            
            try {
              // Erste Variante: Über Parent-Navigator
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate("ManualFoodEntry", navigationParams);
                return;
              }           
              // Zweite Variante: Direkte Navigation als Fallback
              // @ts-ignore - Ignoriere TypeScript-Fehler
              navigation.navigate("ManualFoodEntry", navigationParams);
            } catch (e) {
              console.error("Navigation error:", e);
              Alert.alert("Fehler", "Es gab ein Problem bei der Navigation. Details: " + e);
            }
          }}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }}>Manuell eingeben</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

// Styles wurden in eine separate Datei ausgelagert und werden oben importiert