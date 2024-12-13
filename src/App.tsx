import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import TextDisplayScreen from './screens/TextDisplayScreen';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Ensure this is correctly set up
import { ScanItem } from './context/types'; // Import the ScanItem interface
import { ThemeProvider } from './context/ThemeContext';
const App: React.FC = () => {
  // Define the possible screens
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'home' | 'history' | 'profile' | 'textDisplay'>('splash');
  
  // State to hold the scanned text and selected scan
  const [scanHistory, setScanHistory] = useState<ScanItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);
  
  // User authentication state
  const [user, setUser] = useState<any>(null);

  // Navigate from splash to home after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('home');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Handle user login
  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Logged in as:', user.email);
      setUser(user.email);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      console.log('login error', error.message);
      Alert.alert('Login Failed', error.message);
    }
  };

  // Handle user sign-up
  const handleSignUp = async (email: string, password: string, userDetails: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User registered:', user.email);
      setUser(user.email);
      setCurrentScreen('home');
      Alert.alert('Success', 'Account created successfully!');
      
      // Store additional user details if needed
      // Example using Firebase Realtime Database
      // const userId = user.uid;
      // const userRef = ref(db, `users/${userId}`);
      // set(userRef, userDetails);
    } catch (error: any) {
      console.error('Sign-up:', error.message);
      Alert.alert('Sign-up Failed', error.message);
    }
  };

  // Handle navigation to TextDisplayScreen and add scan to history
  const handleNavigateToTextDisplay = (text: string, uri: string, type: 'document' | 'camera' | 'image') => {
    const newScan: ScanItem = {
      id: generateUniqueId(),
      title: type === 'document' ? 'Imported PDF' : 'Camera Scan',
      date: new Date().toLocaleString(),
      type,
      status: 'completed',
      uri,
    };
    setScanHistory(prevHistory => [newScan, ...prevHistory]);
    setSelectedScan(newScan);
    setCurrentScreen('textDisplay');
  };

  // Navigate back to home
  const handleNavigateBackToHome = () => {
    setCurrentScreen('home');
  };

  // Handle selection of a scan from history
  const handleSelectScan = (scan: ScanItem) => {
    setSelectedScan(scan);
    setCurrentScreen('textDisplay');
  };

  // Handle deletion of a scan from history
  const handleDeleteScan = (id: string) => {
    setScanHistory(prevHistory => prevHistory.filter(scan => scan.id !== id));
    Alert.alert('Deleted', 'Scan has been deleted from history.');
  };

  // Function to generate unique IDs without external libraries
  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Combines timestamp with a random number
  };

  // Render the appropriate screen based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'home':
        return (
          <HomeScreen
            onNavigateToHistory={() => setCurrentScreen('history')}
            onNavigateToTextDisplay={handleNavigateToTextDisplay}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onBack={() => setCurrentScreen('home')}
            scanHistory={scanHistory}
            onSelectScan={handleSelectScan}
            onDeleteScan={handleDeleteScan}
          />
        );
      case 'profile':
        return <EditProfileScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
      case 'textDisplay':
        return selectedScan ? (
          <TextDisplayScreen scanItem={selectedScan} onBack={handleNavigateBackToHome} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>
        {/* Conditionally render the default bottom navigation bar */}
        {currentScreen !== 'splash' && currentScreen !== 'textDisplay' && (
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
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
