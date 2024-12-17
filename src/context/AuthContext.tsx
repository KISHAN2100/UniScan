import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, userDetails: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      console.error('Error logging in:', error);
      Alert.alert('Login Error', error.message || 'Invalid email or password');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Success', 'Logged out successfully!');
    } catch (error: any) {
      console.error('Error logging out:', error);
      Alert.alert('Logout Error', error.message || 'An error occurred while logging out');
    }
  };

  const signUp = async (email: string, password: string, userDetails: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      // Store user details in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        ...userDetails,
      });

      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      console.error('Error signing up:', error);
      Alert.alert('Sign-Up Error', error.message || 'An error occurred while signing up');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  if (initializing) {
    // You can return a loading indicator here if desired
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 