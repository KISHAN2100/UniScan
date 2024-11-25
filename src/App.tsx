import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import DocumentPicker from 'react-native-document-picker';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'history' | 'profile'>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigateToHistory={() => setCurrentScreen('history')} />;
      case 'history':
        return <HistoryScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return (
          <EditProfileScreen 
            onLogin={(email: string, password: string) => {
              console.log('Login:', email, password);
              // Implement your login logic here
            }} 
            onSignUp={(email: string, password: string) => {
              console.log('Sign Up:', email, password);
              // Implement your signup logic here
            }} 
          />
        );
      default:
        return <HomeScreen onNavigateToHistory={() => setCurrentScreen('history')} />;
    }
  };

  const handleImportPDF = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });
      console.log('PDF selected:', res);
      // Handle the selected PDF file here
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.error('Error picking PDF:', err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.navItem}>
          <Text style={styles.navText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('history')} style={styles.navItem}>
          <Text style={styles.navText}>📄 Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('profile')} style={styles.navItem}>
          <Text style={styles.navText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#2C3E50',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default App;
