// Einheitliche Sound-Implementierung für Web, iOS und Android mit WebView
import { Platform } from 'react-native';
import { sendSoundCommand, SoundCommand } from '../components/webview/SoundWebView';

// Flag, das angibt, ob wir auf einer Web-Plattform sind
const isWeb = Platform.OS === 'web';

// Globaler AudioContext für Web, wird lazy initialisiert
let audioContext: AudioContext | null = null;

// Initialisiert den AudioContext für Web, wenn nötig (nur für direkten Web-Zugriff)
function getAudioContext(): AudioContext | null {
  if (audioContext === null && isWeb) {
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

// Erzeugt einen Beep-Sound mit angegebener Frequenz, Dauer und Lautstärke
// Im Web direkt mit Web Audio API, auf iOS/Android über eine WebView
export function playBeep(frequency: number, duration: number, volume: number = 1.0): void {
  if (isWeb) {
    // Direkte Web-Version mit Audio API
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
    // Auf iOS/Android an die WebView delegieren
    const command: SoundCommand = {
      type: 'playBeep',
      frequency,
      duration,
      volume
    };
    sendSoundCommand(command);
  }
}

// Arbeitsphase: Höherer, intensiverer Ton (A5)
export function playWorkSound(): void {
  if (isWeb) {
    // 880 Hz = A5, lauter und etwas länger
    playBeep(880, 300, 0.75);
    
    // Zweiter, kurzer Ton kurz danach für mehr Aufmerksamkeit
    setTimeout(() => playBeep(988, 150, 1.0), 350); // B5
  } else {
    // Für native Apps an die WebView delegieren
    sendSoundCommand({ type: 'playWorkSound' });
  }
}

// Ruhephase: Mittlerer, sanfterer Ton (A4)
export function playRestSound(): void {
  if (isWeb) {
    // 440 Hz = A4, mittlere Lautstärke
    playBeep(440, 350, 0.75);
  } else {
    // Für native Apps an die WebView delegieren
    sendSoundCommand({ type: 'playRestSound' });
  }
}

// Abschluss: Aufsteigender Ton-Sequence (C-E-G, C-Dur-Akkord)
export function playCompleteSound(): void {
  if (isWeb) {
    // C5
    playBeep(523, 200, 0.5);
    
    // E5 nach kurzer Verzögerung
    setTimeout(() => playBeep(659, 200, 0.75), 250);
    
    // G5 nach weiterer Verzögerung
    setTimeout(() => playBeep(784, 400, 1.0), 500);
  } else {
    // Für native Apps an die WebView delegieren
    sendSoundCommand({ type: 'playCompleteSound' });
  }
}

// Kurzer Countdown-Beep (für letzte Sekunden einer Phase)
export function playCountdownBeep(): void {
  if (isWeb) {
    playBeep(1000, 100, 0.5);
  } else {
    // Für native Apps an die WebView delegieren
    sendSoundCommand({ type: 'playCountdownBeep' });
  }
}
