import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import { createStackNavigator } from '@react-navigation/stack';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword , signInWithEmailAndPassword} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from './firebaseConfig';

const Stack = createStackNavigator();
// Initialize Firestore

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'home' | 'history' | 'profile'>('splash');
  

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('home');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

 
  const [user, setUser] = useState<any>(null);

  const handleLogin = async (email: string, password: string) => {
    try{
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Logged in as:', user.email);
      setUser(user.email);
      Alert.alert('Success','Logged in successfully!');
    }catch(error: any){
      console.log('login error', error.message);
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User registered:', user.email);
      setUser(user.email);
      setCurrentScreen('home');
      Alert.alert('Success', 'Account created succesfully!');
    } catch (error:any) {
      console.error('Sign-up:', error.message);
      Alert.alert('Sign-up Failed', error.message);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'home':
        return <HomeScreen onNavigateToHistory={() => setCurrentScreen('history')} />;
      case 'history':
        return <HistoryScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return (
          <EditProfileScreen 
            onLogin={handleLogin}
            onSignUp={handleSignUp}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      {currentScreen !== 'splash' && (
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