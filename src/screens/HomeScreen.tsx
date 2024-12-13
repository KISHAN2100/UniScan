// src/screens/HomeScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
  Share,
  Clipboard,
} from 'react-native';
import MLKitOcr from 'react-native-mlkit-ocr';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useTheme } from '../context/ThemeContext';

interface HomeScreenProps {
  onNavigateToHistory?: () => void;
  onNavigateToTextDisplay: (
    text: string,
    uri: string,
    type: 'document' | 'camera' | 'image'
  ) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToHistory,
  onNavigateToTextDisplay,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [scannedText, setScannedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      if (cameraPermission === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to scan documents.'
        );
      }
    })();

    // Removed the Appearance listener to allow manual theme toggle
  }, []);

  const handlePDFUpload = async () => {
    try {
      // Implement PDF upload logic here.
      const fileUri = 'file:///path/to/uploaded/document.pdf'; // Replace with actual URI

      setIsProcessing(true);

      try {
        const result = await MLKitOcr.detectFromUri(fileUri);
        const text = result.map((block) => block.text).join('\n');
        setScannedText(text);
        Alert.alert('Success', `Extracted text from PDF`);
        onNavigateToTextDisplay(text, fileUri, 'document');
      } catch (error) {
        console.error('Error processing PDF:', error);
        Alert.alert('Error', 'An error occurred while processing the PDF.');
      } finally {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while uploading the PDF.');
    }
  };

  const handleCameraScan = () => {
    setScannedText('');
    setIsScanning(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePhoto();
      const uri = photo.path.startsWith('file://') ? photo.path : 'file://' + photo.path;

      Alert.alert(
        'Confirm Photo',
        'Do you want to use this photo or retake it?',
        [
          {
            text: 'Retake',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Use Photo',
            onPress: async () => {
              try {
                setIsProcessing(true);
                const result = await MLKitOcr.detectFromUri(uri);
                const text = result.map((block) => block.text).join('\n');

                setScannedText(text);
                setIsScanning(false);
                setIsProcessing(false);
                Alert.alert('Success', 'Text scanned successfully');
                onNavigateToTextDisplay(text, uri, 'camera');
              } catch (err) {
                console.error(err);
                setIsProcessing(false);
                Alert.alert('Error', 'An error occurred while processing the photo.');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while taking the picture.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: scannedText,
      });
    } catch (error) {
      console.log('Error sharing text:', error);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(scannedText);
    Alert.alert('Copied', 'Scanned text has been copied to clipboard.');
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Text',
      'Are you sure you want to clear the scanned text?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => setScannedText(''),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        theme === 'light' ? styles.lightContainer : styles.darkContainer,
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          theme === 'light' ? styles.lightHeader : styles.darkHeader,
        ]}
      >
        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.headerTitle,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            🚀 UniScan
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              theme === 'light' ? styles.lightSubtitle : styles.darkSubtitle,
            ]}
          >
            Next-Gen Document Scanner
          </Text>
        </View>
        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.themeToggle}
          accessibilityLabel="Toggle Theme"
        >
          <Text style={styles.themeToggleText}>
            {theme === 'light' ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View
        style={[
          styles.quickActions,
          theme === 'light' ? styles.lightCard : styles.darkCard,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            theme === 'light' ? styles.lightActionButton : styles.darkActionButton,
          ]}
          onPress={handleCameraScan}
          accessibilityLabel="Scan Document"
        >
          <Text style={styles.actionEmoji}>📷</Text>
          <Text
            style={[
              styles.actionButtonText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            theme === 'light' ? styles.lightActionButton : styles.darkActionButton,
          ]}
          onPress={handlePDFUpload}
          accessibilityLabel="Import PDF"
        >
          <Text style={styles.actionEmoji}>📁</Text>
          <Text
            style={[
              styles.actionButtonText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Import PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scanned Text Display */}
      {scannedText !== '' ? (
        <View
          style={[
            styles.scannedTextContainer,
            theme === 'light' ? styles.lightCard : styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.scannedTextTitle,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            📝 Scanned Text:
          </Text>
          <ScrollView style={styles.textScroll}>
            <Text
              style={[
                styles.scannedText,
                theme === 'light' ? styles.lightText : styles.darkText,
              ]}
            >
              {scannedText}
            </Text>
          </ScrollView>
          <View style={styles.textActionContainer}>
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Share Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                🔗 Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Copy Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                📋 Copy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              style={[
                styles.textActionButton,
                theme === 'light'
                  ? styles.lightActionButtonSecondary
                  : styles.darkActionButtonSecondary,
              ]}
              accessibilityLabel="Clear Scanned Text"
            >
              <Text
                style={[
                  styles.textActionButtonText,
                  theme === 'light' ? styles.lightButtonText : styles.darkButtonText,
                ]}
              >
                🗑️ Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.emptyStateContainer,
            theme === 'light' ? styles.lightCard : styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.emptyStateText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Start by scanning a document or importing a PDF to extract text.
          </Text>
        </View>
      )}

      {/* Camera Modal */}
      <Modal visible={isScanning} transparent={false} animationType="slide">
        <View
          style={[
            styles.cameraContainer,
            theme === 'light' ? styles.lightContainer : styles.darkContainer,
          ]}
        >
          {device && (
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={true}
              photo={true}
            />
          )}

          {/* Overlay Frame */}
          <View style={styles.overlayContainer}>
            <View
              style={[
                styles.overlayFrame,
                theme === 'light' ? styles.lightOverlay : styles.darkOverlay,
              ]}
            />
            <Text
              style={[
                styles.cameraInstruction,
                theme === 'light' ? styles.lightText : styles.darkText,
              ]}
            >
              Align the document within the frame
            </Text>
          </View>

          {/* Capture Button */}
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              onPress={takePicture}
              style={[
                styles.captureButton,
                theme === 'light'
                  ? styles.lightCaptureButton
                  : styles.darkCaptureButton,
              ]}
              accessibilityLabel="Capture Photo"
            >
              <Text
                style={[
                  styles.captureButtonText,
                  theme === 'light'
                    ? styles.lightCaptureButtonText
                    : styles.darkCaptureButtonText,
                ]}
              >
                📸
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setIsScanning(false)}
            style={styles.closeButton}
            accessibilityLabel="Close Camera"
          >
            <Text
              style={[
                styles.closeButtonText,
                theme === 'light' ? styles.lightCloseButtonText : styles.darkCloseButtonText,
              ]}
            >
              ❌
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View
          style={[
            styles.processingOverlay,
            theme === 'light' ? styles.lightProcessingOverlay : styles.darkProcessingOverlay,
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme === 'light' ? '#00ffea' : '#3b82f6'}
          />
          <Text
            style={[
              styles.processingText,
              theme === 'light' ? styles.lightText : styles.darkText,
            ]}
          >
            Processing...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#121212', // Dark background
  },
  lightContainer: {
    backgroundColor: '#f0f4f7', // Light background
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  lightHeader: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  darkSubtitle: {
    color: '#9ca3af',
  },
  lightSubtitle: {
    color: '#6b7280',
  },
  themeToggle: {
    padding: 10,
    marginLeft: 10,
  },
  themeToggleText: {
    fontSize: 24,
  },
  quickActions: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#00ffea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  lightCard: {
    backgroundColor: '#ffffff',
  },
  actionButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    width: '45%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  darkActionButton: {
    backgroundColor: '#2c2c2c',
    borderWidth: 1,
    borderColor: '#00ffea',
  },
  lightActionButton: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scannedTextContainer: {
    flex: 1,
    padding: 25,
    margin: 20,
    borderRadius: 20,
    shadowColor: '#00ffea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  scannedTextTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
  },
  scannedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  textScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  textActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  textActionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  darkActionButtonSecondary: {
    backgroundColor: '#00ffea',
  },
  lightActionButtonSecondary: {
    backgroundColor: '#3b82f6',
  },
  textActionButtonText: {
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
  },
  darkButtonText: {
    color: '#1e1e1e',
  },
  lightButtonText: {
    color: '#ffffff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 18,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 234, 0.1)',
  },
  darkOverlay: {
    borderColor: '#00ffea',
  },
  lightOverlay: {
    borderColor: '#3b82f6',
  },
  cameraInstruction: {
    position: 'absolute',
    bottom: -40,
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 20,
    fontWeight: '600',
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  captureButton: {
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  darkCaptureButton: {
    backgroundColor: '#00ffea',
  },
  lightCaptureButton: {
    backgroundColor: '#3b82f6',
  },
  captureButtonText: {
    fontSize: 28,
  },
  darkCaptureButtonText: {
    color: '#1e1e1e',
  },
  lightCaptureButtonText: {
    color: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 25,
  },
  closeButtonText: {
    fontSize: 30,
  },
  darkCloseButtonText: {
    color: '#ff005e', // Neon red for dark mode
  },
  lightCloseButtonText: {
    color: '#ff005e', // Neon red works on light background as well
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkProcessingOverlay: {
    backgroundColor: 'rgba(0, 255, 234, 0.8)',
  },
  lightProcessingOverlay: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  processingText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '700',
  },
});

export default HomeScreen;