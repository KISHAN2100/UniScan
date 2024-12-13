// src/screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { auth } from '../firebaseConfig'; // Ensure this import is correct
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { ref, set } from 'firebase/database';
import { useTheme } from '../context/ThemeContext';

interface EditProfileScreenProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: (email: string, password: string, userDetails: any) => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onLogin, onSignUp }) => {
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const validateInputs = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and Password are required.');
      return false;
    }
    if (!isLogin) {
      if (!name || !studentId) {
        Alert.alert('Error', 'Name and Student ID are required for sign-up.');
        return false;
      }
      if (isNaN(Number(studentId))) {
        Alert.alert('Error', 'Student ID must be numeric.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateInputs()) {
      if (isLogin) {
        onLogin(email, password);
      } else {
        const userDetails = { name, studentId };
        await onSignUp(email, password, userDetails);
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const userRef = ref(db, `users/${userId}`);
          set(userRef, userDetails)
            .then(() => {
              console.log('User details stored in Firebase Realtime Database');
            })
            .catch((error) => {
              console.error('Error storing user details:', error);
              Alert.alert('Error', 'Failed to store user details in Firebase Realtime Database');
            });
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        theme === 'light' ? styles.lightBackground : styles.darkBackground
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[
          styles.formContainer,
          theme === 'light' ? styles.lightCard : styles.darkCard
        ]}>
          <Text style={[
            styles.title,
            theme === 'light' ? styles.lightText : styles.darkText
          ]}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Text>

          {/* Email */}
          <TextInput
            style={[
              styles.input,
              theme === 'light' ? styles.lightInput : styles.darkInput
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email Address"
            keyboardType="email-address"
            placeholderTextColor={theme === 'light' ? '#888' : '#ccc'}
          />

          {/* Password with toggle */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                theme === 'light' ? styles.lightInput : styles.darkInput
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              placeholderTextColor={theme === 'light' ? '#888' : '#ccc'}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleButtonText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Fields */}
          {!isLogin && (
            <>
              <TextInput
                style={[
                  styles.input,
                  theme === 'light' ? styles.lightInput : styles.darkInput
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor={theme === 'light' ? '#888' : '#ccc'}
              />
              <TextInput
                style={[
                  styles.input,
                  theme === 'light' ? styles.lightInput : styles.darkInput
                ]}
                value={studentId}
                onChangeText={setStudentId}
                placeholder="University Student ID"
                keyboardType="numeric"
                maxLength={15}
                placeholderTextColor={theme === 'light' ? '#888' : '#ccc'}
              />
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              theme === 'light' ? styles.lightSubmitButton : styles.darkSubmitButton
            ]}
            onPress={handleSubmit}
          >
            <Text style={[
              styles.submitButtonText,
              // Keeping the submit text always white for a nice contrast
              { color: '#fff' }
            ]}>
              {isLogin ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Between Login & Sign Up */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={[
              styles.toggleText,
              theme === 'light' ? styles.lightToggleText : styles.darkToggleText
            ]}>
              {isLogin ? 'Don’t have an account? Sign Up' : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Root container
  container: {
    flex: 1,
  },
  lightBackground: {
    backgroundColor: '#F5F7FA',
  },
  // Dark mode background set to a deeper shade for better contrast
  darkBackground: {
    backgroundColor: '#121212',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  // Form Container
  formContainer: {
    borderRadius: 10,
    padding: 20,
    // Default styles for light mode (if not overridden)
    backgroundColor: '#fff',
    // Light mode elevation/shadow
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Keep light card the same
  lightCard: {
    backgroundColor: '#ffffff',
  },
  // Dark card with no shadow & darker background
  darkCard: {
    backgroundColor: '#1f1f1f',
    elevation: 0,
    shadowOpacity: 0,
  },

  // Title
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    // color overridden by theme-based style
  },

  // Theme-based text colors
  lightText: {
    color: '#1f2937',
  },
  darkText: {
    color: '#f0f0f0',
  },

  // Input Fields
  input: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    // Light mode default
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lightInput: {
    backgroundColor: '#f9f9f9',
    color: '#1f2937',
  },
  // Dark mode inputs
  darkInput: {
    backgroundColor: '#3c3c3c',
    color: '#f0f0f0',
    shadowOpacity: 0, // Remove shadow in dark mode
    elevation: 0,
  },

  // Password Container
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 60, // Space for the toggle button
  },
  toggleButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  toggleButtonText: {
    color: '#3498DB',
    fontWeight: '600',
  },

  // Submit Button
  submitButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  lightSubmitButton: {
    backgroundColor: '#3498DB',
  },
  // Dark mode accent color for the button
  darkSubmitButton: {
    backgroundColor: '#1565C0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Toggle text (login / sign-up)
  toggleText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  lightToggleText: {
    color: '#3498DB',
  },
  darkToggleText: {
    color: '#4FC3F7',
  },
});

export default EditProfileScreen;
