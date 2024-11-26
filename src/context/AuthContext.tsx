import React, { createContext, useContext, useState, ReactNode } from 'react';
import { auth } from '../firebaseConfig'; // Ensure this import is correct
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import the function
import firestore from '@react-native-firebase/firestore'; // Import Firestore
import { Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import the function

interface AuthContextType {
  user: any; // You can define a more specific type based on your user object
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, userDetails: any) => Promise<void>; // Accept user details
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Call the function directly
      setUser(userCredential.user);
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  const signUp = async (email: string, password: string, userDetails: any) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Use auth directly
      setUser(userCredential.user);

      // Store user details in Firestore
      await firestore().collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email, // Store email
        ...userDetails, // Spread other user details
      });
    } catch (error) {
      console.error('Error signing up:', error); // Log the error
      Alert.alert('Error', 'An error occurred while signing up'); // Show an alert with the error message
    }
  };

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