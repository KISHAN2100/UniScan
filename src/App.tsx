import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import TextDisplayScreen from './screens/TextDisplayScreen';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';
import ProfileScreen from './screens/ProfileScreen';
import { ScanItem } from './context/types';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'home' | 'history' | 'profile' | 'textDisplay'>('splash');
  // Store the currently authenticated Firebase user object
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // State for scanned items
  const [scanHistory, setScanHistory] = useState<ScanItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);

  // **1) Show SplashScreen for 3 seconds, then go to Home**
  useEffect(() => {
    const timer = setTimeout(() => setCurrentScreen('home'), 3000);
    return () => clearTimeout(timer);
  }, []);

  // **2) Listen for Auth State changes (this ensures 'stay logged in')**
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is logged in:', user);
        setFirebaseUser(user);
      } else {
        console.log('No user is logged in');
        setFirebaseUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // **3) Handle Login**
  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in successfully!');
      setCurrentScreen('home');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  // **4) Handle Sign Up**
  const handleSignUp = async (email: string, password: string, userDetails: any) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created successfully!');
      setCurrentScreen('home');
    } catch (error: any) {
      console.error('Sign-up error:', error);
      Alert.alert('Sign-up Failed', error.message);
    }
  };

  // **5) Handle Logout**
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentScreen('profile'); // We'll switch back to profile, which triggers login page if no user
    } catch (error: any) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  // **6) Navigation & Scan Logic**
  const handleNavigateToTextDisplay = (text: string, uri: string, type: 'document' | 'camera' | 'image') => {
    const newScan: ScanItem = {
      id: generateUniqueId(),
      title: type === 'document' ? 'Imported PDF' : 'Camera Scan',
      date: new Date().toLocaleString(),
      type,
      status: 'completed',
      uri,
    };
    setScanHistory(prev => [newScan, ...prev]);
    setSelectedScan(newScan);
    setCurrentScreen('textDisplay');
  };

  const handleNavigateBackToHome = () => setCurrentScreen('home');

  const handleSelectScan = (scan: ScanItem) => {
    setSelectedScan(scan);
    setCurrentScreen('textDisplay');
  };

  const handleDeleteScan = (id: string) => {
    setScanHistory(prev => prev.filter(scan => scan.id !== id));
    Alert.alert('Deleted', 'Scan has been deleted from history.');
  };

  // Unique ID generator
  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // **7) Render Screens** based on state
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
        // If the user is null => Show EditProfileScreen
        // If the user is not null => Show ProfileScreen
        return firebaseUser ? (
          <ProfileScreen onLogout={handleLogout} />
        ) : (
          <EditProfileScreen onLogin={handleLogin} onSignUp={handleSignUp} />
        );
      case 'textDisplay':
        return (
          selectedScan && (
            <TextDisplayScreen
              scanItem={selectedScan}
              onBack={handleNavigateBackToHome}
            />
          )
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Bottom navigation bar, hidden on Splash & TextDisplay */}
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
