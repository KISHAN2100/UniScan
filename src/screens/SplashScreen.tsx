import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';

const SplashScreen: React.FC = () => {
    const scaleValue = useRef(new Animated.Value(0)).current; // Initialize animated value

    useEffect(() => {
        // Start the zoom animation
        Animated.timing(scaleValue, {
            toValue: 1, // Scale to 1 (original size)
            duration: 1000, // Duration of the animation
            useNativeDriver: true, // Use native driver for better performance
        }).start();
    }, [scaleValue]);

    return (
        <View style={styles.container}>
            <Animated.Image 
                source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqsibjps6D_tF7wAT5FUSKKCxBgnP8PfqpvA&s' }} 
                style={[styles.logo, { transform: [{ scale: scaleValue }] }]} // Apply scale transformation
                resizeMode="contain"
            />
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.title}>Welcome to Your Learning App!</Text>
            <Text style={styles.subtitle}>Empowering Students for Success</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f8ff', // Background color
    },
    logo: {
        width: 500,
        height: 500,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 10,
        color: '#555',
    },
});

export default SplashScreen; 