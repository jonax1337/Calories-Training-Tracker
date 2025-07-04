import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, AUTH_TOKEN_KEY, USER_ID_KEY } from '../config/apiConfig';
import { UserProfile, UserGoal, GoalType, ActivityLevel } from '../types';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Helper to get the current user's ID
const getCurrentUserId = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_ID_KEY);
};

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User ID not found');

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user profile' }));
    console.error('Error fetching profile:', response.status, errorData);
    throw new Error(errorData.message || 'Failed to fetch user profile');
  }
  const responseText = await response.text(); // Get raw text first
  let data;
  try {
    data = JSON.parse(responseText); // Parse the raw text
  } catch (e) {
    console.error('Failed to parse user profile data from server.');
    throw new Error('Failed to parse user profile data from server.');
  }

  // Map and normalize fields
  if (data) {
    // Handle active_goal_type_id
    if (data.active_goal_type_id !== undefined) {
      data.activeGoalTypeId = data.active_goal_type_id;
      // delete data.active_goal_type_id; // Optional
    }

    // Normalize birthDate (assuming backend might send as birth_date or birthDate)
    let rawBirthDate = data.birth_date || data.birthDate;
    if (typeof rawBirthDate === 'string' && rawBirthDate.length > 0) {
      // Take only the YYYY-MM-DD part if it's a longer string (e.g., ISO timestamp)
      data.birthDate = rawBirthDate.substring(0, 10);
      if (data.birth_date) {
        // delete data.birth_date; // Optional: remove original snake_case key if it exists
      }
    } else if (rawBirthDate) {
      // If it's not a string but exists (e.g. already a Date object from some transform, though unlikely here)
      // This case is less likely for raw API data but good for robustness
      try {
        const dateObj = new Date(rawBirthDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        data.birthDate = `${year}-${month}-${day}`;
      } catch (e) {
        console.warn('[DEBUG] fetchUserProfile - Could not parse rawBirthDate into YYYY-MM-DD:', rawBirthDate, e);
        // Leave birthDate as is or set to null/undefined if parsing fails
      }
    }
  }
  return data;
};

export const updateUserProfile = async (profileData: UserProfile): Promise<UserProfile> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User ID not found for update');
  
  // Ensure the profileData sent to the backend includes the id if the backend expects it
  // Or, if the backend identifies user by token, this might not be strictly needed in payload.
  // For a POST to /api/users/ that acts as an update, the body should contain all fields.
  // Handle potential snake_case for backend
  // Destructure to handle specific mappings and include all necessary fields
  const { 
    id, // Exclude from rest if not needed in body, or handle as needed
    goals, // Exclude goals from main profile update if handled separately
    activeGoalTypeId, 
    birthDate, 
    // Ensure all other UserProfile fields are captured by restOfProfileData
    ...restOfProfileData 
  } = profileData;

  const profileToSend: any = {
    ...restOfProfileData, // Includes name, age, height, weight, gender, activityLevel etc.
    id: id, // Add the user's primary ID (from profileData.id) to the payload
    user_id: userId, // Keep user_id as well, backend might use one or both
  };

  // Map activeGoalTypeId to snake_case if it exists
  if (activeGoalTypeId !== undefined) {
    profileToSend.active_goal_type_id = activeGoalTypeId;
  }

  // Map birthDate to snake_case with robust validation and formatting
  if (birthDate) {
    try {
      // ROBUST: Zuerst prüfen, ob es bereits ein korrektes Format hat (YYYY-MM-DD)
      const isAlreadyProperFormat = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
      let formattedDate = birthDate; // Standardwert ist der Originalwert
      
      if (!isAlreadyProperFormat) {
        // Sonst versuchen zu konvertieren
        const dateObj = new Date(birthDate);
        
        if (!isNaN(dateObj.getTime())) {
          // Manuelle Formatierung ins ISO-Format YYYY-MM-DD
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
      
      // WICHTIG: Explizit als klar definierten String ohne Zeitangaben setzen
      // Zuerst als normalen Schlüssel für den Frontend-Code
      profileToSend.birthDate = formattedDate;
      
      // Dann als snake_case-Schlüssel für das Backend
      // KRITISCH: Das ist der wichtigste Teil, der ins Backend geht!
      profileToSend.birth_date = formattedDate;
    } catch (error) {
      // Fehlerbehandlung ohne Logging
    }
  }

  // Add the 'goals' object back if it was present in the original profileData
  if (goals) { // 'goals' is the destructured variable from profileData
    profileToSend.goals = goals; // This ensures the nested goals object is sent
  }

  // Ensure numeric fields are numbers (they should be from profile-screen, but good to be sure)
  if (profileData.height !== undefined) profileToSend.height = Number(profileData.height);
  if (profileData.weight !== undefined) profileToSend.weight = Number(profileData.weight);
  // age is already calculated and should be a number

  const headers = await getAuthHeaders();
  // The user_id is often part of the URL for PUT requests, or part of token for POST acting as UPSERT
  // If your backend /api/users POST is for creating and /api/users/:userId PUT is for updating, adjust accordingly.
  // Assuming POST to /api/users with user_id in body acts as an update or upsert based on token auth.
  const response = await fetch(`${API_BASE_URL}/api/users`, { 
    method: 'POST', 
    headers,
    body: JSON.stringify(profileToSend),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update user profile' }));
    console.error('Error updating profile:', response.status, errorData);
    throw new Error(errorData.message || 'Failed to update user profile');
  }
  const updatedProfile = await response.json();
  return updatedProfile;
};

export const fetchGoalTypes = async (): Promise<GoalType[]> => {
  // Goal types might not need authentication, but including for consistency if backend changes
  const headers = await getAuthHeaders(); 
  const response = await fetch(`${API_BASE_URL}/api/user-goals/types`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }, // Public route, no auth needed as per userGoals.js
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch goal types' }));
    console.error('Error fetching goal types:', response.status, errorData);
    throw new Error(errorData.message || 'Failed to fetch goal types');
  }
  const goalTypesData = await response.json();
  // Map snake_case from backend to camelCase for GoalType interface
  if (Array.isArray(goalTypesData)) {
    return goalTypesData.map((type: any) => {
      const newType = { ...type };
      if (newType.is_custom !== undefined) {
        newType.isCustom = !!newType.is_custom; // Ensure boolean value (0/1 from DB to false/true)
        // delete newType.is_custom; // Optional: remove original snake_case key
      }
      return newType as GoalType;
    });
  }
  console.warn('[DEBUG] fetchGoalTypes - Expected an array but received:', goalTypesData);
  return []; // Return empty array or throw error
};

export const fetchUserGoals = async (): Promise<UserGoal[]> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User ID not found');

  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/user-goals/${userId}`, {
    method: 'GET',
    headers,
  });

  // Bei 404 (keine Ziele gefunden) leeres Array zurückgeben statt Fehler zu werfen
  if (response.status === 404) {
    console.warn('Keine Ziele für diesen Benutzer gefunden. Leeres Array wird zurückgegeben.');
    return [];
  }
  
  // Bei anderen Fehlern weiterhin einen Fehler werfen
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user goals' }));
    console.error('Error fetching user goals:', response.status, errorData);
    throw new Error(errorData.message || 'Failed to fetch user goals');
  }
  const userGoalsData = await response.json();
  // Map snake_case from backend to camelCase for UserGoal interface
  if (Array.isArray(userGoalsData)) {
    return userGoalsData.map((goal: any) => {
      return {
        id: goal.id,
        userId: goal.user_id,
        goalTypeId: goal.goal_type_id,
        goalTypeName: goal.goal_type_name, // Assuming this might come from API
        isCustom: !!goal.is_custom, // Ensure boolean
        dailyCalories: goal.daily_calories,
        dailyProtein: goal.daily_protein,
        dailyCarbs: goal.daily_carbs,
        dailyFat: goal.daily_fat,
        dailyWater: goal.daily_water,
        // Include any other fields from UserGoal type that might come from API
        // created_at: goal.created_at, // Example, if needed
        // updated_at: goal.updated_at, // Example, if needed
      } as UserGoal;
    });
  }
  console.warn('[DEBUG] fetchUserGoals - Expected an array but received:', userGoalsData);
  return []; // Return empty array or throw error
};

export const createOrUpdateUserGoal = async (goalData: UserGoal): Promise<UserGoal> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('User ID not found');

  const headers = await getAuthHeaders();
  // The backend route is /api/user-goals/:userId and expects goal data in the body
  const response = await fetch(`${API_BASE_URL}/api/user-goals/${userId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(goalData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to save user goal' }));
    console.error('Error saving user goal:', response.status, errorData);
    throw new Error(errorData.message || 'Failed to save user goal');
  }
  return response.json();
};
