import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/ThemeContext';
import { createWaveAnimationStyles } from '../../styles/components/ui/WaveAnimationStyles';

interface WaveAnimationProps {
  fillPercentage: number; // 0 to 100
  color?: string;
  text?: string;
  icon?: React.ReactNode;
  textColor?: string;
}

// Statischer HTML Content außerhalb der Komponente - wird NIE neu erstellt
const STATIC_HTML_CONTENT = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Google Fonts für Space Grotesk -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            pointer-events: none !important;
        }
        
        body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        }
        
        .hero_area {
            position: relative;
            width: 100%;
            height: 160px;
            background: linear-gradient(135deg, #2196F320, #2196F310);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .water-level {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0%;
            background-color: #2196F3;
            transition: height 0.8s cubic-bezier(0.23, 1, 0.32, 1);
            overflow: hidden;
        }
        
        .bubbles {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }
        
        .bubble {
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            animation: bubbleUp linear infinite;
            opacity: 0;
        }
        
        .bubble:nth-child(1) {
            left: 10%;
            width: 2px;
            height: 2px;
            animation-duration: 2.5s;
            animation-delay: 0s;
        }
        
        .bubble:nth-child(2) {
            left: 20%;
            width: 6px;
            height: 6px;
            animation-duration: 4.5s;
            animation-delay: 0.5s;
        }
        
        .bubble:nth-child(3) {
            left: 35%;
            width: 3px;
            height: 3px;
            animation-duration: 2.8s;
            animation-delay: 1s;
        }
        
        .bubble:nth-child(4) {
            left: 50%;
            width: 8px;
            height: 8px;
            animation-duration: 5.5s;
            animation-delay: 0.2s;
        }
        
        .bubble:nth-child(5) {
            left: 65%;
            width: 4px;
            height: 4px;
            animation-duration: 3.2s;
            animation-delay: 1.2s;
        }
        
        .bubble:nth-child(6) {
            left: 80%;
            width: 5px;
            height: 5px;
            animation-duration: 4.8s;
            animation-delay: 0.8s;
        }
        
        .bubble:nth-child(7) {
            left: 90%;
            width: 2px;
            height: 2px;
            animation-duration: 2.2s;
            animation-delay: 1.5s;
        }
        
        .bubble:nth-child(8) {
            left: 25%;
            width: 7px;
            height: 7px;
            animation-duration: 6s;
            animation-delay: 2s;
        }
        
        .bubble:nth-child(9) {
            left: 75%;
            width: 3px;
            height: 3px;
            animation-duration: 2.7s;
            animation-delay: 0.3s;
        }
        
        .bubble:nth-child(10) {
            left: 45%;
            width: 5px;
            height: 5px;
            animation-duration: 3.8s;
            animation-delay: 1.8s;
        }
        
        .bubble:nth-child(11) {
            left: 15%;
            width: 4px;
            height: 4px;
            animation-duration: 3.5s;
            animation-delay: 0.7s;
        }
        
        .bubble:nth-child(12) {
            left: 55%;
            width: 2px;
            height: 2px;
            animation-duration: 2.3s;
            animation-delay: 1.3s;
        }
        
        .bubble:nth-child(13) {
            left: 85%;
            width: 6px;
            height: 6px;
            animation-duration: 4.2s;
            animation-delay: 0.9s;
        }
        
        .bubble:nth-child(14) {
            left: 30%;
            width: 3px;
            height: 3px;
            animation-duration: 2.9s;
            animation-delay: 2.1s;
        }
        
        .bubble:nth-child(15) {
            left: 70%;
            width: 7px;
            height: 7px;
            animation-duration: 5.2s;
            animation-delay: 0.4s;
        }
        
        .bubble:nth-child(16) {
            left: 5%;
            width: 2px;
            height: 2px;
            animation-duration: 2.1s;
            animation-delay: 1.6s;
        }
        
        .bubble:nth-child(17) {
            left: 95%;
            width: 4px;
            height: 4px;
            animation-duration: 3.3s;
            animation-delay: 0.1s;
        }
        
        .bubble:nth-child(18) {
            left: 40%;
            width: 5px;
            height: 5px;
            animation-duration: 4.1s;
            animation-delay: 1.4s;
        }
        
        .bubble:nth-child(19) {
            left: 60%;
            width: 3px;
            height: 3px;
            animation-duration: 2.6s;
            animation-delay: 0.6s;
        }
        
        .bubble:nth-child(20) {
            left: 12%;
            width: 8px;
            height: 8px;
            animation-duration: 5.8s;
            animation-delay: 2.3s;
        }
        
        @keyframes bubbleUp {
            0% {
                bottom: -10px;
                opacity: 0;
                transform: translateX(0);
            }
            15% {
                opacity: 1;
            }
            50% {
                opacity: 0.75;
            }
            85% {
                opacity: 0.0;
            }
            100% {
                bottom: 100%;
                opacity: 0;
                transform: translateX(20px);
            }
        }
        
        .waves {
            position: absolute;
            width: 100%;
            height: 15vh;
            min-height: 40px;
            max-height: 60px;
            bottom: 9%;
            left: 0;
            transform: translateY(50%);
            transition: bottom 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .parallax > use {
            animation: move-forever 25s cubic-bezier(.55, .5, .45, .5) infinite;
        }
        
        .parallax > use:nth-child(1) {
            animation-delay: -2s;
            animation-duration: 7s;
        }
        
        .parallax > use:nth-child(2) {
            animation-delay: -3s;
            animation-duration: 10s;
        }
        
        .parallax > use:nth-child(3) {
            animation-delay: -4s;
            animation-duration: 13s;
        }
        
        .parallax > use:nth-child(4) {
            animation-delay: -5s;
            animation-duration: 20s;
        }
        
        @keyframes move-forever {
            0% {
                transform: translate3d(-90px, 0, 0);
            }
            100% {
                transform: translate3d(85px, 0, 0);
            }
        }
        
        .content-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            z-index: 10;
            display: none;
        }
        
        .text {
            font-size: 24px;
            font-weight: 600;
            color: #2196F3;
            text-align: center;
            margin-bottom: 5px;
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: -0.2px;
        }
        
        @media (max-width: 768px) {
            .waves {
                height: 30px;
                min-height: 30px;
            }
        }
    </style>
</head>
<body>
    <div class="hero_area">
        <div class="water-level">
            <div class="bubbles">
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
                <div class="bubble"></div>
            </div>
        </div>
        <svg class="waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
            <defs>
                <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g class="parallax">
                <use xlink:href="#gentle-wave" x="48" y="0" fill="#2196F370" />
                <use xlink:href="#gentle-wave" x="48" y="3" fill="#2196F350" />
                <use xlink:href="#gentle-wave" x="48" y="5" fill="#2196F330" />
                <use xlink:href="#gentle-wave" x="48" y="7" fill="#2196F3" />
            </g>
        </svg>
        <div class="content-overlay">
            <div class="text"></div>
        </div>
    </div>
    
    <script>
        let isInitialized = false;
        
        // Listener für postMessage von React Native
        window.addEventListener('message', function(event) {
            try {
                eval(event.data);
            } catch (e) {
                console.error('Script execution error:', e);
            }
        });
        
        // Für Android
        document.addEventListener('message', function(event) {
            try {
                eval(event.data);
            } catch (e) {
                console.error('Script execution error:', e);
            }
        });
        
        // Teile React Native mit, dass WebView geladen ist
        window.onload = function() {
            isInitialized = true;
            // Signal für React Native, dass WebView bereit ist
            try {
                window.ReactNativeWebView.postMessage('webview_loaded');
            } catch (e) {
                // Fallback falls ReactNativeWebView nicht verfügbar
                console.log('WebView loaded');
            }
        };
    </script>
</body>
</html>
`;

const WaveAnimation = ({
  fillPercentage,
  color = '#2196F3',
  text,
  icon,
  textColor = '#2196F3'
}: WaveAnimationProps) => {
  const { theme } = useTheme();
  const styles = createWaveAnimationStyles(theme);
  const webViewRef = useRef<WebView>(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  
  // Sicherstellen, dass der Füllstand zwischen 0 und 100% liegt
  const actualFillPercentage = Math.min(Math.max(fillPercentage, 0), 100);
  
  // Dynamische Blubberblasen-Berechnung - exponentiell steigend
  const getBubbleSettings = (fillPercentage: number) => {
    if (fillPercentage < 5) return { count: 0, maxSize: 2, speedMultiplier: 2.0 };
    
    // Exponentielle Kurve für natürliche Skalierung
    const normalized = fillPercentage / 100; // 0 bis 1
    
    // Anzahl: exponentiell von 0 bis 10 (bei 100%)
    const expCount = Math.pow(normalized, 1.5) * 10;
    const count = Math.round(Math.max(0, Math.min(10, expCount)));
    
    // Maximale Größe: exponentiell von 2px bis 6px
    const expSize = 2 + Math.pow(normalized, 1.2) * 4;
    const maxSize = Math.round(Math.max(2, Math.min(6, expSize)));
    
    // Geschwindigkeit: exponentiell langsamer bei mehr Wasser
    const expSpeed = 1.8 - Math.pow(normalized, 0.8) * 0.9;
    const speedMultiplier = Math.max(0.9, Math.min(1.8, expSpeed));
    
    return { count, maxSize, speedMultiplier };
  };
  
  const bubbleSettings = getBubbleSettings(actualFillPercentage);
  
  // WebView source mit useMemo um Neuladungen zu verhindern
  const webViewSource = useMemo(() => ({ html: STATIC_HTML_CONTENT }), []);
  
  // Update Wasserpegel ohne Animation neu zu starten
  useEffect(() => {
    if (webViewRef.current && webViewLoaded) {
      const script = `
        const waterLevel = document.querySelector('.water-level');
        const waves = document.querySelector('.waves');
        if (waterLevel && waves) {
          waterLevel.style.height = '${actualFillPercentage}%';
          waves.style.bottom = '${actualFillPercentage + 9}%';
        }
        true;
      `;
      webViewRef.current.postMessage(script);
    }
  }, [actualFillPercentage, webViewLoaded]);

  // Update Blubberblasen - ohne Animation-Neustart, nur opacity und clipping
  useEffect(() => {
    if (webViewRef.current && webViewLoaded) {
      const script = `
        const bubbles = document.querySelectorAll('.bubble');
        const fillPercentage = ${actualFillPercentage};
        const settings = ${JSON.stringify(bubbleSettings)};
        
        // Exponentielle travel-height basierend auf Füllstand
        const normalizedFill = fillPercentage / 100;
        const travelHeight = Math.pow(normalizedFill, 0.6) * 100; // 0% bis 100% travel
        const fadeOutStart = Math.max(60, 80 + Math.pow(normalizedFill, 2) * 20); // Fade-out timing
        
        bubbles.forEach((bubble, index) => {
          if (index < settings.count) {
            // Aktive Blase - nur opacity und clipping ändern, KEINE animation properties
            
            // Smooth fade-in
            bubble.style.opacity = '1';
            
            // Travel-height clipping - verhindert vorzeitiges Verschwinden
            const clipPath = 'inset(0 0 ' + (100 - travelHeight) + '% 0)';
            bubble.style.clipPath = clipPath;
            
            // Intensität basierend auf Füllstand (Background wird nicht geändert während Animation)
            const intensity = Math.min(fillPercentage / 100, 1);
            const opacity = 0.15 + (intensity * 0.35); // 0.15 bis 0.5 opacity
            
            // Nur Background-Color ändern, nicht die Animation
            if (bubble.style.animationPlayState !== 'running') {
              bubble.style.background = 'rgba(255, 255, 255, ' + opacity + ')';
            }
            
          } else {
            // Inaktive Blase - smooth fade-out
            bubble.style.opacity = '0';
            bubble.style.clipPath = 'inset(0 0 0 0)'; // Reset clipping
          }
        });
        true;
      `;
      webViewRef.current.postMessage(script);
    }
  }, [actualFillPercentage, bubbleSettings, webViewLoaded]);

  // Update color wenn sich die Farbe ändert
  useEffect(() => {
    if (webViewRef.current && webViewLoaded) {
      const script = `
        const waterLevel = document.querySelector('.water-level');
        const heroArea = document.querySelector('.hero_area');
        const waveUses = document.querySelectorAll('.parallax use');
        
        if (waterLevel) {
          waterLevel.style.backgroundColor = '${color}';
        }
        if (heroArea) {
          heroArea.style.background = 'linear-gradient(135deg, ${color}20, ${color}10)';
        }
        if (waveUses.length >= 4) {
          waveUses[0].setAttribute('fill', '${color}70');
          waveUses[1].setAttribute('fill', '${color}50');
          waveUses[2].setAttribute('fill', '${color}30');
          waveUses[3].setAttribute('fill', '${color}');
        }
        true;
      `;
      webViewRef.current.postMessage(script);
    }
  }, [color, webViewLoaded]);

  // Update text wenn sich der Text oder die Textfarbe ändert
// Update text wenn sich der Text oder die Textfarbe ändert
useEffect(() => {
  if (webViewRef.current && webViewLoaded) {
    const script = `
      const contentOverlay = document.querySelector('.content-overlay');
      const textElement = document.querySelector('.text');
      
      if (contentOverlay && textElement) {
        if ('${text}' && '${text}' !== 'undefined') {
          contentOverlay.style.display = 'flex';
          textElement.textContent = '${text || ''}';
          
          // Setze die Textformatierung
          textElement.style.color = '${textColor}';
          textElement.style.fontFamily = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          textElement.style.fontWeight = '600';  // Semi-Bold für bessere Lesbarkeit
          textElement.style.fontSize = '24px';
          textElement.style.letterSpacing = '-0.2px'; // Typisch für moderne App-Designs
          
          // Passe den Schatten an - heller/dunkler je nach Theme
          const isLightText = '${textColor}'.toLowerCase().includes('fff') || 
                              '${textColor}'.toLowerCase().includes('white');
          textElement.style.textShadow = isLightText 
            ? '0 1px 2px rgba(0,0,0,0.3)' 
            : '0 1px 2px rgba(255,255,255,0.3)';
        } else {
          contentOverlay.style.display = 'none';
        }
      }
      true;
    `;
    webViewRef.current.postMessage(script);
  }
}, [text, textColor, webViewLoaded]);

  // Update text wenn sich der Text ändert
  useEffect(() => {
    if (webViewRef.current && webViewLoaded) {
      const script = `
        const contentOverlay = document.querySelector('.content-overlay');
        const textElement = document.querySelector('.text');
        
        if (contentOverlay && textElement) {
          if ('${text}' && '${text}' !== 'undefined') {
            contentOverlay.style.display = 'flex';
            textElement.textContent = '${text || ''}';
          } else {
            contentOverlay.style.display = 'none';
          }
        }
        true;
      `;
      webViewRef.current.postMessage(script);
    }
  }, [text, webViewLoaded]);

  // Je nach Plattform unterschiedliche Implementierung verwenden
  if (Platform.OS === 'web') {
    // Direkt das HTML für Web-Browser einbetten
    return (
      <View style={styles.container}>
        <WebWaveAnimation 
          fillPercentage={actualFillPercentage} 
          color={color} 
          text={text} 
          textColor={textColor} 
        />
        {/* Icon overlay falls vorhanden */}
        {icon && (
          <View style={styles.iconOverlay}>
            {icon}
          </View>
        )}
      </View>
    );
  }
  
  // Mobile Implementierung mit WebView
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={webViewSource}
        style={styles.webview}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scalesPageToFit={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="compatibility"
        androidLayerType="hardware"
        onShouldStartLoadWithRequest={() => true}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'webview_loaded') {
            setWebViewLoaded(true);
          }
        }}
        onLoadEnd={() => {
          // Fallback falls onMessage nicht funktioniert
          setTimeout(() => setWebViewLoaded(true), 100);
        }}
      />
      {/* Icon overlay falls vorhanden */}
      {icon && (
        <View style={styles.iconOverlay}>
          {icon}
        </View>
      )}
    </View>
  );
};


// Web-spezifische Implementierung der Wave-Animation
interface WebWaveAnimationProps {
  fillPercentage: number;
  color?: string;
  text?: string;
  textColor?: string;
}

const WebWaveAnimation = ({ fillPercentage, color = '#2196F3', text, textColor = '#2196F3' }: WebWaveAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Container mit dem HTML füllen
    const container = containerRef.current;
    container.innerHTML = '';
    
    // Hero-Bereich erstellen
    const heroArea = document.createElement('div');
    heroArea.className = 'hero_area';
    heroArea.style.cssText = `
      position: relative;
      width: 100%;
      height: 160px;
      background: linear-gradient(135deg, ${color}20, ${color}10);
      border-radius: 8px;
      overflow: hidden;
    `;
    
    // Wasser-Level
    const waterLevel = document.createElement('div');
    waterLevel.className = 'water-level';
    waterLevel.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: ${fillPercentage}%;
      background-color: ${color};
      transition: height 0.8s cubic-bezier(0.23, 1, 0.32, 1);
      overflow: hidden;
    `;
    
    // Bubbles container
    const bubbles = document.createElement('div');
    bubbles.className = 'bubbles';
    bubbles.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `;
    
    // Bubble-Animationen per CSS - jetzt mit korrekter Animation für Web
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bubbleUp {
        0% { transform: translateY(0); opacity: 0; }
        20% { opacity: 0.8; }
        80% { opacity: 0.6; }
        100% { transform: translateY(-120%); opacity: 0; }
      }
      
      .bubble {
        position: absolute;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        animation: bubbleUp linear infinite;
        bottom: 0;
      }
    `;
    document.head.appendChild(style);
    
    // Bubbles hinzufügen - mehr Blasen für besseren visuellen Effekt
    const bubbleCount = Math.max(5, Math.floor(fillPercentage / 8)); // Mindestens 5 Blasen
    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 90 + 5;
      const animDuration = Math.random() * 3 + 2;
      const delay = Math.random() * 2;
      
      bubble.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${animDuration}s;
        animation-delay: ${delay}s;
        opacity: 0.8;
        will-change: transform;
        transform: translateZ(0);
      `;
      
      bubbles.appendChild(bubble);
    }
    
    // SVG für die Wellen
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "waves");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("viewBox", "0 24 150 28");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("shape-rendering", "auto");
    svg.style.cssText = `
      position: absolute;
      bottom: ${fillPercentage + 9}%;
      left: 0;
      width: 100%;
      height: 50px;
      z-index: 5;
    `;
    
    // SVG Defs
    const defs = document.createElementNS(svgNS, "defs");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", "gentle-wave");
    path.setAttribute("d", "M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z");
    defs.appendChild(path);
    
    // SVG Parallax Group
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "parallax");
    
    // 4 Wellenebenen mit unterschiedlicher Transparenz
    const use1 = document.createElementNS(svgNS, "use");
    use1.setAttribute("xlink:href", "#gentle-wave");
    use1.setAttribute("x", "48");
    use1.setAttribute("y", "0");
    use1.setAttribute("fill", `${color}70`);
    
    const use2 = document.createElementNS(svgNS, "use");
    use2.setAttribute("xlink:href", "#gentle-wave");
    use2.setAttribute("x", "48");
    use2.setAttribute("y", "3");
    use2.setAttribute("fill", `${color}50`);
    
    const use3 = document.createElementNS(svgNS, "use");
    use3.setAttribute("xlink:href", "#gentle-wave");
    use3.setAttribute("x", "48");
    use3.setAttribute("y", "5");
    use3.setAttribute("fill", `${color}30`);
    
    const use4 = document.createElementNS(svgNS, "use");
    use4.setAttribute("xlink:href", "#gentle-wave");
    use4.setAttribute("x", "48");
    use4.setAttribute("y", "7");
    use4.setAttribute("fill", color);
    
    // Wellen hinzufügen
    g.appendChild(use1);
    g.appendChild(use2);
    g.appendChild(use3);
    g.appendChild(use4);
    
    svg.appendChild(defs);
    svg.appendChild(g);
    
    // CSS-Animationen für die Wellen - Optimiert für Web-Browser
    const waveStyle = document.createElement('style');
    waveStyle.textContent = `
      @keyframes wave-move-forever {
        0% { transform: translate3d(-90px, 0, 0); }
        100% { transform: translate3d(85px, 0, 0); }
      }
      
      .parallax > use {
        animation: wave-move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
        will-change: transform;
      }
      .parallax > use:nth-child(1) {
        animation-delay: -2s;
        animation-duration: 7s;
      }
      .parallax > use:nth-child(2) {
        animation-delay: -3s;
        animation-duration: 10s;
      }
      .parallax > use:nth-child(3) {
        animation-delay: -4s;
        animation-duration: 13s;
      }
      .parallax > use:nth-child(4) {
        animation-delay: -5s;
        animation-duration: 20s;
      }
    `;
    document.head.appendChild(waveStyle);
    
    // Content Overlay für Text
    const contentOverlay = document.createElement('div');
    contentOverlay.className = 'content-overlay';
    contentOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
    `;
    
    // Text Element
    if (text) {
      const textElement = document.createElement('div');
      textElement.className = 'text';
      textElement.textContent = text;
      textElement.style.cssText = `
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        font-size: 24px;
        color: ${textColor};
        letter-spacing: -0.2px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      `;
      contentOverlay.appendChild(textElement);
    } else {
      contentOverlay.style.display = 'none';
    }
    
    // Alles zusammenfügen
    waterLevel.appendChild(bubbles);
    heroArea.appendChild(waterLevel);
    heroArea.appendChild(svg);
    heroArea.appendChild(contentOverlay);
    
    // In den Container einfügen
    container.appendChild(heroArea);
    
    // Sofort Animationen starten
    requestAnimationFrame(() => {
      // Force repaint für bessere Animation-Performance
      heroArea.style.opacity = '0.99';
      setTimeout(() => {
        heroArea.style.opacity = '1';
      }, 10);
    });
  }, [fillPercentage, color, text, textColor]);
  
  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: 160,
        borderRadius: 8,
        overflow: 'hidden',
      }} 
    />
  );
};

export default WaveAnimation;