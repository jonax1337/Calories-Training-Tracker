import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { register } from '../services/auth-service';
import { useTheme } from '../theme/theme-context';
import { RootStackParamList } from '../navigation';
import DateTimePicker from '@react-native-community/datetimepicker';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError('E-Mail-Adresse ist erforderlich');
      return;
    }
    
    if (!password.trim()) {
      setError('Passwort ist erforderlich');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    if (!name.trim()) {
      setError('Name ist erforderlich');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await register({
        email,
        password,
        name,
        birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
      });
      
      if (response) {
        // Instead of navigating, just set a message that registration was successful
        // The NavigationContent component will detect the auth change and switch to AppStack
        setIsLoading(false);
        setError(null);
        // Force app reload to refresh navigation state
        setTimeout(() => {
          // This timeout is just to give the user visual feedback that registration succeeded
          // The navigation will happen automatically when the app detects the auth token
          alert('Registrierung erfolgreich!');
        }, 500);
        return; // Exit early to prevent further setError calls
      } else {
        setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Neues Konto erstellen</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>Registrieren Sie sich, um Ihre Ernährung zu verfolgen</Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Ihr vollständiger Name"
              placeholderTextColor={theme.colors.disabled}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="Passwort erstellen"
              placeholderTextColor={theme.colors.disabled}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Passwort bestätigen</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Passwort wiederholen"
              placeholderTextColor={theme.colors.disabled}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Geburtsdatum</Text>
            <TouchableOpacity 
              onPress={showDatePickerModal}
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                justifyContent: 'center'
              }]}
            >
              <Text style={{ color: birthDate ? theme.colors.text : theme.colors.disabled }}>
                {birthDate ? birthDate.toLocaleDateString() : 'Geburtsdatum auswählen'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Registrierung läuft...' : 'Registrieren'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.text }]}>
              Bereits ein Konto?
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                Jetzt anmelden
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
  },
  header: {
    marginBottom: 30,
    marginTop: 20,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    marginRight: 5,
  },
  loginLink: {
    fontWeight: '600',
  },
});

export default RegisterScreen;
