// frontend/components/auth/GoogleSignInButton.tsx - Updated Component
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: (isNewUser?: boolean) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
}) => {
  const { authenticateWithGoogleToken, isLoading } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google OAuth hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: ['profile', 'email'],
    responseType: 'id_token',
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.params.id_token);
    } else if (response?.type === 'error') {
      handleGoogleError('Google sign-in failed');
    } else if (response?.type === 'cancel') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const result = await authenticateWithGoogleToken(idToken);
      
      // Show appropriate message
      if (result.isNewUser) {
        Alert.alert(
          'Welcome to MentorMatch!',
          'Your account has been created successfully with Google. Let\'s set up your learning profile.',
          [{ text: 'Continue', style: 'default' }]
        );
      }
      
      onSuccess?.(result.isNewUser);
      
    } catch (error: any) {
      handleGoogleError(error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setIsGoogleLoading(false);
    onError?.(error);
    
    Alert.alert(
      'Sign-in Failed',
      error || 'Unable to sign in with Google. Please try again.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handlePress = async () => {
    if (disabled || isLoading || isGoogleLoading || !request) return;

    try {
      setIsGoogleLoading(true);
      await promptAsync();
    } catch (error: any) {
      handleGoogleError(error.message || 'Google sign-in failed');
    }
  };

  const isButtonDisabled = disabled || isLoading || isGoogleLoading || !request;

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
          <ActivityIndicator size="small" color="#4285f4" />
        ) : (
          <View style={styles.googleIcon}>
            <Text style={styles.googleG}>G</Text>
          </View>
        )}
        <Text style={[styles.text, isButtonDisabled && styles.textDisabled]}>
          {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
        </Text>
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
});

