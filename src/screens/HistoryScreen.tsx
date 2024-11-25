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

// Define the interface for scan items
interface ScanItem {
  id: string;
  title: string;
  date: string;
  type: 'document' | 'camera' | 'image';
  status: 'completed' | 'failed';
}

// Define the props interface
interface HistoryScreenProps {
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  // Mock data - replace with actual data from your storage
  const scanHistory: ScanItem[] = [
    {
      id: '1',
      title: 'Calculus Notes',
      date: 'Today, 3:30 PM',
      type: 'document',
      status: 'completed',
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      date: 'Today, 1:15 PM',
      type: 'camera',
      status: 'completed',
    },
    {
      id: '3',
      title: 'Chemistry Homework',
      date: 'Yesterday, 5:20 PM',
      type: 'document',
      status: 'completed',
    },
  ];

  const handleItemPress = (item: ScanItem) => {
    Alert.alert('Open Scan', `Opening ${item.title}`);
  };

  const handleDeletePress = (item: ScanItem) => {
    Alert.alert(
      'Delete Scan',
      `Are you sure you want to delete "${item.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => Alert.alert('Deleted', `${item.title} has been deleted`),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterChip, styles.activeChip]}>
            <Text style={styles.activeChipText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip}>
            <Text style={styles.filterChipText}>Photos</Text>
          </TouchableOpacity>
        </View>

        {/* Scan History List */}
        <View style={styles.historyList}>
          {scanHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyItem}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemContent}>
                <View style={styles.itemIcon}>
                  <Text style={styles.iconText}>
                    {item.type === 'document' ? '📄' : '📸'}
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        item.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusFailed,
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePress(item)}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeChip: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterChipText: {
    color: '#666',
  },
  activeChipText: {
    color: '#FFF',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#2C3E50',
  },
  itemDate: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 4,
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
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
});

export default HistoryScreen; 