import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import DocumentPicker from 'react-native-document-picker';
import { createStackNavigator } from '@react-navigation/stack';
const Stack = createStackNavigator();


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'home' | 'history' | 'profile'>('splash');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScreen('home');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
        return null;
    }
    const [user, setUser] = useState<any>(null);
    const handleLogin = async (email: string, password: string) => {
        setUser(email);
    };
    const handleSignUp = async (email: string, password: string) => {
        setUser(email);
    };
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
