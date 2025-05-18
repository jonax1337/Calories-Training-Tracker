import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { login } from '../services/auth-service';
import { useTheme } from '../theme/theme-context';
import { RootStackParamList } from '../navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
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
        // Force app reload to refresh navigation state
        setTimeout(() => {
          // This timeout is just to give the user visual feedback that login succeeded
          // The navigation will happen automatically when the app detects the auth token
          alert('Login erfolgreich!');
        }, 500);
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Calories Tracker</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Melden Sie sich an, um Ihre Ernährung zu verfolgen</Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>E-Mail</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Ihre E-Mail-Adresse"
              placeholderTextColor={theme.colors.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Passwort</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Ihr Passwort"
              placeholderTextColor={theme.colors.disabled}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.colors.text }]}>
              Noch kein Konto?
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
                Jetzt registrieren
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    marginRight: 5,
  },
  registerLink: {
    fontWeight: '600',
  },
});

export default LoginScreen;
