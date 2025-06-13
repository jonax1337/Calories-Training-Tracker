import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konstanten für AsyncStorage Keys
const NOTIFICATION_PERMISSION_KEY = '@notifications_permission';
const WATER_REMINDER_ENABLED_KEY = '@water_reminder_enabled';

// Typen für Benachrichtigungseinstellungen
export interface NotificationSettings {
  hasPermission: boolean;
}

// Vereinfachte Wasser-Reminder Konfiguration
export interface WaterReminderConfig {
  enabled: boolean;
}

// Standard-Konfiguration für Wassererinnerungen
export const DEFAULT_WATER_REMINDER_CONFIG: WaterReminderConfig = {
  enabled: false
};

/**
 * Benachrichtigungen für neue App-Instanzen konfigurieren
 */
export const configureNotifications = () => {
  // Benachrichtigungskanal für Android definieren
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('water-reminders', {
      name: 'Wassererinnerungen',
      description: 'Erinnert dich daran, genug Wasser zu trinken',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0080FF',
    });
  }

  // Handler für das Empfangen von Benachrichtigungen einrichten
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,  // Abwärtskompatibilität
      shouldShowBanner: true, // Neue API
      shouldShowList: true,   // Neue API
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  // Setup App State Listener für Hintergrundaktualisierungen
  AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active') {
      try {
        // Prüfe, ob eine Aktualisierung fällig ist
        const nextUpdateStr = await AsyncStorage.getItem('WATER_REMINDER_NEXT_UPDATE');
        if (nextUpdateStr) {
          const nextUpdate = new Date(nextUpdateStr);
          const now = new Date();
          
          if (now >= nextUpdate) {
            // Aktualisierung ist fällig
            const settings = await loadWaterReminderSettings();
            if (settings.enabled) {
              await scheduleWaterReminders(settings);
            }
          }
        }
      } catch (error) {
        console.error("Fehler bei der App-Reaktivierungs-Aktualisierung:", error);
      }
    }
  });
};

/**
 * Prüft, ob Benachrichtigungsberechtigungen vorhanden sind und fragt ggf. nach
 */
export const checkAndRequestPermissions = async (): Promise<boolean> => {
  // Zuerst den gespeicherten Berechtigungsstatus prüfen
  const storedPermission = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  
  // Wenn bereits eine Berechtigung erteilt wurde, kann true zurückgegeben werden
  if (storedPermission === 'granted') {
    return true;
  }

  // Aktuelle Berechtigungen prüfen
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  // Wenn bereits eine Berechtigung erteilt wurde
  if (existingStatus === 'granted') {
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    return true;
  }

  // Andernfalls nach Berechtigungen fragen
  const { status } = await Notifications.requestPermissionsAsync();
  
  // Status speichern
  await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, status);
  
  return status === 'granted';
};

/**
 * Geplante Benachrichtigung erstellen
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  identifier?: string
): Promise<string | undefined> => {
  try {
    // Prüfen, ob Berechtigungen vorliegen
    const hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) {
      console.log('Keine Benachrichtigungsberechtigungen');
      return undefined;
    }

    // Benachrichtigung planen
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
      identifier,
    });

    return id;
  } catch (error) {
    console.error('Fehler beim Planen der Benachrichtigung:', error);
    return undefined;
  }
};

/**
 * Alle geplanten Benachrichtigungen abrufen
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Eine bestimmte Benachrichtigung abbrechen
 */
export const cancelNotification = async (id: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(id);
};

/**
 * Alle Benachrichtigungen abbrechen
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Wassererinnerungen speichern
 */
export const saveWaterReminderSettings = async (config: WaterReminderConfig): Promise<void> => {
  await AsyncStorage.setItem(WATER_REMINDER_ENABLED_KEY, config.enabled.toString());
};

/**
 * Wassererinnerungen laden
 */
export const loadWaterReminderSettings = async (): Promise<WaterReminderConfig> => {
  const enabled = await AsyncStorage.getItem(WATER_REMINDER_ENABLED_KEY);

  return {
    enabled: enabled === 'true' ? true : DEFAULT_WATER_REMINDER_CONFIG.enabled
  };
};

/**
 * Wassererinnerungen planen - nur für den aktuellen Tag
 */
export const scheduleWaterReminders = async (config: WaterReminderConfig): Promise<void> => {
  // Zuerst alle Wassererinnerungen löschen
  await cancelWaterReminders();

  if (!config.enabled) {
    console.log('Wassererinnerungen sind deaktiviert');
    return;
  }

  // Motivationssprüche für die Benachrichtigungen
  const waterMessages = [
    "Zeit für einen Schluck Wasser! 💧 Bleib hydriert!",
    "Wasser trinken nicht vergessen! 💦 Dein Körper dankt es dir.",
    "Hydration ist wichtig! 🚠 Wie wäre es mit einem Glas Wasser?",
    "Erinnerung: Ein Glas Wasser für deine Gesundheit 🏆",
    "Wasser-Check! 💧 Hast du genug getrunken?",
    "Trinkpause! 💧 Wasser ist die beste Wahl.",
    "Dein Körper braucht Flüssigkeit! 💦 Zeit für Wasser!",
  ];

  // Aktuelle Zeit
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Intelligente Konstanten 
  const startHour = 8;  // 8 Uhr morgens
  const endHour = 22;   // 22 Uhr abends
  
  // Dynamisches Intervall basierend auf der Tageszeit
  const timeBlocks = [
    { start: 8, end: 11, interval: 90 },
    { start: 11, end: 14, interval: 60 },
    { start: 14, end: 18, interval: 90 },
    { start: 18, end: 22, interval: 120 },
  ];
  
  // Nur für heute planen
  const date = new Date();
  let notificationCounter = 0;
  
  // Plane zukünftige Benachrichtigungen für den aktuellen Tag
  for (const block of timeBlocks) {
    // Überspringe Blöcke, die bereits vorbei sind
    if (currentHour >= block.end) continue;
    
    const blockStart = Math.max(block.start, currentHour);
    const blockEnd = block.end;
    const intervalMinutes = block.interval;
    
    // Startminute für den ersten Alarm im aktuellen Block berechnen
    let startMinute = 0;
    if (blockStart === currentHour) {
      // Wenn wir im aktuellen Block sind, starte bei der nächsten Intervallzeit
      const nextIntervalTime = Math.ceil(currentMinute / intervalMinutes) * intervalMinutes;
      startMinute = nextIntervalTime;
      
      // Falls die nächste Intervallzeit in der nächsten Stunde ist, überspringen
      if (startMinute >= 60) continue;
    }
    
    // Berechne die Anzahl der verbleibenden Minuten im Block
    const remainingMinutes = (blockEnd - blockStart) * 60 - startMinute;
    // Berechne wie viele Notifications in dieser Zeit passen
    const notificationsInBlock = Math.floor(remainingMinutes / intervalMinutes);
    
    for (let i = 0; i < notificationsInBlock; i++) {
      // Zufällige Nachricht auswählen
      const randomMessage = waterMessages[Math.floor(Math.random() * waterMessages.length)];
      
      // Berechne Zeitpunkt mit zufälliger Variation (-3 bis +3 min)
      const baseMinutes = startMinute + (i * intervalMinutes);
      const variation = Math.floor(Math.random() * 7) - 3; // -3 bis +3 Minuten Variation
      const totalMinutes = baseMinutes + variation;
      
      // Stunde und Minute berechnen
      const hour = blockStart + Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      
      // Benachrichtigungszeit einstellen
      date.setHours(hour, minute, 0, 0);
      
      // Benachrichtigung planen
      const trigger = {
        channelId: 'water-reminders',
        date,
      };
      
      // Eindeutige ID
      const identifier = `water_reminder_today_${notificationCounter}`;
      notificationCounter++;
      
      await scheduleNotification(
        "Trink Wasser! 💧",
        randomMessage,
        trigger,
        identifier
      );
    }
  }

  // Plane eine tägliche Aktualisierung der Wassererinnerungen für Mitternacht
  const midnightUpdate = new Date();
  midnightUpdate.setDate(midnightUpdate.getDate() + 1); // Morgen
  midnightUpdate.setHours(0, 1, 0, 0); // Kurz nach Mitternacht
  
  // Stattdessen verwenden wir einen Timer, der um Mitternacht ausgelöst wird
  const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
  const currentTime = new Date();
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 1, 0, 0); // 00:01 Uhr
  
  const millisecondsUntilMidnight = tomorrow.getTime() - currentTime.getTime();
  
  // Speichere den Timer in AsyncStorage für persistente Updates
  AsyncStorage.setItem('WATER_REMINDER_NEXT_UPDATE', tomorrow.toISOString());
  
  console.log(`Nächste Aktualisierung in ${Math.round(millisecondsUntilMidnight / 60000)} Minuten geplant`);

  console.log(`Smarte Wassererinnerungen für heute geplant (${notificationCounter} Erinnerungen)`);
};

/**
 * Alle Wassererinnerungen löschen
 */
export const cancelWaterReminders = async (): Promise<void> => {
  const scheduledNotifications = await getScheduledNotifications();
  
  // Nur Wassererinnerungen filtern und löschen
  const waterReminders = scheduledNotifications.filter((notification) => 
    notification.identifier?.startsWith('water_reminder_')
  );
  
  for (const notification of waterReminders) {
    if (notification.identifier) {
      await cancelNotification(notification.identifier);
    }
  }

  console.log(`${waterReminders.length} Wassererinnerungen gelöscht`);
};

/**
 * Status der Wassererinnerungen aktualisieren (aktivieren/deaktivieren)
 */
export const toggleWaterReminders = async (enabled: boolean): Promise<void> => {
  // Aktuelle Konfiguration laden
  const config = await loadWaterReminderSettings();
  
  // Status aktualisieren
  config.enabled = enabled;
  
  // Neue Konfiguration speichern
  await saveWaterReminderSettings(config);
  
  // Benachrichtigungen planen oder alle löschen
  if (enabled) {
    await scheduleWaterReminders(config);
  } else {
    await cancelWaterReminders();
  }
  
  // Bei Aktivierung auch das Update für Mitternacht planen
  if (enabled) {
    const nextUpdate = new Date();
    nextUpdate.setDate(nextUpdate.getDate() + 1);
    nextUpdate.setHours(0, 1, 0, 0); // 00:01 Uhr
    AsyncStorage.setItem('WATER_REMINDER_NEXT_UPDATE', nextUpdate.toISOString());
  } else {
    // Bei Deaktivierung das Update löschen
    AsyncStorage.removeItem('WATER_REMINDER_NEXT_UPDATE');
  }
};
