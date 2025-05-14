import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
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
import { AddTabScreenProps } from "../types/navigation-types";
import { FoodItem } from "../types";
import { getFoodDataByBarcode, searchFoodByName } from "../services/barcode-service";
import { useTheme } from "../theme/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraView, CameraType, FlashMode } from "expo-camera";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function BarcodeScannerScreen({ navigation, route }: AddTabScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mealType } = route.params || {};

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

  // Scanner-Steuerung
  const isScanningRef = useRef(false); // Ref statt State für sofortige Wirkung ohne Re-Rendering

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);
  
  // Automatisches Reset des Scanners, wenn der Screen wieder fokussiert wird
  useFocusEffect(
    React.useCallback(() => {
      console.log('Scanner-Screen erhält Fokus - Scanner wird zurückgesetzt');
      // Scanner zurücksetzen, wenn der Screen wieder fokussiert wird
      setScanned(false);
      isScanningRef.current = false;
      
      return () => {
        // Optional: Clean-up beim Verlassen des Screens
      };
    }, [])
  );

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // KRITISCH: Sofortiger und definitiver Ausstieg, wenn bereits gescannt
    if (isScanningRef.current) {
      console.log('\u274c Scan bereits in Bearbeitung - ignoriere');
      return;
    }

    // SOFORT Scanner blockieren - vor allem anderen!
    isScanningRef.current = true;
    setScanned(true); // Deaktiviert den Scanner in der UI

    console.log(`\u2705 Barcode erkannt: ${type} \u2013 ${data}`);
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
            ? { barcode: data, mealType } 
            : { barcode: data, mealType, manualEntry: true };
            
          parent.navigate("FoodDetail", params);
          console.log("Navigation erfolgt über Parent-Navigator");
          return;
        }

        // Fallback: Direkte Navigation
        const params = productData 
          ? { barcode: data, mealType } 
          : { barcode: data, mealType, manualEntry: true };
          
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
          parent.navigate("FoodDetail", { barcode: data, mealType, manualEntry: true });
        } else {
          // @ts-ignore
          navigation.navigate("FoodDetail", { barcode: data, mealType, manualEntry: true });
        }
      } catch (e) {
        console.error("Navigation error:", e);
        setScanned(false);
        isScanningRef.current = false;
      }
    }
  };

  const handleSubmitBarcode = async () => {
    if (!barcodeInput.trim()) {
      setError("Bitte geben Sie einen Barcode ein");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const foodData = await getFoodDataByBarcode(barcodeInput.trim());
      if (foodData) {
        try {
          navigation.getParent()?.navigate("FoodDetail", {
            barcode: barcodeInput.trim(),
            mealType,
          });
        } catch (e) {
          console.error("Navigation error:", e);
          Alert.alert("Fehler", "Es gab ein Problem bei der Navigation.");
        }
      }
    } catch (e) {
      console.error(e);
      setError("Fehler beim Abrufen der Produktdaten. Bitte erneut versuchen.");
    } finally {
      setIsLoading(false);
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
      navigation.getParent()?.navigate("FoodDetail", {
        foodId: item.id,
        mealType,
      });
    } catch (e) {
      console.error("Navigation error:", e);
      Alert.alert("Fehler", "Es gab ein Problem bei der Navigation.");
    }
  };

  const handleScanAgain = () => {
    // Vollständiges Zurücksetzen aller Scan-Flags
    setScanned(false);
    isScanningRef.current = false;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Text style={[styles.instructionText, { color: theme.colors.textLight }]}>
          Barcode scannen oder Produktname suchen
        </Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["barcode", "name"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && [styles.activeTab, { borderColor: theme.colors.primary }],
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === tab
                  ? { color: theme.colors.primary, fontWeight: "bold" }
                  : { color: theme.colors.text }
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
                  autofocus="on"
                  onCameraReady={() => console.log("📸 Camera ready")}
                  onMountError={(err) => console.error("❌ Camera error:", err)}
                  onBarcodeScanned={scanned || isScanningRef.current ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "aztec",
                      "codabar",
                      "code128",
                      "code39",
                      "code93",
                      "datamatrix",
                      "ean13",
                      "ean8",
                      "itf14",
                      "pdf417",
                      "qr",
                      "upc_e"
                    ],
                  }}
                  videoStabilizationMode="off"
                />
                <View style={[styles.overlay, { borderColor: theme.colors.primary }]} />

                {/* Taschenlampen-Button */}
                <TouchableOpacity
                  style={[styles.torchButton, { backgroundColor: isTorchOn ? theme.colors.primary : 'rgba(0,0,0,0.5)' }]}
                  onPress={() => setIsTorchOn(prev => !prev)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    {isTorchOn ? '🔦' : '🔦'}
                  </Text>
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
            />
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSearchByName}
              disabled={isLoading}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Suchen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loader */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text }}>Bitte warten…</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        )}

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <FlatList
            style={styles.resultsContainer}
            data={searchResults}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { backgroundColor: theme.colors.card }]}
                onPress={() => handleSelectProduct(item)}
              >
                <Text style={{ fontWeight: "bold", color: theme.colors.text }}>{item.name}</Text>
                {item.brand && <Text style={{ color: theme.colors.textLight }}>{item.brand}</Text>}
                <Text style={{ color: theme.colors.textLight }}>
                  {Math.round(item.nutrition.calories)} kcal/100g
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Manueller Eintrag */}
        <TouchableOpacity
          style={[styles.manualEntryButton, { borderColor: theme.colors.border }]}
          onPress={() => {
            try {
              navigation.getParent()?.navigate("FoodDetail", { mealType });
            } catch (e) {
              console.error("Navigation error:", e);
              Alert.alert("Fehler", "Es gab ein Problem bei der Navigation.");
            }
          }}
        >
          <Text style={{ color: theme.colors.text }}>Manuell eingeben</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  content: { flex: 1 },
  instructionText: { fontSize: 16, textAlign: "center", marginVertical: 12 },
  tabContainer: { flexDirection: "row", marginBottom: 12 },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {},
  tabButtonText: { fontSize: 16 },
  scannerContainer: { alignItems: "center", marginBottom: 24 },
  previewWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: 300,
    overflow: "hidden",
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: "absolute",
    top: "15%",
    left: "5%",
    width: "90%",
    height: "70%",
    borderWidth: 2,
  },
  debugInfo: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
  },
  debugText: { color: "white", fontSize: 12, textAlign: "center" },
  torchButton: {
    position: "absolute",
    bottom: 12,
    left: "50%",
    transform: [{ translateX: -30 }],
    padding: 8,
    borderRadius: 20,
    width: 60,
    alignItems: "center",
    zIndex: 999,
  },
  rescanButton: {
    marginTop: 16,
    padding: 10,
    borderRadius: 6,
  },
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  barcodeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  submitButton: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  loadingContainer: { alignItems: "center", marginVertical: 24 },
  errorContainer: { marginVertical: 16, padding: 12, borderRadius: 8 },
  resultsContainer: { flex: 1 },
  resultItem: { padding: 16, marginBottom: 8, borderRadius: 8 },
  manualEntryButton: {
    marginTop: 24,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
  },
});
