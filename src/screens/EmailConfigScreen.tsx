import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { createEmailConfigStyles } from '../styles/screens/EmailConfigStyles';
import {
  EmailConfiguration,
  getUserEmailConfigurations,
  deleteEmailConfiguration,
  sendTestEmail,
  testEmailConfiguration
} from '../services/emailConfigService';
import { Mail, Plus, Settings, Trash2, Check } from 'lucide-react-native';

type EmailConfigScreenProps = NativeStackScreenProps<RootStackParamList, 'EmailConfiguration'>;

export default function EmailConfigScreen({ navigation }: EmailConfigScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createEmailConfigStyles(theme);

  const [emailConfigurations, setEmailConfigurations] = useState<EmailConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Load email configurations
  const loadEmailConfigurations = useCallback(async () => {
    try {
      setIsLoading(true);
      const configs = await getUserEmailConfigurations();
      setEmailConfigurations(configs);
    } catch (error) {
      console.error('Error loading email configurations:', error);
      Alert.alert(
        'Fehler',
        'E-Mail-Konfigurationen konnten nicht geladen werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEmailConfigurations();
      setAnimationKey(prev => prev + 1);
    }, [loadEmailConfigurations])
  );

  // Handle setting outbound email
  const handleSetOutbound = async (configId: string) => {
    try {
      setIsUpdating(configId);
      await setOutboundEmail(configId);
      await loadEmailConfigurations(); // Reload to update the UI
      Alert.alert(
        'Erfolg',
        'Ausgehende E-Mail-Konfiguration wurde gesetzt.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error setting outbound email:', error);
      Alert.alert(
        'Fehler',
        'Ausgehende E-Mail-Konfiguration konnte nicht gesetzt werden.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delete email configuration
  const handleDeleteConfiguration = (config: EmailConfiguration) => {
    Alert.alert(
      'E-Mail-Konfiguration löschen',
      `Möchten Sie die E-Mail-Konfiguration für "${config.email_address}" wirklich löschen?`,
      [
        {
          text: 'Abbrechen',
          style: 'cancel'
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmailConfiguration(config.id);
              await loadEmailConfigurations();
              Alert.alert(
                'Gelöscht',
                'E-Mail-Konfiguration wurde erfolgreich gelöscht.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error deleting email configuration:', error);
              Alert.alert(
                'Fehler',
                'E-Mail-Konfiguration konnte nicht gelöscht werden.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  // Render email configuration item
  const renderEmailConfigItem = (config: EmailConfiguration, index: number) => (
    <Animatable.View
      key={config.id}
      animation="fadeInUp"
      duration={600}
      delay={200 + (index * 100)}
    >
      <View style={styles.configCard}>
        <View style={styles.configHeader}>
          <View style={styles.configInfo}>
            <View style={styles.emailRow}>
              <Mail size={20} color={theme.colors.primary} />
              <Text style={styles.emailAddress}>{config.email_address}</Text>
              {config.is_outbound && (
                <View style={styles.outboundBadge}>
                  <Check size={14} color="white" />
                  <Text style={styles.outboundBadgeText}>Ausgehend</Text>
                </View>
              )}
            </View>
            {config.display_name && (
              <Text style={styles.displayName}>{config.display_name}</Text>
            )}
            <Text style={styles.configDetails}>
              {config.smtp_host}:{config.smtp_port} ({config.smtp_security.toUpperCase()})
            </Text>
          </View>
        </View>

        <View style={styles.configActions}>
          <View style={styles.outboundSection}>
            <Text style={styles.outboundLabel}>Ausgehend</Text>
            <Switch
              value={config.is_outbound}
              onValueChange={() => !config.is_outbound && handleSetOutbound(config.id)}
              disabled={isUpdating === config.id || config.is_outbound}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'android' ? theme.colors.surface : ''}
            />
            {isUpdating === config.id && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditEmailConfiguration', { configId: config.id })}
            >
              <Settings size={20} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteConfiguration(config)}
            >
              <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-Mail-Konfiguration</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEmailConfiguration')}
        >
          <Plus size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          padding: theme.spacing.m,
          paddingBottom: Math.max(theme.spacing.m, insets.bottom)
        }}
      >
        {/* Description */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={100}
        >
          <Text style={styles.description}>
            Konfigurieren Sie E-Mail-Konten für das Versenden von Benachrichtigungen. 
            Nur ein Konto kann als "Ausgehend" markiert werden.
          </Text>
        </Animatable.View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Lade E-Mail-Konfigurationen...</Text>
          </View>
        )}

        {/* Email configurations list */}
        {!isLoading && emailConfigurations.length > 0 && (
          <View style={styles.configList}>
            {emailConfigurations.map((config, index) => renderEmailConfigItem(config, index))}
          </View>
        )}

        {/* Empty state */}
        {!isLoading && emailConfigurations.length === 0 && (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={200}
            style={styles.emptyState}
          >
            <Mail size={64} color={theme.colors.disabled} />
            <Text style={styles.emptyStateTitle}>Keine E-Mail-Konten konfiguriert</Text>
            <Text style={styles.emptyStateMessage}>
              Fügen Sie ein E-Mail-Konto hinzu, um Benachrichtigungen zu versenden.
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => navigation.navigate('AddEmailConfiguration')}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addFirstButtonText}>Erstes Konto hinzufügen</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>
    </View>
  );
}