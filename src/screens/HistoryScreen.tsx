// src/screens/HistoryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ScanItem } from '../context/types';
import { useTheme } from '../context/ThemeContext';

// Define the props interface
interface HistoryScreenProps {
  onBack: () => void;
  scanHistory: ScanItem[];
  onSelectScan: (scan: ScanItem) => void;
  onDeleteScan: (id: string) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onBack,
  scanHistory,
  onSelectScan,
  onDeleteScan
}) => {
  const { theme } = useTheme();

  const handleItemPress = (item: ScanItem) => {
    onSelectScan(item);
  };

  const handleDeletePress = (item: ScanItem) => {
    Alert.alert(
      'Delete Scan',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => onDeleteScan(item.id), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        theme === 'light' ? styles.lightBackground : styles.darkBackground
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          theme === 'light' ? styles.lightHeader : styles.darkHeader
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text
            style={[
              styles.backButtonText,
              theme === 'light' ? styles.lightText : styles.darkText
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            // If you want your header text to always be white on light mode, keep '#FFF';
            // Or toggle theme text color here as well.
            theme === 'light' ? styles.lightText : styles.darkText
          ]}
        >
          Scan History
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Scan History List */}
        <View style={styles.historyList}>
          {scanHistory.length === 0 ? (
            <Text
              style={[
                styles.noHistoryText,
                theme === 'light' ? styles.lightText : styles.darkText
              ]}
            >
              No scans available.
            </Text>
          ) : (
            scanHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.historyItem,
                  theme === 'light' ? styles.lightCard : styles.darkCard
                ]}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemIcon}>
                    <Text style={styles.iconText}>
                      {item.type === 'document' ? '📄' : '📸'}
                    </Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text
                      style={[
                        styles.itemTitle,
                        theme === 'light' ? styles.lightText : styles.darkText
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.itemDate,
                        theme === 'light' ? styles.lightText : styles.darkText
                      ]}
                    >
                      {item.date}
                    </Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          item.status === 'completed'
                            ? styles.statusCompleted
                            : styles.statusFailed,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          theme === 'light' ? styles.lightText : styles.darkText
                        ]}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePress(item)}
                  >
                    <Text
                      style={[
                        styles.deleteText,
                        theme === 'light' ? styles.lightText : styles.darkText
                      ]}
                    >
                      🗑️
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightBackground: {
    backgroundColor: '#F5F7FA',
  },
  darkBackground: {
    backgroundColor: '#1e1e1e',
  },
  header: {
    padding: 20,
    // The below background is applied in .lightHeader and .darkHeader
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightHeader: {
    backgroundColor: '#4A90E2',  // bluish for light mode
  },
  darkHeader: {
    backgroundColor: '#2c2c2c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    // color is set by theme in usage
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    // color is set by theme in usage
  },
  content: {
    flex: 1,
    padding: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  lightCard: {
    backgroundColor: '#FFF',
  },
  darkCard: {
    backgroundColor: '#2c2c2c',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color will be overridden by theme-based style
  },
  itemDate: {
    fontSize: 14,
    marginTop: 4,
    // color will be overridden by theme-based style
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusFailed: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  noHistoryText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },

  // Fixing theme-based text colors
  // In light mode, let's use a dark color (e.g. #2C3E50)
  // In dark mode, let's use white.
  lightText: {
    color: '#2C3E50',
  },
  darkText: {
    color: '#ffffff',
  },
});

export default HistoryScreen;
