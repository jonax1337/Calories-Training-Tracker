import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  FlatList,
  Dimensions,
} from "react-native";
import { AddTabScreenProps } from "../types/navigation-types";
import { FoodItem } from "../types";
import { getFoodDataByBarcode, searchFoodByName } from "../services/barcode-service";
import { useTheme } from "../theme/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraView} from "expo-camera";

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

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    navigation.getParent()?.navigate("FoodDetail", {
      barcode: data,
      mealType,
    });
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
        navigation.getParent()?.navigate("FoodDetail", {
          barcode: barcodeInput.trim(),
          mealType,
        });
      } else {
        setError(`Kein Produkt für Barcode gefunden: ${barcodeInput.trim()}`);
      }
    } catch (e) {
      setError("Fehler beim Abrufen der Produktdaten. Bitte versuchen Sie es erneut.");
      console.error(e);
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
      if (results.length) {
        setSearchResults(results);
      } else {
        setError(`Keine Produkte mit dem Namen '${nameInput.trim()}' gefunden`);
      }
    } catch (e) {
      setError("Fehler bei der Suche. Bitte versuchen Sie es erneut.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (foodItem: FoodItem) => {
    navigation.getParent()?.navigate("FoodDetail", {
      foodId: foodItem.id,
      mealType,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <Text
          style={[
            styles.instructionText,
            { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight },
          ]}
        >
          Bitte gib den Barcode ein oder suche nach einem Produktnamen
        </Text>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "barcode" && [styles.activeTab, { borderColor: theme.colors.primary }],
            ]}
            onPress={() => setActiveTab("barcode")}
          >
            <Text
              style={[
                styles.tabButtonText,
                { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
                activeTab === "barcode" && {
                  color: theme.colors.primary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "name" && [styles.activeTab, { borderColor: theme.colors.primary }],
            ]}
            onPress={() => setActiveTab("name")}
          >
            <Text
              style={[
                styles.tabButtonText,
                { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
                activeTab === "name" && {
                  color: theme.colors.primary,
                  fontFamily: theme.typography.fontFamily.bold,
                },
              ]}
            >
              Produktname
            </Text>
          </TouchableOpacity>
        </View>

        {/* CameraView Barcode Scanner */}
        {activeTab === "barcode" && (
          <View style={styles.scannerContainer}>
            {hasPermission === null && <Text>Frage Kamera-Berechtigung an...</Text>}
            {hasPermission === false && <Text>Kein Kamera-Zugriff</Text>}
            {hasPermission && (
              <View
                style={[
                  styles.previewWrapper,
                  { borderRadius: theme.borderRadius.large },
                ]}
              >
                <CameraView
                  style={styles.preview}
                  facing="back"
                  enableTorch={true}
                  autofocus="on"
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "aztec", "ean13", "ean8", "qr", "pdf417",
                      "upc_e", "datamatrix", "code39", "code93",
                      "itf14", "codabar", "code128", "upc_a",
                    ],
                  }}
                />
                <View
                  style={[
                    styles.overlay,
                    {
                      borderColor: theme.colors.primary,
                      borderRadius: theme.borderRadius.large,
                    },
                  ]}
                />
              </View>
            )}
            {scanned && (
              <TouchableOpacity onPress={() => setScanned(false)} style={styles.rescanButton}>
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontFamily: theme.typography.fontFamily.bold,
                  }}
                >
                  Erneut scannen
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Name-Suche */}
        {activeTab === "name" && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.barcodeInput,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Produktname eingeben"
              placeholderTextColor={theme.colors.textLight}
              value={nameInput}
              onChangeText={setNameInput}
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.medium },
              ]}
              onPress={handleSearchByName}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  { fontFamily: theme.typography.fontFamily.bold, color: "#fff" },
                ]}
              >
                Suchen
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.text },
              ]}
            >
              Produkt wird gesucht...
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.error },
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text
              style={[
                styles.resultsTitle,
                { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
              ]}
            >
              Suchergebnisse:
            </Text>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.resultItem,
                    { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.small },
                  ]}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Text
                    style={[
                      styles.resultName,
                      { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.brand && (
                    <Text
                      style={[
                        styles.resultBrand,
                        { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight },
                      ]}
                    >
                      {item.brand}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.resultCalories,
                      { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textLight },
                    ]}
                  >
                    {Math.round(item.nutrition.calories)} kcal/100g
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Manueller Eintrag */}
        <TouchableOpacity
          style={[
            styles.manualEntryButton,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium,
              marginTop: 16,
            },
          ]}
          onPress={() => navigation.getParent()?.navigate("FoodDetail", { mealType })}
        >
          <Text
            style={[
              styles.manualEntryButtonText,
              { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text },
            ]}
          >
            Manuell eingeben
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },  
  content: { flex: 1 },  
  instructionText: { fontSize: 16, textAlign: "center", marginBottom: 16 },  
  tabContainer: { flexDirection: "row", marginBottom: 16 },  
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomWidth: 2 },  
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
  rescanButton: { marginTop: 8 },  
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 24 },  
  barcodeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  submitButton: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: { fontSize: 16 },  
  loadingContainer: { alignItems: "center", marginTop: 24 },  
  loadingText: { marginTop: 8, fontSize: 16 },  
  errorContainer: { marginTop: 24, padding: 16, borderRadius: 8 },  
  errorText: { fontSize: 16, textAlign: "center" },  
  resultsContainer: { flex: 1, marginTop: 16 },  
  resultsTitle: { fontSize: 18, marginBottom: 8 },  
  resultItem: { padding: 16, marginBottom: 8 },  
  resultName: { fontSize: 16, marginBottom: 4 },  
  resultBrand: { fontSize: 14, marginBottom: 4 },  
  resultCalories: { fontSize: 14 },  
  manualEntryButton: { borderWidth: 1, padding: 16, alignItems: "center", marginTop: 24 },  
  manualEntryButtonText: { fontSize: 16 },
});
