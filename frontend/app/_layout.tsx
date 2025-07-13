// frontend/app/_layout.tsx - Updated App Layout with Auto-Discovery
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { initializeApi, testConnection } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

interface InitializationState {
  stage: 'loading' | 'api_discovery' | 'auth_check' | 'ready' | 'error';
  message: string;
  progress: number;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    // Add your custom fonts here if needed
  });

  const [initState, setInitState] = useState<InitializationState>({
    stage: 'loading',
    message: 'Starting app...',
    progress: 0,
  });

  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (loaded) {
      initializeApp();
    }
  }, [loaded]);

  const initializeApp = async () => {
    try {
      // Stage 1: API Discovery
      setInitState({
        stage: 'api_discovery',
        message: 'Discovering backend server...',
        progress: 25,
      });

      console.log('🚀 Starting app initialization...');
      
      // Initialize API service with auto-discovery
      await initializeApi();
      
      // Test the connection
      setInitState({
        stage: 'api_discovery',
        message: 'Testing backend connection...',
        progress: 50,
      });

      const connectionResult = await testConnection();
      
      if (!connectionResult.success) {
        console.warn('⚠️ Backend connection failed during initialization:', connectionResult.message);
        // Don't block app initialization, user can configure later
        Alert.alert(
          "Backend Connection",
          "Could not connect to backend server. You can configure the connection in Settings > Connection.",
          [{ text: "Continue", style: "default" }]
        );
      } else {
        console.log('✅ Backend connection successful');
      }

      // Stage 2: Auth Check
      setInitState({
        stage: 'auth_check',
        message: 'Checking authentication...',
        progress: 75,
      });

      // Initialize authentication
      await initializeAuth();

      // Stage 3: Ready
      setInitState({
        stage: 'ready',
        message: 'Ready!',
        progress: 100,
      });

      // Small delay to show completion
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);

    } catch (error: any) {
      console.error('❌ App initialization failed:', error);
      
      setInitState({
        stage: 'error',
        message: `Initialization failed: ${error.message}`,
        progress: 0,
      });

      Alert.alert(
        "Initialization Error",
        "There was an error starting the app. Please restart and try again.",
        [
          {
            text: "Continue Anyway",
            onPress: () => {
              SplashScreen.hideAsync();
            },
          },
        ]
      );
    }
  };

  // Show custom loading screen during initialization
  if (!loaded || !isInitialized || initState.stage !== 'ready') {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          {/* App Logo/Icon */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(139, 90, 60, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              borderWidth: 3,
              borderColor: 'rgba(139, 90, 60, 0.2)',
            }}
          >
            <MaterialIcons name="school" size={50} color="#8b5a3c" />
          </View>

          {/* App Title */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#4a3728',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            MentorMatch
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: '#8b7355',
              marginBottom: 40,
              textAlign: 'center',
            }}
          >
            Student-Mentor Learning Platform
          </Text>

          {/* Loading Progress */}
          <View
            style={{
              width: '100%',
              marginBottom: 20,
            }}
          >
            {/* Progress Bar */}
            <View
              style={{
                height: 4,
                backgroundColor: 'rgba(139, 90, 60, 0.2)',
                borderRadius: 2,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${initState.progress}%`,
                  backgroundColor: '#8b5a3c',
                  borderRadius: 2,
                }}
              />
            </View>

            {/* Status Message */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initState.stage !== 'error' && (
                <ActivityIndicator
                  size="small"
                  color="#8b5a3c"
                  style={{ marginRight: 12 }}
                />
              )}
              {initState.stage === 'error' && (
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color="#dc2626"
                  style={{ marginRight: 12 }}
                />
              )}
              <Text
                style={{
                  fontSize: 14,
                  color: initState.stage === 'error' ? '#dc2626' : '#8b7355',
                  textAlign: 'center',
                }}
              >
                {initState.message}
              </Text>
            </View>
          </View>

          {/* Stage Indicators */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {/* API Discovery */}
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor:
                    initState.stage === 'api_discovery' ? '#8b5a3c' :
                    initState.progress >= 25 ? '#10b981' : 'rgba(139, 90, 60, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initState.stage === 'api_discovery' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons
                    name={initState.progress >= 25 ? 'check' : 'search'}
                    size={16}
                    color={initState.progress >= 25 ? '#fff' : '#8b7355'}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: '#8b7355',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Backend
              </Text>
            </View>

            {/* Auth Check */}
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor:
                    initState.stage === 'auth_check' ? '#8b5a3c' :
                    initState.progress >= 75 ? '#10b981' : 'rgba(139, 90, 60, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initState.stage === 'auth_check' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons
                    name={initState.progress >= 75 ? 'check' : 'person'}
                    size={16}
                    color={initState.progress >= 75 ? '#fff' : '#8b7355'}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: '#8b7355',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Auth
              </Text>
            </View>

            {/* Ready */}
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor:
                    initState.stage === 'ready' ? '#10b981' : 'rgba(139, 90, 60, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons
                  name={initState.stage === 'ready' ? 'check' : 'flag'}
                  size={16}
                  color={initState.stage === 'ready' ? '#fff' : '#8b7355'}
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  color: '#8b7355',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                Ready
              </Text>
            </View>
          </View>

          {/* Error Details */}
          {initState.stage === 'error' && (
            <View
              style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(220, 38, 38, 0.2)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: '#dc2626',
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                If this error persists, try:
                {'\n'}• Restarting the app
                {'\n'}• Checking your internet connection
                {'\n'}• Configuring backend connection in Settings
              </Text>
            </View>
          )}
        </LinearGradient>
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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}