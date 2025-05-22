import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { login } from '../services/auth-service';
import { useTheme } from '../theme/theme-context';
import { RootStackParamList } from '../navigation';
import { createAuthStyles } from '../styles/screens/auth-styles';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Styles mit aktuellem Theme initialisieren
  const styles = createAuthStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError('E-Mail-Adresse ist erforderlich');
      return;
    }
    
    if (!password.trim()) {
      setError('Passwort ist erforderlich');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await login({ email, password });
      
      if (response) {
        // Instead of navigating, just set a message that login was successful
        // The NavigationContent component will detect the auth change and switch to AppStack
        setIsLoading(false);
        setError(null);
        return; // Exit early to prevent further setError calls
      } else {
        setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.loginScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <Ionicons 
            name="flame-outline" 
            size={100} 
            color={theme.colors.primary} 
          />
        </View>
        
        {error && (
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
              {error}
            </Text>
          </View>
        )}

        <View style={{ paddingHorizontal: theme.spacing.m }}>
          <View style={{ marginBottom: theme.spacing.l }}>
            <Text style={{
              fontSize: theme.typography.fontSize.s,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              E-Mail
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                fontSize: theme.typography.fontSize.m,
                fontFamily: theme.typography.fontFamily.regular
              }}
              value={email}
              onChangeText={setEmail}
              placeholder="Ihre E-Mail-Adresse"
              placeholderTextColor={theme.colors.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={{ marginBottom: theme.spacing.xl }}>
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
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.borderRadius.medium,
                padding: theme.spacing.m,
                fontSize: theme.typography.fontSize.m,
                fontFamily: theme.typography.fontFamily.regular
              }}
              value={password}
              onChangeText={setPassword}
              placeholder="Ihr Passwort"
              placeholderTextColor={theme.colors.disabled}
              secureTextEntry
            />
          </View>

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
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={{
              color: '#FFFFFF',
              fontSize: theme.typography.fontSize.m,
              fontFamily: theme.typography.fontFamily.medium
            }}>
              {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Text>
          </TouchableOpacity>

          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: theme.spacing.m
          }}>
            <Text style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.regular,
              marginRight: theme.spacing.xs
            }}>
              Noch kein Konto?
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={{
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily.medium
              }}>
                Jetzt registrieren
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
