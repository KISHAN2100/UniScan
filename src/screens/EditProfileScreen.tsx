import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { auth } from '../firebaseConfig'; // Ensure this import is correct
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { ref, set } from 'firebase/database';

const EditProfileScreen: React.FC<{ onLogin: (email: string, password: string) => void; onSignUp: (email: string, password: string, userDetails: any) => void; }> = ({ onLogin, onSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [contact, setContact] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const validateInputs = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and Password are required.');
      return false;
    }
    if (!isLogin) {
      if (!name || !studentId || !contact) {
        Alert.alert('Error', 'All fields are required for sign-up.');
        return false;
      }
      if (isNaN(Number(studentId)) || isNaN(Number(contact))) {
        Alert.alert('Error', 'Student ID and Contact must be numeric.');
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
        const userDetails = {
          name,
          studentId,
          contact,
        };
        await onSignUp(email, password, userDetails); // Pass user details to onSignUp
        const user = auth.currentUser;
        if(user){
          const userId = user.uid;
          const userRef = ref(db, `users/${userId}`);
          set(userRef, userDetails).then(() => {
            console.log('User details stored in Firebase Realtime Database');
          }).catch((error) => {
            console.error('Error storing user details:', error);
            Alert.alert('Error', 'Failed to store user details in Firebase Realtime Database');
          });
        }
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email Address"
        keyboardType="email-address"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPassword(!showPassword)}>
          <Text>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
          />
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="University Student ID"
            keyboardType="numeric"
            maxLength={15}
          />
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="Contact Number"
            keyboardType="numeric"
            maxLength={15}
          />
        </>
      )}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? 'Don’t have an account? Sign Up' : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#34495E',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  toggleButton: {
    position: 'absolute',
    right: 10,
    top: 15,
    padding: 10,
    zIndex: 1,
  },
  submitButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#3498DB',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default EditProfileScreen; 