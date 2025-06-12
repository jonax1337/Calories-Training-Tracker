import React, { useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { createSoundWebViewStyles } from '../../styles/components/webview/sound-webview-styles';
import { useTheme } from '../../theme/theme-context';

// Event-Funktionstypen
type SoundEventCallback = () => void;
type SoundEventType = 'ready' | 'soundPlayed' | 'error';

// Event-Listener-Verwaltung
const listeners: {
  [event in SoundEventType]?: SoundEventCallback[];
} = {};

// Sound-Befehle
export type SoundCommand = 
  | { type: 'playBeep'; frequency: number; duration: number; volume: number; }
  | { type: 'playWorkSound'; }
  | { type: 'playRestSound'; }
  | { type: 'playCompleteSound'; }
  | { type: 'playSuccessPing'; }  // Neuer kurzer Erfolgssound
  | { type: 'playCountdownBeep'; };

// Eine statische Referenz zur WebView-Instanz
let webViewRef: WebView | null = null;

// WebView HTML mit Audio-Funktionalität
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sound Generator</title>
  <style>
    body { margin: 0; background: transparent; }
    #status { color: white; display: none; }
  </style>
</head>
<body>
  <div id="status">Audio System Ready</div>
  
  <script>
    // Audio Context initialisieren
    let audioContext = null;
    
    function initAudio() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'error', 
          message: 'AudioContext konnte nicht initialisiert werden: ' + error.message 
        }));
      }
    }
    
    // Beep-Sound abspielen
    function playBeep(frequency, duration, volume = 1.0) {
      if (!audioContext) return;
      
      try {
        // Oszillator erstellen
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        // Gain Node für Lautstärke
        const gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        
        // Fade-Out für sanfteren Klang
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        // Verbindungen herstellen
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Sound starten und stoppen
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration / 1000);
        
        // Feedback senden
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'soundPlayed' }));
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'error', 
          message: 'Fehler beim Abspielen: ' + error.message 
        }));
      }
    }
    
    // Arbeitsphase-Sound
    function playWorkSound() {
      // 880 Hz = A5, lauter und etwas länger
      playBeep(880, 300, 0.75);
      
      // Zweiter, kurzer Ton kurz danach
      setTimeout(() => playBeep(988, 150, 1.0), 350);
    }
    
    // Ruhephase-Sound
    function playRestSound() {
      // 440 Hz = A4, mittlere Lautstärke
      playBeep(440, 350, 0.75);
    }
    
    // Abschluss-Sound
    function playCompleteSound() {
      // C5
      playBeep(523, 200, 0.5);
      
      // E5 nach kurzer Verzögerung
      setTimeout(() => playBeep(659, 200, 0.75), 250);
      
      // G5 nach weiterer Verzögerung
      setTimeout(() => playBeep(784, 400, 1.0), 500);
    }
    
    // Kurzer Erfolgs-Ping (schnell und knapp)
    function playSuccessPing() {
      // D6 (1175Hz) mit kurzer Dauer und etwas leiserer Lautstärke
      playBeep(1175, 80, 0.4);
    }
    
    // Countdown-Beep
    function playCountdownBeep() {
      playBeep(1000, 100, 0.5);
    }
    
    // Nachrichten von React Native empfangen
    document.addEventListener('message', function(event) {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'playBeep':
          playBeep(message.frequency, message.duration, message.volume);
          break;
        case 'playWorkSound':
          playWorkSound();
          break;
        case 'playRestSound':
          playRestSound();
          break;
        case 'playCompleteSound':
          playCompleteSound();
          break;
        case 'playSuccessPing':
          playSuccessPing();
          break;
        case 'playCountdownBeep':
          playCountdownBeep();
          break;
      }
    });
    
    // Audio-System initialisieren
    initAudio();
    
    // WebView bereit melden
    document.addEventListener('DOMContentLoaded', function() {
      if (audioContext === null) {
        initAudio();
      }
    });
    
    // Auf Benutzerinteraktion reagieren (notwendig für einige Browser)
    document.body.addEventListener('touchstart', function() {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
    });
  </script>
</body>
</html>
`;

// Statisches Flag zur Prüfung, ob die WebView bereit ist
let isWebViewReady = false;

// Queue für Befehle, die vor der Bereitschaft der WebView gesendet wurden
const commandQueue: SoundCommand[] = [];

// Funktion zum Hinzufügen eines Event-Listeners
export function addSoundEventListener(event: SoundEventType, callback: SoundEventCallback) {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event]?.push(callback);
}

// Funktion zum Entfernen eines Event-Listeners
export function removeSoundEventListener(event: SoundEventType, callback: SoundEventCallback) {
  if (!listeners[event]) return;
  const index = listeners[event]?.indexOf(callback) ?? -1;
  if (index !== -1) {
    listeners[event]?.splice(index, 1);
  }
}

// Funktion zum Auslösen eines Events
function triggerEvent(event: SoundEventType) {
  if (!listeners[event]) return;
  listeners[event]?.forEach(callback => callback());
}

// Funktion zum Senden eines Befehls an die WebView
export function sendSoundCommand(command: SoundCommand) {
  if (!isWebViewReady) {
    // Befehl in die Warteschlange stellen, wenn WebView noch nicht bereit
    commandQueue.push(command);
    return;
  }
  
  if (webViewRef) {
    webViewRef.injectJavaScript(`
      (function() {
        document.dispatchEvent(new MessageEvent('message', {
          data: '${JSON.stringify(command)}'
        }));
        true;
      })();
    `);
  }
}

// Die unsichtbare WebView-Komponente
const SoundWebView: React.FC = () => {
  const { theme } = useTheme();
  const styles = createSoundWebViewStyles(theme);
  const localWebViewRef = useRef<WebView>(null);
  
  // WebView-Referenz bei Montage setzen
  useEffect(() => {
    if (localWebViewRef.current) {
      webViewRef = localWebViewRef.current;
    }
    
    return () => {
      webViewRef = null;
      isWebViewReady = false;
    };
  }, []);
  
  // Nachrichtenverarbeitung von der WebView
  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'ready') {
        isWebViewReady = true;
        triggerEvent('ready');
        
        // Wartende Befehle abarbeiten
        while (commandQueue.length > 0) {
          const command = commandQueue.shift();
          if (command) sendSoundCommand(command);
        }
      } else if (data.type === 'soundPlayed') {
        triggerEvent('soundPlayed');
      } else if (data.type === 'error') {
        console.warn('SoundWebView Error:', data.message);
        triggerEvent('error');
      }
    } catch (error) {
      console.warn('Fehler beim Parsen der WebView-Nachricht:', error);
    }
  };
  
  // Wir rendern die WebView nur, wenn wir nicht im Web sind
  // Im Web können wir die Web Audio API direkt verwenden
  if (Platform.OS === 'web') {
    return null;
  }
  
  return (
    <View style={styles.hiddenContainer}>
      <WebView
        ref={localWebViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        style={styles.hiddenWebView}
      />
    </View>
  );
};

export default SoundWebView;
