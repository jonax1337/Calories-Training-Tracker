// Sound-Implementierung für Web, iOS und Android
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Caches für geladene Sounds
const soundCache: { [key: string]: Audio.Sound } = {};

// Globaler AudioContext für Web, wird lazy initialisiert
let audioContext: AudioContext | null = null;

// Flag, das angibt, ob wir auf einer Web-Plattform sind
const isWeb = Platform.OS === 'web';

// Initialisiert den AudioContext für Web, wenn nötig
function getAudioContext(): AudioContext | null {
  if (!isWeb) return null;
  
  if (audioContext === null) {
    try {
      // @ts-ignore - AudioContext ist im Browser verfügbar, aber nicht immer in TypeScript-Definitionen
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Web Audio API wird nicht unterstützt:', error);
      return null;
    }
  }
  return audioContext;
}

// Initialisiere Audio auf nativen Plattformen
async function initNativeAudio() {
  if (isWeb) return; // Nur für native Plattformen
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,  // Korrekter Property-Name
      staysActiveInBackground: true,
    });
  } catch (error) {
    console.warn('Fehler beim Initialisieren von Expo Audio:', error);
  }
}

// Lade die Sound-Ressourcen beim Start
initNativeAudio();

// Erzeugt einen Beep-Sound mit angegebener Frequenz, Dauer und Lautstärke
// Web-Version nutzt Web Audio API, mobile Version verwendet vorgeladene Sounds
export function playBeep(frequency: number, duration: number, volume: number = 1.0): void {
  if (isWeb) {
    // Web-Version mit Audio API
    const context = getAudioContext();
    if (!context) return;
    
    try {
      // Oszillator erstellen (Tongenerator)
      const oscillator = context.createOscillator();
      oscillator.type = 'sine'; // Sinuswelle für einen reinen Ton
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      
      // Gain Node für Lautstärke
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(volume, context.currentTime);
      
      // Fade-Out am Ende für sanfteren Klang
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration / 1000);
      
      // Verbindungen herstellen
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Sound starten und stoppen
      oscillator.start();
      oscillator.stop(context.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Fehler beim Abspielen des Web-Sounds:', error);
    }
  } else {
    // Native Version mit Expo Audio
    // Wir verwenden vorgeladene Sounds aus Assets
    // Frequenzbereiche gruppieren und entsprechende Sounds zuordnen
    let soundName = '';
    
    if (frequency <= 500) soundName = 'low';  // Tiefe Töne (z.B. 440 Hz)
    else if (frequency <= 700) soundName = 'mid';  // Mittlere Töne (z.B. 523-659 Hz)
    else soundName = 'high'; // Hohe Töne (z.B. 880 Hz)
    
    playNativeSound(soundName, volume);
  }
}

// Spielt einen vordefinierten Sound auf nativen Plattformen
async function playNativeSound(soundName: string, volume: number = 1.0) {
  if (isWeb) return;
  
  try {
    // Cache-Schlüssel für den Sound
    const cacheKey = `${soundName}_${volume}`;
    
    // Sound aus Cache laden oder neu erstellen
    if (!soundCache[cacheKey]) {
      let source;
      
      // Wir erstellen die Sounds dynamisch mit einer URL statt Assets
      // Das ermöglicht uns, ohne physische Audio-Dateien zu arbeiten
      let soundUrl;
      
      // Diese Sound-URLs nutzen eine kostenlose Online-Service
      // In einer Produktionsapp sollten lokale Dateien verwendet werden
      switch (soundName) {
        case 'work':
          // Ein höherer Ton für die Arbeitsphase
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3' };
          break;
        case 'rest':
          // Ein mittlerer Ton für die Ruhephase
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-interface-hint-notification-911.mp3' };
          break;
        case 'complete':
          // Ein freundlicher Sound für den Abschluss
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3' };
          break;
        case 'countdown':
          // Ein kurzer Beep für den Countdown
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' };
          break;
        case 'high':
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3' };
          break;
        case 'mid':
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3' };
          break;
        case 'low':
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-tech-click-1141.mp3' };
          break;
        default:
          soundUrl = { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' };
      }
      
      source = soundUrl;
      
      // Sound laden
      const sound = new Audio.Sound();
      await sound.loadAsync(source);
      await sound.setVolumeAsync(volume);
      soundCache[cacheKey] = sound;
    }
    
    // Sound abspielen
    if (soundCache[cacheKey]) {
      // Sound zurücksetzen und abspielen
      try {
        await soundCache[cacheKey].stopAsync();
        await soundCache[cacheKey].setPositionAsync(0);
        await soundCache[cacheKey].playAsync();
      } catch (error) {
        console.warn(`Fehler beim Abspielen von ${soundName}:`, error);
      }
    }
  } catch (error) {
    console.warn(`Fehler beim Abspielen des nativen Sounds ${soundName}:`, error);
  }
}

// Arbeitsphase: Höherer, intensiverer Ton (A5)
export function playWorkSound(): void {
  if (isWeb) {
    // 880 Hz = A5, lauter und etwas länger
    playBeep(880, 300, 0.7);
    
    // Zweiter, kurzer Ton kurz danach für mehr Aufmerksamkeit
    setTimeout(() => playBeep(988, 150, 0.5), 350); // B5
  } else {
    // Für native Apps den speziellen Work-Sound abspielen
    playNativeSound('work', 1.0);
  }
}

// Ruhephase: Mittlerer, sanfterer Ton (A4)
export function playRestSound(): void {
  if (isWeb) {
    // 440 Hz = A4, mittlere Lautstärke
    playBeep(440, 350, 0.5);
  } else {
    // Für native Apps den speziellen Rest-Sound abspielen
    playNativeSound('rest', 0.8);
  }
}

// Abschluss: Aufsteigender Ton-Sequence (C-E-G, C-Dur-Akkord)
export function playCompleteSound(): void {
  if (isWeb) {
    // C5
    playBeep(523, 200, 0.6);
    
    // E5 nach kurzer Verzögerung
    setTimeout(() => playBeep(659, 200, 0.6), 250);
    
    // G5 nach weiterer Verzögerung
    setTimeout(() => playBeep(784, 400, 0.7), 500);
  } else {
    // Für native Apps den speziellen Complete-Sound abspielen
    playNativeSound('complete', 1.0);
  }
}

// Kurzer Countdown-Beep (für letzte Sekunden einer Phase)
export function playCountdownBeep(): void {
  if (isWeb) {
    playBeep(1000, 100, 0.3);
  } else {
    playNativeSound('countdown', 0.5);
  }
}
