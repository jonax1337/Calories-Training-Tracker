import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createFeedbackStyles } from '../styles/screens/FeedbackStyles';
import { Bug, Brain, MessageCircleQuestion, Image as ImageIcon, Trash2, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';

// Feedback-Typen
type FeedbackType = 'bug' | 'feature' | 'other';

type FeedbackScreenProps = StackScreenProps<RootStackParamList, 'Feedback'>;

export default function FeedbackScreen({ navigation }: FeedbackScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createFeedbackStyles(theme);

  // States für das Feedback-Formular
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [errors, setErrors] = useState<{
    email?: string;
    subject?: string;
    message?: string;
    attachments?: string;
  }>({});

  // Animation state management
  const animationTriggered = useRef<boolean>(false);
  const [showAnimations, setShowAnimations] = useState(false);

  // Focus detection for smooth animations
  useFocusEffect(
    React.useCallback(() => {
      // Reset animation state when screen is focused
      animationTriggered.current = false;
      setShowAnimations(false);
      
      // Wait for screen to be properly in focus, then trigger animations
      const focusTimer = setTimeout(() => {
        if (!animationTriggered.current) {
          animationTriggered.current = true;
          setShowAnimations(true);
        }
      }, 150); // Short delay to ensure smooth focus transition

      return () => {
        clearTimeout(focusTimer);
      };
    }, [])
  );

  // Validierung des Formulars
  const validateForm = () => {
    let isValid = true;
    const newErrors: {
      email?: string;
      subject?: string;
      message?: string;
    } = {};

    // E-Mail ist optional, aber wenn angegeben, muss sie gültig sein
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Bitte gib eine gültige E-Mail-Adresse ein';
      isValid = false;
    }

    // Betreff ist erforderlich
    if (!subject.trim()) {
      newErrors.subject = 'Bitte gib einen Betreff ein';
      isValid = false;
    }

    // Nachricht ist erforderlich
    if (!message.trim() || message.length < 10) {
      newErrors.message = 'Bitte gib eine ausführliche Beschreibung ein';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Bilder anhängen
  const pickImage = async () => {
    // Berechtigungen prüfen
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Berechtigung erforderlich',
        'Um Bilder anhängen zu können, benötigen wir Zugriff auf deine Galerie.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Nur maximal 3 Bilder erlauben
    if (attachments.length >= 3) {
      Alert.alert(
        'Maximale Anzahl erreicht',
        'Du kannst maximal 3 Bilder anhängen.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Image Picker öffnen
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachments([...attachments, ...result.assets]);
    }
  };

  // Bild aus Anhängen entfernen
  const removeImage = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  // Absenden des Formulars
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Hier würden wir eigentlich die Daten an eine API senden
      // Simulieren eines API-Aufrufs mit Timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In einem echten Szenario würden wir hier die Bilder hochladen
      // const feedbackData = {
      //   type: feedbackType,
      //   email,
      //   subject,
      //   message,
      //   imageUrls: uploadedImageUrls // Nach dem Upload
      // };
      
      Alert.alert(
        'Feedback gesendet',
        'Vielen Dank für dein Feedback! Wir werden es so schnell wie möglich bearbeiten.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

      setSubmitted(true);
      
    } catch (error) {
      Alert.alert(
        'Fehler',
        'Beim Senden deines Feedbacks ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedbackTypeButton = (type: FeedbackType, label: string, IconComponent: React.ComponentType<any>) => {
    const isSelected = feedbackType === type;
    
    return (
      <TouchableOpacity 
        style={[
          styles.feedbackTypeButton,
          isSelected && styles.feedbackTypeButtonSelected
        ]}
        onPress={() => setFeedbackType(type)}
      >
        <IconComponent 
          size={theme.typography.fontSize.xl * 1.25}
          color={isSelected ? 'white' : theme.colors.text}
        />
        <Text 
          style={[
            styles.feedbackTypeText,
            isSelected && styles.feedbackTypeTextSelected
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ 
          padding: theme.spacing.m,
          paddingTop: theme.spacing.s,
          paddingBottom: Math.max(theme.spacing.m, insets.bottom)
        }}
      >
        {/* Show content only after animations are ready */}
        {showAnimations && (
          <>
            {/* Header Section */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={100}
            >
              <Text style={styles.sectionTitle}>Dein Feedback ist uns wichtig</Text>
              <Text style={styles.sectionDescription}>
                Hilf uns, die App zu verbessern, indem du Bugs meldest oder Vorschläge für neue Features machst.
              </Text>
            </Animatable.View>

            {/* Feedback Type Selection */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={200}
              style={styles.feedbackTypeContainer}
            >
              <View style={{ flex: 1}}>
                {renderFeedbackTypeButton('bug', 'Bug', Bug)}
              </View>
              <View style={{ flex: 1, marginHorizontal: theme.spacing.m }}>
                {renderFeedbackTypeButton('feature', 'Feature', Brain)}
              </View>
              <View style={{ flex: 1}}>
                {renderFeedbackTypeButton('other', 'Sonstiges', MessageCircleQuestion)}
              </View>
            </Animatable.View>

            {/* Subject Input */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={300}
            >
              <Text style={[styles.sectionTitle, { fontSize: theme.typography.fontSize.m }]}>Betreff *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                />
                {errors.subject ? <Text style={styles.errorText}>{errors.subject}</Text> : null}
              </View>
            </Animatable.View>

            {/* Message Input */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={400}
            >
              <Text style={[styles.sectionTitle, { fontSize: theme.typography.fontSize.m }]}>Beschreibung *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textArea}
                  value={message}
                  onChangeText={setMessage}
                  multiline={true}
                  numberOfLines={6}
                />
                {errors.message ? <Text style={styles.errorText}>{errors.message}</Text> : null}
              </View>
            </Animatable.View>

            {/* Attachments Section */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={500}
            >
              <Text style={[styles.sectionTitle, { fontSize: theme.typography.fontSize.m }]}>
                Anhänge (optional)
              </Text>
              <Text style={styles.sectionDescription}>
                Füge Screenshots oder andere Bilder hinzu, um dein Feedback zu erläutern (max. 3)
              </Text>

              <View style={styles.attachmentsContainer}>
                {attachments.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.attachmentImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Trash2 size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {attachments.length < 3 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <View style={styles.addImageButtonInner}>
                      <Plus size={theme.typography.fontSize.l} color={theme.colors.text} />
                      <Text style={styles.addImageText}>Bild hinzufügen</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>

            {/* Submit Button */}
            <Animatable.View 
              animation="fadeInUp"
              duration={600}
              delay={600}
            >
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={!feedbackType || !subject || !message || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Feedback senden</Text>
                )}
              </TouchableOpacity>
            </Animatable.View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
