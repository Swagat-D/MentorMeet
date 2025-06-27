// frontend/stores/authStore.ts - Updated Auth Store with API Integration
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService, API_ENDPOINTS } from '../services/api';

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
  onboardingStatus?: string;
  stats?: any;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'mentee' | 'mentor';
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  
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
  clearAuth: () => void;
}

// Token management
const TokenManager = {
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

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Registering user:', data.email);
          
          const response = await ApiService.post(API_ENDPOINTS.REGISTER, data);
          
          if (response.success) {
            console.log('✅ Registration successful');
            // Don't set user as authenticated yet, need email verification
            set({ isLoading: false });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Registration error:', error);
          throw error;
        }
      },

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Logging in user:', email);
          
          const response = await ApiService.post(API_ENDPOINTS.LOGIN, {
            email,
            password,
          });

          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Save tokens
            await TokenManager.setTokens(
              tokens.accessToken,
              tokens.refreshToken
            );

            // Update state
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
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Login error:', error);
          throw error;
        }
      },

      // Verify email action
      verifyEmail: async (email: string, otp: string) => {
        set({ isLoading: true });
        try {
          console.log('📧 Verifying email:', email);
          
          const response = await ApiService.post(API_ENDPOINTS.VERIFY_EMAIL, {
            email,
            otp,
          });

          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Save tokens
            await TokenManager.setTokens(
              tokens.accessToken,
              tokens.refreshToken
            );

            // Update state
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
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Email verification error:', error);
          throw error;
        }
      },

      // Resend OTP action
      resendOTP: async (email: string) => {
        set({ isLoading: true });
        try {
          console.log('📧 Resending OTP to:', email);
          
          const response = await ApiService.post(API_ENDPOINTS.RESEND_OTP, {
            email,
          });

          set({ isLoading: false });

          if (response.success) {
            console.log('✅ OTP resent successfully');
          } else {
            throw new Error(response.message || 'Failed to resend OTP');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Resend OTP error:', error);
          throw error;
        }
      },

      // Forgot password action
      forgotPassword: async (email: string) => {
        set({ isLoading: true });
        try {
          console.log('🔑 Requesting password reset for:', email);
          
          const response = await ApiService.post(API_ENDPOINTS.FORGOT_PASSWORD, {
            email,
          });

          set({ isLoading: false });

          if (response.success) {
            console.log('✅ Password reset email sent');
          } else {
            throw new Error(response.message || 'Failed to send reset email');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Forgot password error:', error);
          throw error;
        }
      },

      // Reset password action
      resetPassword: async (email: string, otp: string, newPassword: string) => {
        set({ isLoading: true });
        try {
          console.log('🔑 Resetting password for:', email);
          
          const response = await ApiService.post(API_ENDPOINTS.RESET_PASSWORD, {
            email,
            otp,
            newPassword,
          });

          set({ isLoading: false });

          if (response.success) {
            console.log('✅ Password reset successful');
          } else {
            throw new Error(response.message || 'Password reset failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Reset password error:', error);
          throw error;
        }
      },

      // Update profile action
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          console.log('👤 Updating profile');
          
          const response = await ApiService.put(API_ENDPOINTS.UPDATE_PROFILE, data);

          if (response.success && response.data) {
            const { user: updatedUser } = response.data;
            
            // Update state
            set(state => ({
              user: { ...state.user, ...updatedUser },
              isLoading: false,
            }));

            console.log('✅ Profile updated successfully');
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Update profile error:', error);
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

          const response = await ApiService.put(API_ENDPOINTS.UPDATE_PROFILE, updateData);

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
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Complete onboarding error:', error);
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
          
          const response = await ApiService.get(API_ENDPOINTS.CHECK_AUTH);

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
        } catch (error) {
          console.error('❌ Auth check error:', error);
          await TokenManager.clearTokens();
          set({ isAuthenticated: false, user: null, isOnboarded: false });
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          console.log('🚪 Logging out');
          
          // Call logout endpoint (optional)
          try {
            await ApiService.post(API_ENDPOINTS.LOGOUT);
          } catch (error) {
            // Ignore logout endpoint errors
            console.warn('Logout endpoint failed, continuing with local logout');
          }

          // Clear tokens and state
          await TokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isOnboarded: false,
            isLoading: false,
          });

          console.log('✅ Logout successful');
        } catch (error) {
          set({ isLoading: false });
          console.error('❌ Logout error:', error);
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
      }),
    }
  )
);