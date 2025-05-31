import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { register, checkEmailExists } from '../services/auth-service';
import { useTheme } from '../theme/theme-context';
import { RootStackParamList } from '../navigation';
import { createAuthStyles } from '../styles/screens/auth-styles';
import { debounce } from 'lodash';
import * as Haptics from 'expo-haptics';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// Funktion zur Bewertung der Passwortstärke (0-100)
const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Länge: Bis zu 40 Punkte für die Länge (max bei 12 Zeichen)
  score += Math.min(40, password.length * 3.33);
  
  // Zeichenvielfalt: Bis zu 60 Punkte
  if (/[a-z]/.test(password)) score += 10; // Kleinbuchstaben
  if (/[A-Z]/.test(password)) score += 15; // Großbuchstaben
  if (/[0-9]/.test(password)) score += 15; // Zahlen
  if (/[^a-zA-Z0-9]/.test(password)) score += 20; // Sonderzeichen
  
  return Math.min(100, Math.round(score));
};

// Funktion zur Bestimmung der Passwortstärke-Kategorie
const getStrengthCategory = (strength: number): { label: string; color: string } => {
  if (strength < 30) return { label: 'Sehr schwach', color: '#FF3B30' };
  if (strength < 50) return { label: 'Schwach', color: '#FF9500' };
  if (strength < 70) return { label: 'Mittel', color: '#FFCC00' };
  if (strength < 90) return { label: 'Stark', color: '#34C759' };
  return { label: 'Sehr stark', color: '#00C7BE' };
};

const RegisterScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createAuthStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Feldspezifische Fehler
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Neue Zustände für die Passwortstärke und E-Mail-Validierung
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  // Funktion zum Zurücksetzen aller Fehler
  const resetErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);
  };

  // Prüft E-Mail mit Debounce, um die API nicht zu überlasten
  const checkEmailExistsDebounced = useCallback(
    debounce(async (email: string) => {
      if (!email || !email.includes('@')) return;
      
      setIsCheckingEmail(true);
      try {
        const exists = await checkEmailExists(email);
        setEmailExists(exists);
      } catch (error) {
        console.error('Failed to check email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500),
    []
  );
  
  // Aktualisiere Passwortstärke, wenn sich das Passwort ändert
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);
  
  // Prüfe E-Mail, wenn sie sich ändert
  useEffect(() => {
    if (email) {
      checkEmailExistsDebounced(email);
    } else {
      setEmailExists(false);
    }
  }, [email, checkEmailExistsDebounced]);
  
  const handleRegister = async () => {
    // Zurücksetzen aller Fehler
    resetErrors();
    
    let hasErrors = false;
    
    if (!email.trim()) {
      setEmailError('E-Mail-Adresse ist erforderlich');
      hasErrors = true;
    } else if (emailExists) {
      setEmailError('Diese E-Mail-Adresse wird bereits verwendet');
      hasErrors = true;
    }
    
    if (!password.trim()) {
      setPasswordError('Passwort ist erforderlich');
      hasErrors = true;
    } else if (passwordStrength < 50) {
      setPasswordError('Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.');
      hasErrors = true;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwörter stimmen nicht überein');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    setIsLoading(true);
    resetErrors();
    
    try {
      const response = await register({
        email,
        password,
      });
      
      if (response) {
        // Instead of navigating, just set a message that registration was successful
        // The NavigationContent component will detect the auth change and switch to AppStack
        setIsLoading(false);
        resetErrors();
        // Vibration and Haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Exit early to prevent further error calls
        return;
      } else {
        setGeneralError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      setGeneralError('Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* Entferne den globalen Fehler oben */}

        <View style={{ paddingHorizontal: theme.spacing.m }}>
          <View style={{ marginTop: theme.spacing.m, marginBottom: theme.spacing.l }}>
            <Text style={{
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              E-Mail
            </Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: (emailExists || emailError) ? theme.colors.error : theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.borderRadius.medium,
                  padding: theme.spacing.m,
                  fontSize: theme.typography.fontSize.m,
                  fontFamily: theme.typography.fontFamily.regular
                }}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (value.trim()) setEmailError(null);
                }}
                placeholder="Ihre E-Mail-Adresse"
                placeholderTextColor={theme.colors.disabled}
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
                enterKeyHint='done'
              />
              {isCheckingEmail && (
                <ActivityIndicator 
                  style={{ position: 'absolute', right: 15, top: 15 }}
                  size="small" 
                  color={theme.colors.primary} 
                />
              )}
            </View>
            {emailError && (
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.s,
                marginTop: 5,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                {emailError}
              </Text>
            )}
            {emailExists && !emailError && (
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.s,
                marginTop: 5,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                Diese E-Mail-Adresse wird bereits verwendet
              </Text>
            )}
          </View>

          <View style={{ marginBottom: theme.spacing.l }}>
            <Text style={{
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              Passwort
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: passwordError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                fontSize: theme.typography.fontSize.m,
                fontFamily: theme.typography.fontFamily.regular
              }}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (value.trim()) setPasswordError(null);
              }}
              placeholder="Ihr Passwort"
              placeholderTextColor={theme.colors.disabled}
              secureTextEntry
              autoCorrect={false}
              enterKeyHint='done'
            />
            
            {/* Passwortstärke-Anzeige */}
            {password.length > 0 && (
              <>
                <View style={{ marginTop: 10, marginBottom: 5 }}>
                  <View style={{
                    height: 6,
                    backgroundColor: theme.colors.disabled + '40',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}>
                    <View style={{
                      width: `${passwordStrength}%`,
                      height: '100%',
                      backgroundColor: getStrengthCategory(passwordStrength).color,
                      borderRadius: 3,
                    }} />
                  </View>
                </View>
                <Text style={{
                  fontSize: theme.typography.fontSize.s,
                  color: getStrengthCategory(passwordStrength).color,
                  fontFamily: theme.typography.fontFamily.medium,
                }}>
                  {getStrengthCategory(passwordStrength).label}
                </Text>
              </>
            )}
            
            {/* Fehleranzeige */}
            {passwordError && (
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.s,
                marginTop: 5,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                {passwordError}
              </Text>
            )}
          </View>

          <View style={{ marginBottom: theme.spacing.l }}>
            <Text style={{
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              Passwort bestätigen
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: confirmPasswordError ? theme.colors.error : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                fontSize: theme.typography.fontSize.m,
                fontFamily: theme.typography.fontFamily.regular
              }}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (value === password) setConfirmPasswordError(null);
              }}
              placeholder="Passwort wiederholen"
              placeholderTextColor={theme.colors.disabled}
              autoCorrect={false}
              autoCapitalize="none"
              enterKeyHint='done'
              secureTextEntry
            />
            {confirmPasswordError && (
              <Text style={{
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.s,
                marginTop: 5,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                {confirmPasswordError}
              </Text>
            )}
          </View>

          {generalError && (
            <View style={{
              backgroundColor: `${theme.colors.errorLight}`,
              padding: theme.spacing.m,
              borderRadius: theme.borderRadius.medium,
              marginBottom: theme.spacing.m
            }}>
              <Text style={{
                color: theme.colors.error,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                {generalError}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: theme.spacing.m,
              borderRadius: theme.borderRadius.medium,
              alignItems: 'center',
              marginBottom: theme.spacing.l,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2
            }}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: theme.typography.fontSize.m,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              {isLoading ? 'Registrierung läuft...' : 'Registrieren'}
            </Text>
          </TouchableOpacity>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: theme.spacing.m,
            marginBottom: theme.spacing.xl
          }}>
            <Text style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.regular,
              marginRight: theme.spacing.xs
            }}>
              Bereits registriert?
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={{
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                Jetzt anmelden
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;