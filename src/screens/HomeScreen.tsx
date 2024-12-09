import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Modal
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import MLKitOcr from 'react-native-mlkit-ocr';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

interface HomeScreenProps {
  onNavigateToHistory: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToHistory }) => {
  const [scannedText, setScannedText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<Camera>(null);
  
  const device = useCameraDevice('back');

  useEffect(() => {
    // Request camera permission on mount
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      if (cameraPermission === 'denied') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan documents.');
      }
    })();
  }, []);

  const handlePDFUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      console.log('Selected PDF: ', res);
      Alert.alert('PDF Uploaded', `You selected ${res[0].name}`);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.error(err);
        Alert.alert('Error', 'An error occurred while picking the file.');
      }
    }
  };

  const handleCameraScan = async () => {
    setIsScanning(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePhoto();
      const uri = photo.path.startsWith('file://') ? photo.path : 'file://' + photo.path;

      // Process OCR
      const result = await MLKitOcr.detectFromUri(uri);
      const text = result.map((block) => block.text).join('');

      setScannedText(text);
      setIsScanning(false);
      Alert.alert('Success', 'Text scanned successfully');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while taking the picture.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal for scanning */}
      <Modal visible={isScanning} transparent={false}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {device && (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              device={device}
              isActive={true}
              photo={true}
            />
          )}
         
        <View style={{position:'absolute', bottom: 50, alignSelf:'center'}}>
          <TouchableOpacity
            onPress={takePicture}
            style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Capture</Text>
          </TouchableOpacity>
        </View>
          <TouchableOpacity
            onPress={() => setIsScanning(false)}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              backgroundColor: '#fff',
              padding: 10,
              borderRadius: 8
            }}
          >
            <Text style={{ fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>UniScan</Text>
        <Text style={styles.headerSubtitle}>Smart Document Scanner & Summarizer</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.scanButton]}
            onPress={handleCameraScan}
          >
            <Text style={styles.actionEmoji}>📸</Text>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonText, styles.scanButtonText]}>Scan Document</Text>
              <Text style={[styles.actionDescription, styles.scanButtonDescription]}>
                Scan textbooks, research papers, or notes
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={handlePDFUpload}
          >
            <Text style={styles.actionEmoji}>📄</Text>
            <View style={styles.actionTextContainer}>
              <Text style={[styles.actionButtonText, styles.uploadButtonText]}>Import PDF</Text>
              <Text style={[styles.actionDescription, styles.uploadButtonDescription]}>
                Import existing PDF documents
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Display recognized text if available */}
        {scannedText !== '' && (
          <View style={{ padding: 16, backgroundColor: '#e5e7eb', borderRadius: 8, margin: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Scanned Text:</Text>
            <Text style={{ fontSize: 14, lineHeight: 20 }}>{scannedText}</Text>
          </View>
        )}

        {/* Document Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Document Types</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {['Research Papers', 'Textbooks', 'Lecture Notes', 'Articles', 'Study Guides'].map(
              (type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.categoryChip}
                  onPress={() => Alert.alert('Category', `Opening ${type}`)}
                >
                  <Text style={styles.categoryText}>{type}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>

        {/* Recent Scans */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity onPress={onNavigateToHistory}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.recentItem} onPress={onNavigateToHistory}>
            <View style={styles.recentIconBg}>
              <Text style={styles.recentEmoji}>📚</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Machine Learning Basics</Text>
              <Text style={styles.recentSubject}>Research Paper • 12 pages</Text>
              <Text style={styles.recentSummary}>Summary available</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.recentItem} onPress={onNavigateToHistory}>
            <View style={[styles.recentIconBg, { backgroundColor: '#FFE4E1' }]}>
              <Text style={styles.recentEmoji}>📖</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Data Structures Chapter 4</Text>
              <Text style={styles.recentSubject}>Textbook • 25 pages</Text>
              <Text style={styles.recentSummary}>Summary available</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featureTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={styles.featureText}>AI-Powered Summarization</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={styles.featureText}>Key Points Extraction</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🔍</Text>
              <Text style={styles.featureText}>Full Text Search</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain unchanged from previous code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  quickActions: {
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  uploadButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  actionEmoji: {
    fontSize: 24,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 48,
  },
  actionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  scanButtonText: {
    color: '#ffffff',
  },
  uploadButtonText: {
    color: '#0f172a',
  },
  actionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  scanButtonDescription: {
    color: 'rgba(255,255,255,0.8)',
  },
  uploadButtonDescription: {
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 16,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  categoryChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryText: {
    color: '#0f172a',
    fontWeight: '500',
    fontSize: 14,
  },
  recentSection: {
    backgroundColor: '#ffffff',
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  viewAllText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recentEmoji: {
    fontSize: 24,
  },
  recentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  recentSubject: {
    fontSize: 14,
    color: '#64748b',
  },
  recentSummary: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
    fontWeight: '500',
  },
  featuresSection: {
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureEmoji: {
    fontSize: 20,
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
    marginLeft: 12,
  },
  categoriesSection: {
    marginTop: 20,
    marginBottom: 24,
  },
});

export default HomeScreen;
