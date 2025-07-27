import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAddEmailConfigStyles } from '../styles/screens/AddEmailConfigStyles';
import {
  CreateEmailConfigurationRequest,
  createEmailConfiguration
} from '../services/emailConfigService';
import { Mail, Server, User, Lock, Shield, Eye, EyeOff } from 'lucide-react-native';

type AddEmailConfigScreenProps = NativeStackScreenProps<RootStackParamList, 'AddEmailConfiguration'>;

export default function AddEmailConfigScreen({ navigation }: AddEmailConfigScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createAddEmailConfigStyles(theme);

  const [formData, setFormData] = useState<CreateEmailConfigurationRequest>({
    email_address: '',
    display_name: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_security: 'tls',
    is_outbound: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email_address?: string;
    display_name?: string;
    smtp_host?: string;
    smtp_port?: string;
    smtp_username?: string;
    smtp_password?: string;
  }>({});

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Email validation
    if (!formData.email_address.trim()) {
      newErrors.email_address = 'E-Mail-Adresse ist erforderlich';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
      newErrors.email_address = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      isValid = false;
    }

    // SMTP Host validation
    if (!formData.smtp_host.trim()) {
      newErrors.smtp_host = 'SMTP-Host ist erforderlich';
      isValid = false;
    }

    // SMTP Username validation
    if (!formData.smtp_username.trim()) {
      newErrors.smtp_username = 'SMTP-Benutzername ist erforderlich';
      isValid = false;
    }

    // SMTP Password validation
    if (!formData.smtp_password.trim()) {
      newErrors.smtp_password = 'SMTP-Passwort ist erforderlich';
      isValid = false;
    }

    // Port validation
    if (formData.smtp_port < 1 || formData.smtp_port > 65535) {
      newErrors.smtp_port = 'Port muss zwischen 1 und 65535 liegen';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createEmailConfiguration(formData);
      
      Alert.alert(
        'Erfolg',
        'E-Mail-Konfiguration wurde erfolgreich erstellt.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating email configuration:', error);
      Alert.alert(
        'Fehler',
        error instanceof Error ? error.message : 'E-Mail-Konfiguration konnte nicht erstellt werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick setup for common email providers
  const setupCommonProvider = (provider: 'gmail' | 'outlook' | 'yahoo') => {
    const providers = {
      gmail: {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_security: 'tls' as const
      },
      outlook: {
        smtp_host: 'smtp-mail.outlook.com',
        smtp_port: 587,
        smtp_security: 'tls' as const
      },
      yahoo: {
        smtp_host: 'smtp.mail.yahoo.com',
        smtp_port: 587,
        smtp_security: 'tls' as const
      }
    };

    const config = providers[provider];
    setFormData(prev => ({
      ...prev,
      ...config
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Mail-Konto hinzufügen</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          padding: theme.spacing.m,
          paddingBottom: Math.max(theme.spacing.m, insets.bottom)
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Setup */}
        <Animatable.View animation="fadeInUp" duration={600} delay={100}>
          <Text style={styles.sectionTitle}>Schnelleinrichtung</Text>
          <View style={styles.quickSetupContainer}>
            <TouchableOpacity
              style={styles.quickSetupButton}
              onPress={() => setupCommonProvider('gmail')}
            >
              <Text style={styles.quickSetupText}>Gmail</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSetupButton}
              onPress={() => setupCommonProvider('outlook')}
            >
              <Text style={styles.quickSetupText}>Outlook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickSetupButton}
              onPress={() => setupCommonProvider('yahoo')}
            >
              <Text style={styles.quickSetupText}>Yahoo</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* Email Configuration Form */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200}>
          <Text style={styles.sectionTitle}>E-Mail-Einstellungen</Text>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Mail size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>E-Mail-Adresse *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.email_address && styles.inputError]}
              value={formData.email_address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email_address: text }))}
              placeholder="ihre.email@domain.com"
              placeholderTextColor={theme.colors.disabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errors.email_address && (
              <Text style={styles.errorText}>{errors.email_address}</Text>
            )}
          </View>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <User size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>Anzeigename (optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.display_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
              placeholder="z.B. Geschäftliche E-Mail"
              placeholderTextColor={theme.colors.disabled}
            />
          </View>
        </Animatable.View>

        {/* SMTP Configuration */}
        <Animatable.View animation="fadeInUp" duration={600} delay={300}>
          <Text style={styles.sectionTitle}>SMTP-Einstellungen</Text>

          {/* SMTP Host */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Server size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>SMTP-Host *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.smtp_host && styles.inputError]}
              value={formData.smtp_host}
              onChangeText={(text) => setFormData(prev => ({ ...prev, smtp_host: text }))}
              placeholder="smtp.gmail.com"
              placeholderTextColor={theme.colors.disabled}
              autoCapitalize="none"
            />
            {errors.smtp_host && (
              <Text style={styles.errorText}>{errors.smtp_host}</Text>
            )}
          </View>

          {/* SMTP Port and Security */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing.s }]}>
              <Text style={styles.inputLabel}>Port *</Text>
              <TextInput
                style={[styles.input, errors.smtp_port && styles.inputError]}
                value={formData.smtp_port.toString()}
                onChangeText={(text) => {
                  const port = parseInt(text) || 587;
                  setFormData(prev => ({ ...prev, smtp_port: port }));
                }}
                placeholder="587"
                placeholderTextColor={theme.colors.disabled}
                keyboardType="numeric"
              />
              {errors.smtp_port && (
                <Text style={styles.errorText}>{errors.smtp_port}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: theme.spacing.s }]}>
              <Text style={styles.inputLabel}>Sicherheit</Text>
              <View style={styles.securityContainer}>
                {(['none', 'ssl', 'tls'] as const).map((security) => (
                  <TouchableOpacity
                    key={security}
                    style={[
                      styles.securityOption,
                      formData.smtp_security === security && styles.securityOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, smtp_security: security }))}
                  >
                    <Text style={[
                      styles.securityText,
                      formData.smtp_security === security && styles.securityTextSelected
                    ]}>
                      {security.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* SMTP Username */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <User size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>SMTP-Benutzername *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.smtp_username && styles.inputError]}
              value={formData.smtp_username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, smtp_username: text }))}
              placeholder="ihre.email@domain.com"
              placeholderTextColor={theme.colors.disabled}
              autoCapitalize="none"
            />
            {errors.smtp_username && (
              <Text style={styles.errorText}>{errors.smtp_username}</Text>
            )}
          </View>

          {/* SMTP Password */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Lock size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>SMTP-Passwort *</Text>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.smtp_password && styles.inputError]}
                value={formData.smtp_password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, smtp_password: text }))}
                placeholder="App-Passwort oder reguläres Passwort"
                placeholderTextColor={theme.colors.disabled}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.disabled} />
                ) : (
                  <Eye size={20} color={theme.colors.disabled} />
                )}
              </TouchableOpacity>
            </View>
            {errors.smtp_password && (
              <Text style={styles.errorText}>{errors.smtp_password}</Text>
            )}
          </View>
        </Animatable.View>

        {/* Outbound Setting */}
        <Animatable.View animation="fadeInUp" duration={600} delay={400}>
          <Text style={styles.sectionTitle}>Sendeeinstellungen</Text>
          <View style={styles.outboundContainer}>
            <View style={styles.outboundInfo}>
              <View style={styles.outboundLabelContainer}>
                <Shield size={20} color={theme.colors.primary} />
                <Text style={styles.outboundLabel}>Als ausgehendes Konto verwenden</Text>
              </View>
              <Text style={styles.outboundDescription}>
                Dieses Konto für das Versenden von E-Mails verwenden. Nur ein Konto kann gleichzeitig als ausgehend markiert sein.
              </Text>
            </View>
            <Switch
              value={formData.is_outbound}
              onValueChange={(value) => setFormData(prev => ({ ...prev, is_outbound: value }))}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'android' ? theme.colors.surface : ''}
            />
          </View>
        </Animatable.View>

        {/* Submit Button */}
        <Animatable.View animation="fadeInUp" duration={600} delay={500}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Konfiguration speichern</Text>
            )}
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}