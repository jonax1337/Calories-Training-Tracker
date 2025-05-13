import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { ProfileTabScreenProps } from '../types/navigation-types';
import { ActivityLevel, UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from '../services/storage-service';
import { requestHealthPermissions } from '../services/health-service';
import { useTheme } from '../theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ProfileScreen({ navigation }: ProfileTabScreenProps) {
  // Get theme from context
  const { theme } = useTheme();
  // Get safe area insets for handling notches and navigation bars
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_1',
    name: '',
    goals: {
      dailyCalories: 2000,
      dailyProtein: 50,
      dailyCarbs: 250,
      dailyFat: 70,
      dailyWater: 2000,
    },
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [healthPermission, setHealthPermission] = useState(false);

  // Load user profile and check health permissions
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const savedProfile = await getUserProfile();
        if (savedProfile) {
          setProfile(savedProfile);
        }
        
        // Check health permissions
        const hasPermission = await requestHealthPermissions();
        setHealthPermission(hasPermission);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Handle text input changes
  const handleTextChange = (field: string, value: string) => {
    // Handle nested fields for goals
    if (field.startsWith('goals.')) {
      const goalField = field.split('.')[1];
      setProfile(prev => ({
        ...prev,
        goals: {
          ...prev.goals,
          [goalField]: value === '' ? '' : Number(value),
        },
      }));
    } else {
      // Handle top-level fields
      setProfile(prev => ({
        ...prev,
        [field]: field === 'name' ? value : (value === '' ? '' : Number(value)),
      }));
    }
  };

  // Handle activity level change
  const handleActivityChange = (level: ActivityLevel) => {
    setProfile(prev => ({
      ...prev,
      activityLevel: level,
    }));
  };

  // Handle saving profile
  const handleSave = async () => {
    try {
      // Basic validation
      if (!profile.name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }

      await saveUserProfile(profile);
      Alert.alert('Success', 'Profile saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  // Request health permissions
  const handleRequestPermissions = async () => {
    try {
      const hasPermission = await requestHealthPermissions();
      setHealthPermission(hasPermission);
      if (hasPermission) {
        Alert.alert('Success', 'Health permissions granted');
      } else {
        Alert.alert('Error', 'Health permissions denied');
      }
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      Alert.alert('Error', 'Failed to request health permissions');
    }
  };

  // Render an activity level button
  const renderActivityButton = (level: ActivityLevel, label: string, description: string) => (
    <TouchableOpacity
      style={[
        styles.activityButton,
        { 
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.medium,
          borderColor: theme.colors.border,
        },
        profile.activityLevel === level && { 
          backgroundColor: theme.colors.primaryLight,
          borderColor: theme.colors.primary 
        },
      ]}
      onPress={() => handleActivityChange(level)}
    >
      <View style={styles.activityButtonContent}>
        <Text style={[
          styles.activityButtonLabel,
          { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text },
          profile.activityLevel === level && { color: theme.colors.primary },
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.activityButtonDescription,
          { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight },
          profile.activityLevel === level && { color: theme.colors.primary },
        ]}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Sticky Header */}
      <View style={[
        styles.stickyHeader, 
        { 
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: 1,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 3,
        }
      ]}>
        <Text style={[styles.headerText, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
          Profil
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{
          paddingHorizontal: 16, // 2 Grid-Punkte (16px)
          paddingTop: 16, // 2 Grid-Punkte (16px)
          paddingBottom: 16 // 2 Grid-Punkte (16px)
        }}
      >
        <Text 
          style={[
            styles.sectionTitle, 
            { 
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily.bold,
              fontSize: theme.typography.fontSize.xl,
              marginBottom: theme.spacing.m,
            }
          ]}
        >
          Persönliche Daten
        </Text>

        <Text
          style={[
            styles.sectionDescription,
            {
              color: theme.colors.textLight,
              fontFamily: theme.typography.fontFamily.regular,
              fontSize: theme.typography.fontSize.m,
              marginBottom: theme.spacing.l,
            }
          ]}
        >
          Persönliche Daten und Fitnessprofile
        </Text>
      
      {/* Name */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Name
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.name}
          onChangeText={(value) => handleTextChange('name', value)}
          placeholder="Enter your name"
          placeholderTextColor={theme.colors.placeholder}
        />
      </View>
      
      {/* Age */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Alter
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.age?.toString() || ''}
          onChangeText={(value) => handleTextChange('age', value)}
          placeholder="Enter your age"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.rowInputs}>
        {/* Weight */}
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Gewicht (kg)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.weight?.toString() || ''}
            onChangeText={(value) => handleTextChange('weight', value)}
            placeholder="Weight"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        
        {/* Height */}
        <View style={[styles.inputContainer, styles.halfInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Größe (cm)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.height?.toString() || ''}
            onChangeText={(value) => handleTextChange('height', value)}
            placeholder="Height"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Activity Level */}
      <Text style={[styles.sectionTitle, { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text }]}>
        Aktivitätsstufe
      </Text>
      <Text style={[styles.sectionDescription, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
        Wählen Sie Ihre typische Aktivitätsstufe, um Ihre Kalorienbedarf zu berechnen
      </Text>
      <View style={styles.activityContainer}>
        {renderActivityButton(
          ActivityLevel.Sedentary,
          'Sedentär',
          'Keine oder wenig Aktivität'
        )}
        {renderActivityButton(
          ActivityLevel.LightlyActive,
          'Leicht aktiv',
          'Leichtes Training 1-3 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.ModeratelyActive,
          'Mäßig aktiv',
          'Mittlere Aktivität 3-5 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.VeryActive,
          'Sehr aktiv',
          'Harte Aktivität 6-7 Tage pro Woche'
        )}
        {renderActivityButton(
          ActivityLevel.ExtremelyActive,
          'Extrem aktiv',
          'Harte tägliche Aktivität & physischer Job'
        )}
      </View>
      
      {/* Nutritional Goals */}
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.m,
          }
        ]}
      >
        Tägliche Ziele
      </Text>
      
      <Text
        style={[
          styles.sectionDescription,
          {
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.l,
          }
        ]}
      >
        Zielwerte für deine tägliche Ernährung
      </Text>
      
      
      {/* Calories */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Kalorien
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.goals.dailyCalories?.toString() || ''}
          onChangeText={(value) => handleTextChange('goals.dailyCalories', value)}
          placeholder="Calories"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.rowInputs}>
        {/* Protein */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Protein (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyProtein?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyProtein', value)}
            placeholder="Protein"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        
        {/* Carbs */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Kohlenhydrate (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyCarbs?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyCarbs', value)}
            placeholder="Carbs"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        
        {/* Fat */}
        <View style={[styles.inputContainer, styles.thirdInput]}>
          <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
            Fett (g)
          </Text>
          <TextInput
            style={[styles.textInput, { 
              fontFamily: theme.typography.fontFamily.regular, 
              color: theme.colors.text,
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.medium
            }]}
            value={profile.goals.dailyFat?.toString() || ''}
            onChangeText={(value) => handleTextChange('goals.dailyFat', value)}
            placeholder="Fat"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Water */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.text }]}>
          Wasser (ml)
        </Text>
        <TextInput
          style={[styles.textInput, { 
            fontFamily: theme.typography.fontFamily.regular, 
            color: theme.colors.text,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.medium
          }]}
          value={profile.goals.dailyWater?.toString() || ''}
          onChangeText={(value) => handleTextChange('goals.dailyWater', value)}
          placeholder="Daily water intake"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="numeric"
        />
      </View>
      
      {/* Health Integration Section */}
      <Text 
        style={[
          styles.sectionTitle, 
          { 
            color: theme.colors.text,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: theme.typography.fontSize.xl,
            marginTop: theme.spacing.l,
            marginBottom: theme.spacing.m,
          }
        ]}
      >
        Gesundheitsintegrierung
      </Text>
      
      <Text
        style={[
          styles.sectionDescription,
          {
            color: theme.colors.textLight,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: theme.typography.fontSize.m,
            marginBottom: theme.spacing.l,
          }
        ]}
      >
        Verbindung mit deinen Gesundheitsdaten
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.connectButton, 
          { 
            backgroundColor: healthPermission ? theme.colors.success : theme.colors.info,
            borderRadius: theme.borderRadius.medium,
            padding: 16, // 2 Grid-Punkte (16px)
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 8, // 1 Grid-Punkt (8px)
          }
        ]}
        onPress={handleRequestPermissions}
      >
        <Text style={[styles.connectButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white' }]}>
          {healthPermission ? 'Gesundheitsdaten zugeordnet ✓' : 'Gesundheitsdaten zugeordnet'}
        </Text>
      </TouchableOpacity>
      
      <Text style={[styles.permissionInfo, { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textLight }]}>
        Dies wird erlauben, dass die App auf Ihre Gesundheitsdaten zugreift, wie z.B. Schritte, Herzfrequenz und Aktivität.
      </Text>
      
      {/* Save Button */}
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          { 
            backgroundColor: theme.colors.primary, 
            borderRadius: theme.borderRadius.medium,
            padding: 16,
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 40
          },
          isLoading && { backgroundColor: theme.colors.disabled }
        ]} 
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={[styles.saveButtonText, { fontFamily: theme.typography.fontFamily.bold, color: 'white', fontSize: 16 }]}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 16, // 2 Grid-Punkte (16px)
    paddingBottom: 8, // 1 Grid-Punkt (8px)
    zIndex: 10,
  },
  headerText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 8, // 1 Grid-Punkt (8px)
  },
  scrollContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24, // 3 Grid-Punkte (24px)
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  inputContainer: {
    marginBottom: 16, // 2 Grid-Punkte (16px)
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8, // 1 Grid-Punkt (8px)
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8, // 1 Grid-Punkt (8px)
    padding: 16, // 2 Grid-Punkte (16px)
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  thirdInput: {
    width: '31%',
  },
  activityContainer: {
    marginBottom: 16,
  },
  activityButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  selectedActivityButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  activityButtonContent: {
    padding: 12,
  },
  activityButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedActivityText: {
    color: 'white',
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionGrantedButton: {
    backgroundColor: '#4CAF50',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
  },
  connectButton: {
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 16,
  },
  permissionInfo: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default ProfileScreen;
