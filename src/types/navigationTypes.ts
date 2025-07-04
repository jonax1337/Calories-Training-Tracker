import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../Navigation';

// Stack Navigation props for each screen
export type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

export type BarcodeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BarcodeScanner'>;
  route: RouteProp<RootStackParamList, 'BarcodeScanner'>;
};

export type FoodDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FoodDetail'>;
  route: RouteProp<RootStackParamList, 'FoodDetail'>;
};

export type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
  route: RouteProp<RootStackParamList, 'Profile'>;
};

export type DailyLogScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DailyLog'>;
  route: RouteProp<RootStackParamList, 'DailyLog'>;
};

export type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
  route: RouteProp<RootStackParamList, 'Settings'>;
};

// Tab Navigation props
export type HomeTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Home'>;
  route: RouteProp<TabParamList, 'Home'>;
};

export type ProfileTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Profile'>;
  route: RouteProp<TabParamList, 'Profile'>;
};

export type AddTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Food'>;
  route: RouteProp<TabParamList, 'Food'> & {
    params?: {
      mealType?: string;
    };
  };
};

// Spezielle Navigation Props für DailyLog/Journal
export type JournalTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Food'> & {
    navigate: (
      screen: 'DailyLog' | 'FoodDetail' | keyof TabParamList,
      params?: any
    ) => void;
  };
  route: RouteProp<TabParamList, 'Food'>;
};

export type SettingsTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Settings'>;
  route: RouteProp<TabParamList, 'Settings'>;
};

export type TrainingTabScreenProps = {
  navigation: BottomTabNavigationProp<TabParamList, 'Training'>;
  route: RouteProp<TabParamList, 'Training'>;
};
