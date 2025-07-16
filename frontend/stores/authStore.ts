// stores/authStore.ts - Updated with Dynamic API Service
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api'; // Updated import
import { Alert } from 'react-native';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'mentee' | 'mentor' | 'admin';
  avatar?: string;
  phone?: string;
  gender?: string;
  ageRange?: string;
  studyLevel?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  goals?: string[];
  interests?: string[];
  isEmailVerified: boolean;
  isOnboarded: boolean;
  isTestGiven: boolean;
  onboardingStatus?: string;
  stats?: any;
  lastLoginAt?: Date;
  createdAt: Date;
  provider?: string;
  canChangePassword?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'mentee' | 'mentor';
}

export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  isNewUser?: boolean;
  requiresOnboarding?: boolean;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeOnboarding: (interests?: string[], goals?: string[]) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearAuth: () => void;
  authenticateWithGoogleToken: (googleToken: string) => Promise<GoogleAuthResponse>;
  unlinkGoogleAccount: (password: string) => Promise<any>;
}

// Token management
export const TokenManager = {
  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await AsyncStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      isInitialized: false,

      // Initialize authentication state
      initializeAuth: async () => {
        try {
          console.log('🔐 Initializing authentication...');
          
          const token = await TokenManager.getAccessToken();
          if (!token) {
            console.log('👤 No access token found, user not authenticated');
            set({ 
              isAuthenticated: false, 
              user: null, 
              isOnboarded: false,
              isInitialized: true 
            });
            return;
          }

          // Check if token is still valid by calling auth check
          await get().checkAuthStatus();
          
          set({ isInitialized: true });
          console.log('✅ Authentication initialized');
        } catch (error) {
          console.error('❌ Auth initialization error:', error);
          set({ 
            isAuthenticated: false, 
            user: null, 
            isOnboarded: false,
            isInitialized: true 
          });
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Registering user:', data.email);
          
          const response = await ApiService.post('REGISTER', data);
          
          if (response.success) {
            console.log('✅ Registration successful');
            set({ isLoading: false });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Registration error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Logging in user:', email);
          
          const response = await ApiService.post('LOGIN', {
            email,
            password,
          });

          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            await TokenManager.setTokens(
              tokens.accessToken,
              tokens.refreshToken
            );

            set({
              user,
              isAuthenticated: true,
              isOnboarded: user.isOnboarded || false,
              isLoading: false,
            });

            console.log('✅ Login successful');
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Login error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Enhanced Google Authentication with dynamic API service
      authenticateWithGoogleToken: async (googleToken: string): Promise<GoogleAuthResponse> => {
        try {
          set({ isLoading: true });
          
          console.log('🔄 Sending Google token to backend...');
          
          const response = await ApiService.post('AUTHENTICATION_WITH_GOOGLETOKEN', {
            token: googleToken
          });
          
          console.log('📋 Google auth response:', response);
          
          if (response.success && response.data) {
            // Store tokens
            await TokenManager.setTokens(
              response.data.tokens.accessToken,
              response.data.tokens.refreshToken
            );
            
            // Update state
            set({
              user: response.data.user,
              isAuthenticated: true,
              isOnboarded: response.data.user.isOnboarded || false,
              isLoading: false,
            });
            
            console.log('✅ Google authentication successful');
            console.log('👤 User info:', {
              id: response.data.user.id,
              email: response.data.user.email,
              name: response.data.user.name,
              isNewUser: response.isNewUser,
              isOnboarded: response.data.user.isOnboarded,
            });
            
            return {
              success: true,
              message: response.message,
              data: response.data,
              isNewUser: response.isNewUser,
              requiresOnboarding: !response.data.user.isOnboarded,
            };
          } else {
            throw new Error(response.message || 'Google authentication failed');
          }
          
        } catch (error: any) {
          console.error('💥 Google authentication error:', error);
          set({ isLoading: false });
          
          // Provide user-friendly error messages
          let userMessage = 'Google sign-in failed. Please try again.';
          
          if (error.message) {
            if (error.message.includes('Network error') || error.message.includes('timeout')) {
              userMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('Invalid Google')) {
              userMessage = 'Google authentication failed. Please try signing in again.';
            } else if (error.message.includes('Server error')) {
              userMessage = 'Server is temporarily unavailable. Please try again later.';
            } else {
              userMessage = error.message;
            }
          }
          
          throw new Error(userMessage);
        }
      },

      // Unlink Google account
      unlinkGoogleAccount: async (password: string) => {
        try {
          const response = await ApiService.post('UNLINK_GOOGLEACCOUNT', {
            password
          });
          
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                provider: 'email',
                canChangePassword: true,
              }
            });
          }
          
          return response;
          
        } catch (error: any) {
          console.error('Unlink Google error:', error);
          throw new Error(error.message || 'Failed to unlink Google account');
        }
      },

      // Verify email action
      verifyEmail: async (email: string, otp: string) => {
        set({ isLoading: true });
        try {
          console.log('📧 Verifying email:', email);
          
          const response = await ApiService.post('VERIFY_EMAIL', {
            email,
            otp,
          });

          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            await TokenManager.setTokens(
              tokens.accessToken,
              tokens.refreshToken
            );

            set({
              user,
              isAuthenticated: true,
              isOnboarded: user.isOnboarded || false,
              isLoading: false,
            });

            console.log('✅ Email verification successful');
          } else {
            throw new Error(response.message || 'Email verification failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Email verification error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Resend OTP action
      resendOTP: async (email: string) => {
        set({ isLoading: true });
        try {
          console.log('📧 Resending OTP to:', email);
          
          const response = await ApiService.post('RESEND_OTP', {
            email,
          });

          set({ isLoading: false });

          if (response.success) {
            console.log('✅ OTP resent successfully');
          } else {
            throw new Error(response.message || 'Failed to resend OTP');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Resend OTP error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Forgot password action
      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          console.log('🔑 Requesting password reset for:', email);
          
          const response = await ApiService.post('FORGOT_PASSWORD', {
            email,
          });

          set({ isLoading: false });

          if (response.success) {
            console.log('✅ Password reset email sent');
          } else {
            throw new Error(response.message || 'Failed to send reset email');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Forgot password error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Reset password action
      resetPassword: async (email: string, otp: string, newPassword: string) => {
        try {
          const response = await ApiService.post('RESET_PASSWORD', {
            email,
            otp,
            newPassword,
          });

          return response;
        } catch (error: any) {
          console.error('Reset password error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw new Error(error.message || 'Password reset failed');
        }
      },

      // Update profile action
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          console.log('👤 Updating profile');
          
          const response = await ApiService.put('UPDATE_PROFILE', data);

          if (response.success && response.data) {
            const { user: updatedUser } = response.data;
            
            set(state => ({
              user: { ...state.user, ...updatedUser },
              isLoading: false,
            }));

            console.log('✅ Profile updated successfully');
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Update profile error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Complete onboarding action
      completeOnboarding: async (interests?: string[], goals?: string[]) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          console.log('🎯 Completing onboarding');
          
          const updateData: Partial<User> = {
            isOnboarded: true,
            onboardingStatus: 'completed',
          };
          
          if (interests) updateData.interests = interests;
          if (goals) updateData.goals = goals;

          const response = await ApiService.put('UPDATE_PROFILE', updateData);

          if (response.success) {
            set(state => ({
              user: state.user ? { ...state.user, ...updateData } : state.user,
              isOnboarded: true,
              isLoading: false,
            }));

            console.log('✅ Onboarding completed successfully');
          } else {
            throw new Error(response.message || 'Onboarding completion failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Complete onboarding error:', error);
          
          // Provide user-friendly error messages
          if (error.message.includes('Network error') || error.message.includes('timeout')) {
            throw new Error('Network connection failed. Please check your connection and try again.');
          }
          
          throw error;
        }
      },

      // Check auth status
      checkAuthStatus: async () => {
        const token = await TokenManager.getAccessToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, isOnboarded: false });
          return;
        }

        try {
          console.log('🔍 Checking auth status');
          
          const response = await ApiService.get('CHECK_AUTH');

          if (response.success && response.data) {
            const { user } = response.data;
            set({
              user,
              isAuthenticated: true,
              isOnboarded: user.isOnboarded || false,
            });

            console.log('✅ Auth status verified');
          } else {
            throw new Error('Auth check failed');
          }
        } catch (error: any) {
          console.error('❌ Auth check error:', error);
          
          // Only clear auth if it's actually an auth error, not a network error
          if (!error.message.includes('Network error') && !error.message.includes('timeout')) {
            await TokenManager.clearTokens();
            set({ isAuthenticated: false, user: null, isOnboarded: false });
          }
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          console.log('🚪 Logging out');
          
          try {
            await ApiService.post('LOGOUT');
          } catch (error) {
            console.warn('Logout endpoint failed, continuing with local logout');
          }

          await TokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isOnboarded: false,
            isLoading: false,
          });

          console.log('✅ Logout successful');
        } catch (error: any) {
          set({ isLoading: false });
          console.error('❌ Logout error:', error);
          
          // Even if logout fails, clear local state
          await TokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isOnboarded: false,
            isLoading: false,
          });
        }
      },

      // Clear auth (for errors)
      clearAuth: () => {
        TokenManager.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
          isInitialized: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name: string) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error setting item to storage:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing item from storage:', error);
          }
        },
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
        // Don't persist isInitialized - should always start as false
      }),
    }
  )
);