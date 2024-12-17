// src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { auth } from '../firebaseConfig';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { useTheme } from '../context/ThemeContext';

interface UserDetails {
  name?: string;
  studentId?: string;
  email?: string;
}

// -- NEW: Accept onLogout from props --
interface ProfileScreenProps {
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { theme } = useTheme();
  const [userDetails, setUserDetails] = useState<UserDetails>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserDetails = useCallback(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const userId = user.uid;
    const userRef = ref(db, `users/${userId}`);

    onValue(
      userRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setUserDetails({
          name: data.name || '',
          studentId: data.studentId || '',
          email: user.email || '',
        });
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching user details:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );
  }, []);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDetails();
  }, [fetchUserDetails]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, theme === 'light' ? styles.lightBackground : styles.darkBackground]}>
        <ActivityIndicator size="large" color={theme === 'light' ? '#000' : '#fff'} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, theme === 'light' ? styles.lightBackground : styles.darkBackground]}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme === 'light' ? '#000' : '#fff'}
        />
      }
    >
      <View style={[styles.card, theme === 'light' ? styles.lightCard : styles.darkCard]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/150/3498DB/ffffff?text=User' }}
            style={styles.avatar}
          />
        </View>

        <Text
          style={[styles.nameText, theme === 'light' ? styles.lightText : styles.darkText]}
        >
          {userDetails.name || 'No Name'}
        </Text>

        {userDetails.email ? (
          <Text
            style={[styles.emailText, theme === 'light' ? styles.lightSubText : styles.darkSubText]}
          >
            {userDetails.email}
          </Text>
        ) : null}

        {userDetails.studentId ? (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, theme === 'light' ? styles.lightText : styles.darkText]}>
              Student ID:
            </Text>
            <Text style={[styles.infoValue, theme === 'light' ? styles.lightSubText : styles.darkSubText]}>
              {userDetails.studentId}
            </Text>
          </View>
        ) : null}

        {/* Edit Profile Button (Optional) */}
        <TouchableOpacity
          style={[styles.editButton, theme === 'light' ? styles.lightSubmitButton : styles.darkSubmitButton]}
          onPress={() => {
            // Implement "Edit Profile" navigation logic if you want
          }}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* NEW: Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: '#E74C3C' }]}
          onPress={onLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  lightBackground: { backgroundColor: '#F5F7FA' },
  darkBackground: { backgroundColor: '#121212' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  lightCard: { backgroundColor: '#ffffff' },
  darkCard: { backgroundColor: '#1f1f1f', elevation: 0, shadowOpacity: 0 },

  avatarContainer: { marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },

  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 20,
  },
  lightText: {
    color: '#1f2937',
  },
  darkText: {
    color: '#f0f0f0',
  },
  lightSubText: {
    color: '#4b5563',
  },
  darkSubText: {
    color: '#cccccc',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
  },

  // Edit Profile
  editButton: {
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  lightSubmitButton: {
    backgroundColor: '#3498DB',
  },
  darkSubmitButton: {
    backgroundColor: '#1565C0',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Logout Button
  logoutButton: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
