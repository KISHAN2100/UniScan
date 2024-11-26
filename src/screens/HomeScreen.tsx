import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { Camera,useCameraDevice, useCameraDevices } from 'react-native-vision-camera';
import { useState } from 'react';
interface HomeScreenProps {
  onNavigateToHistory: () => void;
}



const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToHistory }) => {
 
  const handlePDFUplod = async ()=> {
    try{
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      console.log('Selected PDF: ', res);
      Alert.alert('PDF Uploaded', `You selected ${res[0].name}`);
  }catch(err){
    if(DocumentPicker.isCancel(err)){
  console.log('User cancelled the picker');
    }else{
      console.error(err);
      Alert.alert('Error', 'An error occurred while picking the file.');
    }
  }
  }

  const handleCameraScan = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL('content://media/internal/images/media');
      } else {
        await Linking.openURL('photos-redirect://');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open camera. Please check your camera app.');
    }
  };


  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.actionButtonText}>Scan Document</Text>
            <Text style={styles.actionDescription}>Scan textbooks, research papers, or notes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.uploadButton]}
            onPress={(handlePDFUplod) }
          >
            <Text style={styles.actionEmoji}>📄</Text>
            <Text style={styles.actionButtonText}>Import PDF</Text>
            <Text style={styles.actionDescription}>Import existing PDF documents</Text>
          </TouchableOpacity>
        </View>

        {/* Document Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Document Types</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {[
              'Research Papers',
              'Textbooks',
              'Lecture Notes',
              'Articles',
              'Study Guides'
            ].map((type) => (
              <TouchableOpacity 
                key={type}
                style={styles.categoryChip}
                onPress={() => Alert.alert('Category', `Opening ${type}`)}
              >
                <Text style={styles.categoryText}>{type}</Text>
              </TouchableOpacity>
            ))}
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
          
          <TouchableOpacity 
            style={styles.recentItem}
            onPress={onNavigateToHistory}
          >
            <View style={styles.recentIconBg}>
              <Text style={styles.recentEmoji}>📚</Text>
            </View>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Machine Learning Basics</Text>
              <Text style={styles.recentSubject}>Research Paper • 12 pages</Text>
              <Text style={styles.recentSummary}>Summary available</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.recentItem}
            onPress={onNavigateToHistory}
          >
            <View style={[styles.recentIconBg, {backgroundColor: '#FFE4E1'}]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#2C3E50',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B8C2CC',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickActions: {
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scanButton: {
    backgroundColor: '#3498DB',
  },
  uploadButton: {
    backgroundColor: '#2ECC71',
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#E0E0FF',
  },
  categoriesSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoryChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    color: '#3498DB',
    fontWeight: '500',
  },
  recentSection: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#3498DB',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentIconBg: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentEmoji: {
    fontSize: 24,
  },
  recentInfo: {
    marginLeft: 15,
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  recentSubject: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  recentSummary: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 2,
  },
  featuresSection: {
    backgroundColor: '#2C3E50',
    borderRadius: 15,
    padding: 16,
    marginVertical: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#ECF0F1',
  },
});

export default HomeScreen;