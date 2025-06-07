import React, { useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator, Text as RNText, StyleSheet, View, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { fetchUserProfile, fetchUserGoals } from '../services/profile-api';
import { UserProfile, UserGoals } from '../types';
import NutritionReportComponent from '../components/reports/nutrition-report-component';
import { useTheme } from '../theme/theme-context';
import { useDateContext } from '../context/date-context';
import LoadingScreen from '../components/ui/loading-screen';

const NutritionReportScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NutritionReport'>>();
  const { selectedDate } = useDateContext();
  const styles = createStyles(theme.theme);
  
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
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {!isLoading && (
            <View>
              <NutritionReportComponent 
                userProfile={userProfile} 
                userGoals={userGoals} 
                days={days}
                selectedDate={selectedDate}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default NutritionReportScreen;
