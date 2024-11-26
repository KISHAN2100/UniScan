import React, { createContext, useContext, useState, ReactNode } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // Import Firestore

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
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    setUser(userCredential.user);
  };

  const logout = async () => {
    await auth().signOut();
    setUser(null);
  };

  const signUp = async (email: string, password: string, userDetails: any) => {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    setUser(userCredential.user);

    // Store user details in Firestore
    await firestore().collection('users').doc(userCredential.user.uid).set({
      email: userCredential.user.email,
      ...userDetails, // Spread other user details
    });
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