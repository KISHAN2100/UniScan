// src/screens/TextDisplayScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Share,
  Clipboard,
  Dimensions,
  TextInput,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import MLKitOcr from 'react-native-mlkit-ocr';
import { ScanItem } from '../context/types';
import { useTheme } from '../context/ThemeContext';

interface TextDisplayScreenProps {
  scanItem: ScanItem;
  onBack: () => void;
}

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'or', name: 'Oriya' },
  { code: 'ne', name: 'Nepali' },
];

const GOOGLE_API_KEY = 'AIzaSyBaT-vLkTzPHlt2sC2HH4DKD0_vuUwwJkw'; // Replace with your actual API key

const TextDisplayScreen: React.FC<TextDisplayScreenProps> = ({ scanItem, onBack }) => {
  const { theme } = useTheme();
  const [scannedText, setScannedText] = useState<string>('');
  const [currentTranslation, setCurrentTranslation] = useState<{ language: string; text: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // We replace the horizontal ScrollView language selector with a modal-based picker
  const [isLanguagePickerVisible, setIsLanguagePickerVisible] = useState<boolean>(false);

  // For demonstration, default the selected language to the first in the list
  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages[0].code);

  useEffect(() => {
    const extractText = async () => {
      setIsProcessing(true);
      try {
        const result = await MLKitOcr.detectFromUri(scanItem.uri);
        const text = result.map(block => block.text).join('\n');
        setScannedText(text);
      } catch (error) {
        console.error('Error extracting text from scan:', error);
        Alert.alert('Error', 'An error occurred while extracting text from the scan.');
      } finally {
        setIsProcessing(false);
      }
    };
    extractText();
  }, [scanItem.uri]);

  // Handle language selection & translation
  const handleLanguageSelect = async (languageCode: string, languageName: string) => {
    // Save selected language
    setSelectedLanguage(languageCode);
    setIsLanguagePickerVisible(false); // close picker modal
    setIsTranslating(true);
    setCurrentTranslation(null);

    if (!scannedText.trim()) {
      Alert.alert('No Text', 'There is no text to translate.');
      setIsTranslating(false);
      return;
    }

    try {
      const requestBody = {
        q: scannedText,
        target: languageCode,
        format: 'text',
      };

      const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const translatedText = data?.data?.translations?.[0]?.translatedText;
      if (translatedText) {
        setCurrentTranslation({ language: languageName, text: translatedText });
      } else {
        throw new Error('Invalid response structure from Translation API.');
      }
    } catch (error: any) {
      console.error('Translation Error:', error.message);
      Alert.alert('Translation Failed', error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    Clipboard.setString(scannedText);
    Alert.alert('Copied', 'Text copied to clipboard.');
  };

  // Share
  const handleShare = async () => {
    try {
      const message = currentTranslation 
        ? `${currentTranslation.language}: ${currentTranslation.text}`
        : scannedText;

      await Share.share({ message });
    } catch (error: any) {
      console.error('Share Error:', error.message);
      Alert.alert('Share Failed', error.message);
    }
  };

  // Simple web search
  const handleSearch = () => {
    const query = encodeURIComponent(scannedText);
    const url = `https://www.google.com/search?q=${query}`;
    Linking.openURL(url);
  };

  // Toggle language picker modal
  const handleTranslateToggle = () => {
    setIsLanguagePickerVisible(!isLanguagePickerVisible);
  };

  // Render language list item
  const renderLanguageItem = ({ item }: { item: typeof languages[0] }) => (
    <TouchableOpacity
      style={[
        styles.langItem,
        theme === 'light' ? styles.lightCard : styles.darkCard,
        item.code === selectedLanguage && { backgroundColor: '#3b82f6' },
      ]}
      onPress={() => handleLanguageSelect(item.code, item.name)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.langItemText,
          theme === 'light' ? styles.lightText : styles.darkText,
          item.code === selectedLanguage && { color: '#ffffff' },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View 
      style={[
        styles.outerContainer, 
        theme === 'light' ? styles.lightBackground : styles.darkBackground
      ]}
    >
      
      {/* Header */}
      <View 
        style={[
          styles.header,
          theme === 'light' ? styles.lightCard : styles.darkCard
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text 
            style={[
              styles.backButtonText, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text 
          style={[
            styles.headerTitle, 
            theme === 'light' ? styles.lightText : styles.darkText
          ]}
        >
          OCR Text
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Scrolling Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Original Scanned Text */}
        <View 
          style={[
            styles.card, 
            theme === 'light' ? styles.lightCard : styles.darkCard
          ]}
        >
          <Text 
            style={[
              styles.sectionTitle, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            Extracted Text
          </Text>

          {isProcessing ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            <TextInput
              style={[
                styles.textInput, 
                theme === 'light' ? styles.lightTextInput : styles.darkTextInput
              ]}
              multiline
              value={scannedText}
              onChangeText={setScannedText}
              placeholder="Edit or review extracted text..."
              placeholderTextColor={theme === 'light' ? '#888' : '#ccc'}
            />
          )}
        </View>

        {/* Translated Text Section */}
        {isTranslating ? (
          <View 
            style={[
              styles.card, 
              theme === 'light' ? styles.lightCard : styles.darkCard
            ]}
          >
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : currentTranslation && (
          <View 
            style={[
              styles.card, 
              theme === 'light' ? styles.lightCard : styles.darkCard
            ]}
          >
            <Text 
              style={[
                styles.sectionTitle, 
                theme === 'light' ? styles.lightText : styles.darkText
              ]}
            >
              {currentTranslation.language}
            </Text>
            <Text 
              style={[
                styles.translatedText, 
                theme === 'light' ? styles.lightText : styles.darkText
              ]}
            >
              {currentTranslation.text}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View 
        style={[
          styles.bottomBar, 
          theme === 'light' ? styles.lightCard : styles.darkCard
        ]}
      >
        <TouchableOpacity 
          style={styles.bottomBarItem} 
          onPress={handleTranslateToggle}
          disabled={isTranslating || isProcessing}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.bottomIcon, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            🌐
          </Text>
          <Text 
            style={[
              styles.bottomLabel, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            Translate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomBarItem} 
          onPress={handleSearch}
          disabled={isTranslating || isProcessing}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.bottomIcon, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            🔎
          </Text>
          <Text 
            style={[
              styles.bottomLabel, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            Search
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomBarItem} 
          onPress={handleCopy}
          disabled={isTranslating || isProcessing}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.bottomIcon, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            📋
          </Text>
          <Text 
            style={[
              styles.bottomLabel, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            Copy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomBarItem} 
          onPress={handleShare}
          disabled={isTranslating || isProcessing}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.bottomIcon, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            🔗
          </Text>
          <Text 
            style={[
              styles.bottomLabel, 
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={isLanguagePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguagePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View 
            style={[
              styles.modalContainer,
              theme === 'light' ? styles.lightCard : styles.darkCard
            ]}
          >
            <Text 
              style={[
                styles.modalTitle,
                theme === 'light' ? styles.lightText : styles.darkText
              ]}
            >
              Select a language
            </Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={renderLanguageItem}
            />
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setIsLanguagePickerVisible(false)}
            >
              <Text style={[styles.modalCloseText, { color: '#3b82f6' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width: windowWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  lightBackground: {
    backgroundColor: '#F5F7FA',
  },
  darkBackground: {
    backgroundColor: '#1e1e1e',
  },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 2, // Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lightCard: {
    backgroundColor: '#ffffff',
  },
  darkCard: {
    backgroundColor: '#2c2c2c',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#3b82f6', 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerPlaceholder: {
    width: 24,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  translatedText: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
  },

  textInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  lightTextInput: {
    backgroundColor: '#f9f9f9',
    color: '#1f2937',
  },
  darkTextInput: {
    backgroundColor: '#3c3c3c',
    color: '#f0f0f0',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: windowWidth * 0.8,
    maxHeight: '70%',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  modalCloseText: {
    fontSize: 16,
  },

  // Language list item
  langItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 8,
  },
  langItemText: {
    fontSize: 15,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 64,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIcon: {
    fontSize: 20,
    color: '#3b82f6',
    marginBottom: 2,
  },
  bottomLabel: {
    fontSize: 12,
    color: '#333333',
  },

  // Theme-based text colors
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#1f2937',
  },
});

export default TextDisplayScreen;
