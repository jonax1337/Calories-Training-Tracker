import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { fetchUserProfile, fetchUserGoals } from '../services/profile-api';
import { UserProfile, UserGoals } from '../types';
import NutritionReportComponent from '../components/reports/nutrition-report-component';
import { useTheme } from '../theme/theme-context';
import LoadingScreen from '../components/ui/loading-screen';

const NutritionReportScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NutritionReport'>>();
  const styles = createStyles(theme.theme);
  
  // Extrahiere days-Parameter aus Route oder verwende Standardwert 30
  const days = route.params?.days || 30;
  
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

  return (
    <SafeAreaView style={styles.container}>
      <NutritionReportComponent 
        userProfile={userProfile} 
        userGoals={userGoals} 
        days={days}
      />
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
