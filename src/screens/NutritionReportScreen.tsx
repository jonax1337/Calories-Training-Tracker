import React, { useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator, Text as RNText, View, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigation';
import { fetchUserProfile, fetchUserGoals } from '../services/profileApi';
import { UserProfile, UserGoals } from '../types';
import NutritionReportComponent from '../components/reports/NutritionReportComponent';
import { useTheme } from '../theme/ThemeContext';
import { useDateContext } from '../context/DateContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import { createNutritionReportStyles } from '../styles/screens/NutritionReportStyles';
import * as Animatable from 'react-native-animatable';

const NutritionReportScreen = () => {
  const { theme } = useTheme();
  const styles = createNutritionReportStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NutritionReport'>>();
  const { selectedDate } = useDateContext();
  
  // Extrahiere days-Parameter aus Route oder verwende Standardwert 30
  const days = route.params?.days || 30;
  
  // Log zur Fehlersuche
  console.log(`NutritionReportScreen geladen mit Datum: ${selectedDate}, Tage: ${days}`);
  
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const profile = await fetchUserProfile();
        setUserProfile(profile);
        
        const goals = await fetchUserGoals();
        if (goals && goals.length > 0) {
          setUserGoals(goals[0]);
        } else if (profile?.goals) {
          setUserGoals(profile.goals);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten für den Ernährungsbericht:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Zeige Ladebildschirm während die Daten geladen werden
  if (isLoading || !userGoals) {
    return <LoadingScreen />;
  }

  // Schritt-für-Schritt Wiedereinführung der Charts
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {!isLoading && (
            <Animatable.View 
              animation="fadeInUp" 
              duration={600} 
              delay={50}
            >
              <NutritionReportComponent 
                userProfile={userProfile} 
                userGoals={userGoals} 
                days={days}
                selectedDate={selectedDate}
              />
            </Animatable.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NutritionReportScreen;
