import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../theme/theme-context';
import { createSliderWithInputStyles } from '../../styles/components/ui/slider-with-input-styles';

// TypeScript Interface für die Props
interface SliderWithInputProps {
  // Wertbereich
  minValue: number;
  maxValue: number;
  middleValue?: number; // Für die mittlere Label-Anzeige (optional)
  
  // Schrittgröße und Dezimalstellen
  step: number;
  decimalPlaces?: number;
  allowDecimals?: boolean;
  
  // Aktueller Wert und Callback
  value: number;
  onValueChange: (value: number) => void;
  
  // Beschriftungen
  label?: string;
  unit?: string;
  placeholder?: string;
  
  // Styles und Farben
  containerStyle?: object;
  inputStyle?: object;
  sliderStyle?: object;
}

/**
 * Eine wiederverwendbare Komponente mit Slider und Texteingabe für numerische Werte.
 * @param minValue - Minimalwert des Sliders
 * @param maxValue - Maximalwert des Sliders
 * @param middleValue - Optionaler Wert für die mittlere Beschriftung unter dem Slider
 * @param step - Schrittgröße des Sliders
 * @param decimalPlaces - Anzahl der anzuzeigenden Dezimalstellen (Default: 2)
 * @param allowDecimals - Ob Dezimalzahlen erlaubt sind (Default: true)
 * @param value - Aktueller Wert
 * @param onValueChange - Callback bei Wertänderung
 * @param label - Beschriftung über dem Slider
 * @param unit - Einheit (z.B. "kg", "cm")
 * @param placeholder - Platzhaltertext für die Texteingabe
 * @param containerStyle - Zusätzliche Styles für den Container
 * @param inputStyle - Zusätzliche Styles für das Eingabefeld
 * @param sliderStyle - Zusätzliche Styles für den Slider
 */
function SliderWithInput({
  minValue,
  maxValue,
  middleValue,
  step,
  decimalPlaces = 2,
  allowDecimals = true,
  value,
  onValueChange,
  label,
  unit,
  placeholder = '',
  containerStyle,
  inputStyle,
  sliderStyle
}: SliderWithInputProps) {
  // Theme aus dem Kontext holen
  const { theme } = useTheme();
  const styles = createSliderWithInputStyles(theme);
  
  // Lokaler State für das Eingabefeld
  const [inputText, setInputText] = useState<string>(formatValue(value));
  
  // Wenn sich der externe Wert ändert, aktualisiere den lokalen Text, aber nur wenn
  // der Benutzer nicht gerade dabei ist zu tippen
  useEffect(() => {
    // Wenn das Eingabefeld nicht leer ist, update es nur wenn der Wert signifikant anders ist
    if (inputText !== '' && Math.abs(parseFloat(inputText) - value) > 0.001) {
      setInputText(formatValue(value));
    } else if (inputText === '') {
      // Wenn das Feld leer ist, zeige den aktuellen Wert an
      setInputText(formatValue(value));
    }
    // Wir aktualisieren nicht, wenn der Benutzer gerade tippt, um Sprünge zu vermeiden
  }, [value]);
  
  // Formatiere einen Wert entsprechend der Konfiguration
  function formatValue(val: number): string {
    if (allowDecimals) {
      return val.toFixed(decimalPlaces);
    } else {
      return Math.round(val).toString();
    }
  }
  
  // Verarbeite Textänderungen
  const handleTextChange = (text: string) => {
    // Bereinige den Text sofort basierend auf den Komponenteneinstellungen
    let cleanedText = text;
    
    // Wenn keine Dezimalstellen erlaubt sind, entferne sofort alle Kommas und Punkte
    if (!allowDecimals) {
      cleanedText = text.replace(/[.,]/g, '');
    } else {
      // Bei erlaubten Dezimalstellen: Ersetze Kommas durch Punkte für konsistente Eingabe
      cleanedText = text.replace(/,/g, '.');
      
      // Verhindere mehr als einen Dezimalpunkt
      const pointCount = (cleanedText.match(/\./g) || []).length;
      if (pointCount > 1) {
        // Behalte nur den ersten Dezimalpunkt
        const parts = cleanedText.split('.');
        cleanedText = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Begrenze auf die angegebene Anzahl an Nachkommastellen
      if (cleanedText.includes('.')) {
        const parts = cleanedText.split('.');
        // Wenn mehr Nachkommastellen eingegeben wurden als erlaubt,
        // schneide die überzähligen ab
        if (parts[1].length > decimalPlaces) {
          parts[1] = parts[1].substring(0, decimalPlaces);
          cleanedText = parts[0] + '.' + parts[1];
        }
      }
    }
    
    // Speichere den bereinigten Text im lokalen State
    setInputText(cleanedText);
    
    // Konvertiere in Zahl
    const numValue = parseFloat(cleanedText);
    
    // Nur wenn es eine gültige Zahl ist, aktualisiere den übergeordneten Wert
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      
      // Wenn keine Dezimalstellen erlaubt sind, runde den Wert
      if (!allowDecimals) {
        finalValue = Math.round(finalValue);
      }
      
      // WICHTIG: Wir begrenzen den Wert NICHT mehr auf den Slider-Bereich
      // Der Benutzer kann beliebige Werte eingeben, auch größer als maxValue
      
      // Löse den Callback aus
      onValueChange(finalValue);
    }
    // Bei leerem oder ungültigem Text ändern wir den Wert nicht
  };
  
  // Berechne den mittleren Wert für die Label-Anzeige, falls nicht explizit angegeben
  const actualMiddleValue = middleValue !== undefined ? middleValue : (minValue + maxValue) / 2;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header mit Label, Einheit und Eingabefeld in einer Zeile */}
      <View style={styles.headerContainer}>
        {/* Label (links) */}
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        
        {/* Eingabefeld und Einheit (rechts) */}
        <View style={styles.unitInputGroup}>
          <TextInput
            style={[styles.input, inputStyle]}
            value={inputText}
            placeholder={placeholder}
            onChangeText={handleTextChange}
            keyboardType={Platform.OS === 'ios' ? "decimal-pad" : "numeric"}
            selectTextOnFocus={true}
          />
          {unit && (
            <Text style={styles.unit}>{unit}</Text>
          )}
        </View>
      </View>
      
      {/* Slider - zeigt nur Werte im gültigen Bereich an */}
      <View style={[styles.sliderContainer, sliderStyle]}>
        <Slider
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          // Slider-Wert wird auf den gültigen Bereich begrenzt, auch wenn der tatsächliche Wert größer sein kann
          value={Math.min(Math.max(value, minValue), maxValue)}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
          onValueChange={(val: number) => {
            // Formatiere den Wert entsprechend der Konfiguration
            const formattedValue = allowDecimals 
              ? Math.round(val * (10 ** decimalPlaces)) / (10 ** decimalPlaces)
              : Math.round(val);
            
            // Aktualisiere den Wert - der Slider beschränkt den Wert auf seinen Bereich
            // aber der Benutzer kann größere/kleinere Werte direkt eingeben
            onValueChange(formattedValue);
          }}
        />
      </View>
      
      {/* Slider-Beschriftungen */}
      <View style={styles.labelsContainer}>
        <Text style={styles.labelText}>
          {minValue}
        </Text>
        <Text style={styles.labelText}>
          {actualMiddleValue}
        </Text>
        <Text style={styles.labelText}>
          {maxValue}
        </Text>
      </View>
    </View>
  );
}

export default SliderWithInput;
