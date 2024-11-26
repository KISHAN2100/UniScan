import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SplashScreen from './screens/SplashScreen';
import DocumentPicker from 'react-native-document-picker';

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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
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
});

export default App;
