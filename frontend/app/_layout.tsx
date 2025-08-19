// frontend/app/_layout.tsx - Minimal Layout that lets index.tsx handle splash
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import { initializeApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add your custom fonts here if needed
  });

  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        if (loaded) {
          console.log('🚀 Layout: Starting background initialization...');
          
          // Initialize API and auth in background
          // Don't await these - let them run in background while splash shows
          initializeApi().then(() => {
            console.log('✅ Layout: API initialized');
          }).catch(err => {
            console.warn('⚠️ Layout: API initialization failed:', err);
          });
          
          initializeAuth().then(() => {
            console.log('✅ Layout: Auth initialized');
          }).catch(err => {
            console.warn('⚠️ Layout: Auth initialization failed:', err);
          });

          // Hide expo splash screen since we have our custom one
          SplashScreen.hideAsync();
        }
      } catch (error) {
        console.error('❌ Layout preparation error:', error);
        // Still hide splash screen to not block the app
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loaded]);

  // Only show loading if fonts aren't loaded
  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8b5a3c" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}