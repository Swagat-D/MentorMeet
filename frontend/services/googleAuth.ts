// frontend/services/googleAuth.ts - Google OAuth Service
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor() {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
    }
    
    this.config = {
      clientId: GOOGLE_CLIENT_ID || '',
    };
  }

  /**
   * Initialize Google OAuth request
   */
  useGoogleAuth() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: this.config.clientId,
      scopes: ['profile', 'email'],
      responseType: 'id_token',
    });

    return {
      request,
      response,
      promptAsync,
    };
  }

  /**
   * Handle Google OAuth response
   */
  async handleGoogleResponse(response: any): Promise<string | null> {
    try {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        
        if (!id_token) {
          throw new Error('No ID token received from Google');
        }
        
        return id_token;
      } else if (response?.type === 'cancel') {
        console.log('Google sign-in was cancelled');
        return null;
      } else {
        throw new Error(`Google authentication failed: ${response?.type}`);
      }
    } catch (error: any) {
      console.error('Google auth response error:', error);
      throw new Error(error.message || 'Google authentication failed');
    }
  }

  /**
   * Sign out from Google (if needed)
   */
  async signOut(): Promise<void> {
    try {
      // Clear any cached Google tokens
      await WebBrowser.dismissAuthSession();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  }
}

export const googleAuthService = new GoogleAuthService();