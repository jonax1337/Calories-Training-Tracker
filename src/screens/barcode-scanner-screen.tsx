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
  Animated,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { BarcodeScreenProps } from "../types/navigation-types";
import { FoodItem } from "../types";
import { getFoodDataByBarcode, searchFoodByName } from "../services/barcode-service";
import { useTheme } from "../theme/theme-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import { Search, Zap, ZapOff, CheckCircle2, X, OctagonAlert, OctagonX, Flashlight, FlashlightOff } from "lucide-react-native";
import { createBarcodeScannerStyles } from "../styles/screens/barcode-scanner-styles";
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

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
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  
  // Scanning region configuration (coordinates as percentages of camera view)
  const scanningRegion = {
    x: 0.05, // 5% from left
    y: 0.10, // 10% from top  
    width: 0.90, // 90% of total width
    height: 0.70, // 70% of total height
  };
  
  // Torch state tracking - separater State für UI sync
  const [torchButtonPressed, setTorchButtonPressed] = useState(false);

  // Scanner-Steuerung und Animationen
  const isScanningRef = useRef(false);
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const scanOverlay = useRef(new Animated.Value(1)).current;
  
  // Intelligenter Auto-Focus
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFocusTime = useRef(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Kontinuierlicher Auto-Focus - sehr frequent für beste Erkennungsrate
  const triggerContinuousFocus = () => {
    if (isScanningRef.current) return; // Skip wenn gerade gescannt wird
    
    setAutofocus('off');
    setTimeout(() => {
      if (!isScanningRef.current) {
        setAutofocus('on');
      }
    }, 50); // Sehr kurze Pause für smooth refocus
  };

  // Scan-Line Animation
  const startScanLineAnimation = () => {
    scanLinePosition.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLinePosition, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // Success Animation
  const showSuccessAnimation = () => {
    setScanSuccess(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale animation für Erfolgs-Icon
    Animated.spring(successScale, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Overlay fade-out
    Animated.timing(scanOverlay, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Error Animation
  const showErrorAnimation = () => {
    setScanError(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Scale animation für Error-Icon
    Animated.spring(successScale, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Overlay fade-out
    Animated.timing(scanOverlay, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-reset nach 2 Sekunden für erneutes Scannen
    setTimeout(() => {
      setScanned(false);
      setScanError(false);
      isScanningRef.current = false;
      successScale.setValue(0);
      scanOverlay.setValue(1);
      startScanLineAnimation();
    }, 2000);
  };

  useEffect(() => {
    if (activeTab === 'barcode' && hasPermission && !scanned) {
      startScanLineAnimation();
      
      // Kontinuierlicher Auto-Focus alle 200ms für optimale Schärfe
      focusIntervalRef.current = setInterval(() => {
        triggerContinuousFocus();
      }, 200); // Alle 200ms auto-focus triggern
    }
    
    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, [activeTab, hasPermission, scanned]);

  // Torch State Synchronization - hält UI und Kamera-State in sync
  useEffect(() => {
    // Sync Button state mit Torch state
    setTorchButtonPressed(isTorchOn);
  }, [isTorchOn]);
  
  // Automatisches Reset des Scanners, wenn der Screen wieder fokussiert wird
  useFocusEffect(
    React.useCallback(() => {
      // Scanner zurücksetzen, wenn der Screen wieder fokussiert wird
      setScanned(false);
      setScanSuccess(false);
      setScanError(false);
      isScanningRef.current = false;
      
      // Animation States zurücksetzen
      successScale.setValue(0);
      scanOverlay.setValue(1);
      
      // Torch komplett zurücksetzen für sync
      setIsTorchOn(false);
      setTorchButtonPressed(false);
      return () => {
        // Clean-up beim Verlassen des Screens
        if (focusIntervalRef.current) {
          clearTimeout(focusIntervalRef.current);
        }
      };
    }, [])
  );

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // KRITISCH: Sofortiger und definitiver Ausstieg, wenn bereits gescannt
    if (isScanningRef.current) {
      return;
    }

    // SOFORT Scanner blockieren
    isScanningRef.current = true;
    setScanned(true);

    setLastScannedData(data);
    setLastScannedType(type);

    try {
      const productData = await getFoodDataByBarcode(data);
      
      // Nur bei ECHTEN Produktdaten navigieren
      if (productData && productData.id && productData.name) {
        // Success Animation bei erfolgreichem API-Call MIT Daten
        showSuccessAnimation();
        
        // Kurze Verzögerung für UX bevor Navigation
        await new Promise(resolve => setTimeout(resolve, 600));

        // Navigation zum FoodDetail-Screen mit Produktdaten
        try {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate("FoodDetail", { barcode: data, mealType, selectedDate, foodItem: productData });
            console.log("Navigation erfolgt über Parent-Navigator mit Produktdaten");
            return;
          }

          // @ts-ignore - Fallback Navigation
          navigation.navigate("FoodDetail", { barcode: data, mealType, selectedDate, foodItem: productData });
          console.log("Direkte Navigation mit Produktdaten");
        } catch (e) {
          console.error("Navigation error:", e);
          showErrorAnimation();
        }
      } else {
        // Kein Produkt gefunden - Error anzeigen
        console.log("Kein Produkt für Barcode gefunden:", data);
        showErrorAnimation();
      }
    } catch (error) {
      // Alle API-Fehler (404, 504, etc.) - Error anzeigen, NICHT navigieren
      console.error("API-Fehler beim Barcode-Scan:", error);
      showErrorAnimation();
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
        keyboardVerticalOffset={Platform.OS === "ios" ? theme.spacing.xl : 0}
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
                  onCameraReady={() => setTimeout(() => setIsTorchOn(false), 100)}
                  onMountError={(err) => console.error("Camera error:", err)}
                  onBarcodeScanned={scanned || isScanningRef.current ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "ean13",
                      "ean8",
                      "code128",
                      "upc_e",
                      "upc_a"
                    ],
                  }}
                  videoStabilizationMode="auto"
                />
                
                {/* Einfache Blur overlays - subtil und sauber */}
                <BlurView 
                  style={styles.blurOverlayTop} 
                  intensity={20} 
                  tint="dark"
                />
                <BlurView 
                  style={styles.blurOverlayBottom} 
                  intensity={20} 
                  tint="dark"
                />
                <BlurView 
                  style={styles.blurOverlayLeft} 
                  intensity={20} 
                  tint="dark"
                />
                <BlurView 
                  style={styles.blurOverlayRight} 
                  intensity={20} 
                  tint="dark"
                />
                
                {/* Animiertes Overlay mit Scan-Line */}
                <Animated.View 
                  style={[
                    styles.scanOverlay, 
                    { 
                      opacity: scanOverlay,
                      borderColor: theme.colors.primary 
                    }
                  ]}
                >
                  {/* Scan-Line Animation */}
                  {!scanned && (
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          backgroundColor: theme.colors.primary,
                          top: scanLinePosition.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['10%', '90%']
                          })
                        }
                      ]}
                    />
                  )}
                  
                  {/* Ecken-Marker */}
                  <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
                </Animated.View>

                {/* Success Animation */}
                {scanSuccess && (
                  <Animated.View 
                    style={[
                      styles.successOverlay,
                      {
                        transform: [{ scale: successScale }],
                        backgroundColor: theme.colors.primary + '80'
                      }
                    ]}
                  >
                    <CheckCircle2 
                      size={theme.typography.fontSize.xxxl * 1.25} 
                      color="white" 
                    />
                    <Text style={[styles.successText, { color: 'white' }]}>
                      Produkt gefunden!
                    </Text>
                  </Animated.View>
                )}

                {/* Error Animation */}
                {scanError && (
                  <Animated.View 
                    style={[
                      styles.errorOverlay,
                      {
                        transform: [{ scale: successScale }],
                        backgroundColor: theme.colors.error + '80'
                      }
                    ]}
                  >
                    <OctagonX
                      size={theme.typography.fontSize.xxxl * 1.25} 
                      color="white" 
                    />
                    <Text style={[styles.successText, { color: 'white' }]}>
                      Produkt nicht gefunden
                    </Text>
                  </Animated.View>
                )}

                {/* Taschenlampen-Button */}
                <TouchableOpacity
                  style={[styles.torchButton, { backgroundColor: torchButtonPressed ? theme.colors.primary : theme.colors.card }]}
                  onPress={() => {
                    const newTorchState = !isTorchOn;
                    setIsTorchOn(newTorchState);
                    setTorchButtonPressed(newTorchState);
                    
                    // Haptic feedback
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  {torchButtonPressed ? (
                    <Flashlight size={theme.typography.fontSize.xxl} color="white" />
                  ) : (
                    <FlashlightOff size={theme.typography.fontSize.xxl} color="white" />
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
          <View style={styles.searchResultsContainer}>
          <FlatList
            style={styles.resultsList}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="never"
            keyboardDismissMode="on-drag"
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
                  {Math.round(item.nutrition?.calories || 0)} kcal/100{item.nutrition?.servingSize?.toLowerCase().includes('ml') || item.nutrition?.servingSize?.toLowerCase().includes('l') ? 'ml' : 'g'}
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