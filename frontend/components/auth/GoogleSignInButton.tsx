// components/auth/GoogleSignInButton.tsx - Enhanced with Signup/Signin Flow
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: (isNewUser?: boolean) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  mode?: 'signin' | 'signup'; // New prop to distinguish between signin and signup
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  mode = 'signin',
}) => {
  const { authenticateWithGoogleToken, isLoading } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Configuration
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = 'https://auth.expo.io/@swagat1212/mentormeet-india-wide-student-mentor-app';

  console.log('🔍 Google OAuth Setup:');
  console.log('- Mode:', mode);
  console.log('- Client ID:', clientId ? 'Configured ✅' : 'Missing ❌');
  console.log('- Redirect URI:', redirectUri);

  // Google OAuth hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: clientId || '',
    scopes: ['profile', 'email', 'openid'],
    responseType: ResponseType.IdToken,
    redirectUri,
  });

  // Handle response
  useEffect(() => {
    if (response) {
      console.log('📱 Google Response:', response.type);
      
      if (response.type === 'success') {
        const { id_token } = response.params;
        if (id_token) {
          console.log('✅ ID Token received');
          handleGoogleSuccess(id_token);
        } else {
          console.error('❌ No ID token in response');
          handleGoogleError('No ID token received from Google');
        }
      } else if (response.type === 'error') {
        console.error('❌ OAuth Error:', response.params);
        const errorMsg = response.params?.error_description || response.params?.error || 'Google authentication failed';
        handleGoogleError(errorMsg);
      } else if (response.type === 'cancel') {
        console.log('👤 User cancelled');
        setIsGoogleLoading(false);
      } else if (response.type === 'dismiss') {
        console.log('🚫 Authentication dismissed');
        setIsGoogleLoading(false);
        // Don't show error for dismiss, user might have just closed the browser
      }
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      console.log('🔄 Authenticating with backend...');
      
      const result = await authenticateWithGoogleToken(idToken);
      
      setIsGoogleLoading(false);
      
      console.log('✅ Authentication successful:', {
        isNewUser: result.isNewUser,
        requiresOnboarding: result.requiresOnboarding,
        mode: mode
      });
      
      // Handle different scenarios based on result
      if (result.success) {
        handleSuccessfulAuth(result);
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
      
    } catch (error: any) {
      console.error('❌ Backend authentication failed:', error);
      setIsGoogleLoading(false);
      handleGoogleError(error.message || 'Authentication failed');
    }
  };

  const handleSuccessfulAuth = (result: any) => {
    const { isNewUser, requiresOnboarding, data } = result;
    
    if (isNewUser) {
      // New user created
      Alert.alert(
        '🎉 Welcome to MentorMeet!',
        'Your account has been created successfully with Google. Let\'s set up your profile to get started!',
        [
          {
            text: 'Set Up Profile',
            style: 'default',
            onPress: () => {
              onSuccess?.(true);
              // Navigate to onboarding
              if (requiresOnboarding) {
                router.replace('/(onboarding)/welcome');
              } else {
                router.replace('/(tabs)');
              }
            }
          }
        ]
      );
    } else {
      // Existing user signing in
      Alert.alert(
        '👋 Welcome Back!',
        `Hi ${data?.user?.name || 'there'}! You\'ve successfully signed in with Google.`,
        [
          {
            text: 'Continue',
            style: 'default',
            onPress: () => {
              onSuccess?.(false);
              // Navigate based on onboarding status
              if (requiresOnboarding) {
                router.replace('/(onboarding)/welcome');
              } else {
                router.replace('/(tabs)');
              }
            }
          }
        ]
      );
    }
  };

  const handleGoogleError = (error: string) => {
    setIsGoogleLoading(false);
    console.error('❌ Google Authentication Error:', error);
    onError?.(error);
    
    // Provide user-friendly error messages
    let title = 'Authentication Failed';
    let message = error;
    
    if (error.includes('Invalid Google')) {
      title = 'Google Sign-In Failed';
      message = 'There was an issue with Google authentication. Please try again.';
    } else if (error.includes('Network')) {
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
    } else if (error.includes('Server')) {
      title = 'Server Error';
      message = 'Our servers are temporarily unavailable. Please try again in a few moments.';
    } else if (error.includes('Email not provided')) {
      title = 'Email Required';
      message = 'Your Google account must have an email address to continue.';
    }
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Try Again', style: 'default' },
        ...(mode === 'signup' ? [
          { 
            text: 'Sign Up with Email', 
            style: "default" as "default",
            onPress: () => router.push('/(auth)/register')
          }
        ] : [
          { 
            text: 'Sign In with Email', 
            style: "default" as "default",
            onPress: () => router.push('/(auth)/login')
          }
        ])
      ]
    );
  };

  const handlePress = async () => {
    if (disabled || isLoading || isGoogleLoading || !request) {
      console.log('🚫 Button disabled or not ready');
      return;
    }

    if (!clientId) {
      handleGoogleError('Google Client ID not configured. Please check your environment setup.');
      return;
    }

    try {
      console.log(`🚀 Starting Google OAuth flow for ${mode}...`);
      setIsGoogleLoading(true);
      
      await promptAsync({
        showInRecents: false,
      });
      
    } catch (error: any) {
      console.error('❌ Failed to start OAuth flow:', error);
      handleGoogleError(error.message || 'Failed to start Google authentication');
    }
  };

  const isButtonDisabled = disabled || isLoading || isGoogleLoading;
  const buttonText = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  // Configuration warnings
  if (!clientId) {
    return (
      <View style={[styles.container, style, styles.disabled]}>
        <View style={styles.gradient}>
          <MaterialIcons name="warning" size={20} color="#ff6b6b" />
          <Text style={styles.warningText}>Google Client ID Missing</Text>
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, style, styles.disabled]}>
        <View style={styles.gradient}>
          <ActivityIndicator size="small" color="#8b7355" />
          <Text style={styles.loadingText}>Setting up Google Auth...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style, isButtonDisabled && styles.disabled]}
      onPress={handlePress}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isButtonDisabled ? ['#f3f4f6', '#f3f4f6'] : ['#ffffff', '#fefbf3']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isGoogleLoading ? (
          <>
            <ActivityIndicator size="small" color="#4285f4" />
            <Text style={[styles.text, { marginLeft: 12 }]}>
              {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.googleIcon}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={[styles.text, isButtonDisabled && styles.textDisabled]}>
              {buttonText}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  disabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.2)',
    paddingHorizontal: 16,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#4a3728',
    fontWeight: '600',
  },
  textDisabled: {
    color: '#9ca3af',
  },
  warningText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
    color: '#8b7355',
    marginLeft: 8,
    fontWeight: '500',
  },
});