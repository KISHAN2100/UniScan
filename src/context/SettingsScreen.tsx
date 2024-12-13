// // screens/SettingsScreen.tsx

// import React, { useContext } from 'react';
// import { View, Text, StyleSheet, Switch, SafeAreaView } from 'react-native';
// import { ThemeContext } from './ThemeContext';

// const SettingsScreen: React.FC = () => {
//   const { theme, toggleTheme } = useContext(ThemeContext);

//   const isDarkMode = theme === 'dark';

//   return (
//     <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
//       <View style={styles.settingItem}>
//         <Text style={[styles.settingText, isDarkMode && styles.darkText]}>Dark Mode</Text>
//         <Switch
//           value={isDarkMode}
//           onValueChange={toggleTheme}
//           thumbColor={isDarkMode ? '#4F46E5' : '#f4f3f4'}
//           trackColor={{ false: '#767577', true: '#81b0ff' }}
//         />
//       </View>
//       {/* You can add more settings options here */}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#f0f4f7',
//   },
//   darkContainer: {
//     backgroundColor: '#1f2937',
//   },
//   settingItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginVertical: 15,
//   },
//   settingText: {
//     fontSize: 18,
//     color: '#374151',
//   },
//   darkText: {
//     color: '#ffffff',
//   },
// });

// export default SettingsScreen;
