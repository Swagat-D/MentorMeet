// stores/authStore.ts - Updated Auth Store with Backend Integration
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

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
  goals: string[];
  interests: string[];
  isEmailVerified: boolean;
  isOnboarded: boolean;
  onboardingStatus: 'not-started' | 'in-progress' | 'completed';
  stats?: {
    totalHoursLearned: number;
    sessionsCompleted: number;
    mentorsConnected: number;
    studyStreak: number;
    completionRate: number;
    monthlyHours: number;
    weeklyGoalProgress: number;
    averageRating: number;
  };
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  // Authentication
  register: (data: RegisterData) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Password management
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Profile management
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Onboarding
  updateOnboarding: (data: OnboardingData) => Promise<void>;
  completeOnboarding: (interests?: string[], goals?: string[]) => Promise<void>;
  
  // State management
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  
  // Utilities
  checkAuthStatus: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'mentee' | 'mentor';
}

export interface OnboardingData {
  gender?: string;
  ageRange?: string;
  studyLevel?: string;
  goals?: string[];
  interests?: string[];
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Authentication actions
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/register', data);
          
          if (response.data.success) {
            // Registration successful, but email verification required
            set({ isLoading: false });
          } else {
            throw new Error(response.data.message || 'Registration failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      verifyEmail: async (email: string, otp: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/verify-email', { email, otp });
          
          if (response.data.success) {
            const { user, tokens } = response.data.data;
            
            // Set tokens in API client
            apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.message || 'Email verification failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Email verification failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      resendOTP: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/resend-otp', { email });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to resend OTP');
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/login', { email, password });
          
          if (response.data.success) {
            const { user, tokens } = response.data.data;
            
            // Set tokens in API client
            apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          // Call logout endpoint if authenticated
          const { tokens } = get();
          if (tokens) {
            await apiClient.post('/auth/logout');
          }
        } catch (error) {
          console.log('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        }
        
        // Clear tokens from API client
        apiClient.clearAuth();
        
        // Clear auth state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Password management
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/forgot-password', { email });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to send reset code');
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset code';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (email: string, otp: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/reset-password', {
            email,
            otp,
            newPassword,
          });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Password reset failed');
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/change-password', {
            currentPassword,
            newPassword,
          });
          
          if (!response.data.success) {
            throw new Error(response.data.message || 'Password change failed');
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Profile management
      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.put('/auth/profile', data);
          
          if (response.data.success) {
            const updatedUser = response.data.data.user;
            
            set(state => ({
              user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
              isLoading: false,
            }));
          } else {
            throw new Error(response.data.message || 'Profile update failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      refreshProfile: async () => {
        try {
          const response = await apiClient.get('/auth/me');
          
          if (response.data.success) {
            const user = response.data.data.user;
            set({ user });
          }
        } catch (error) {
          console.log('Failed to refresh profile:', error);
        }
      },

      // Onboarding
      updateOnboarding: async (data: OnboardingData) => {
        set({ isLoading: true, error: null });
        
        try {
          let endpoint = '/auth/onboarding/basic';
          let payload = data;
          
          // Determine endpoint based on data type
          if (data.goals || data.interests) {
            endpoint = '/auth/onboarding/goals';
            payload = {
              goals: data.goals || [],
              interests: data.interests || [],
            };
          } else {
            payload = {
              gender: data.gender,
              ageRange: data.ageRange,
              studyLevel: data.studyLevel,
            };
          }
          
          const response = await apiClient.put(endpoint, payload);
          
          if (response.data.success) {
            const updatedUser = response.data.data.user;
            
            set(state => ({
              user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
              isLoading: false,
            }));
          } else {
            throw new Error(response.data.message || 'Onboarding update failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Onboarding update failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      completeOnboarding: async (interests?: string[], goals?: string[]) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/auth/onboarding/complete', {
            interests: interests || [],
            goals: goals || [],
          });
          
          if (response.data.success) {
            const updatedUser = response.data.data.user;
            
            set(state => ({
              user: state.user ? { ...state.user, ...updatedUser, isOnboarded: true } : updatedUser,
              isLoading: false,
            }));
          } else {
            throw new Error(response.data.message || 'Failed to complete onboarding');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Failed to complete onboarding';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // State management
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (tokens: AuthTokens | null) => {
        set({ tokens });
        
        if (tokens) {
          apiClient.setAuthTokens(tokens.accessToken, tokens.refreshToken);
        } else {
          apiClient.clearAuth();
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearAuth: () => {
        apiClient.clearAuth();
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Utilities
      checkAuthStatus: async () => {
        const { tokens } = get();
        
        if (!tokens) {
          return false;
        }
        
        try {
          const response = await apiClient.get('/auth/check');
          
          if (response.data.success) {
            const user = response.data.data.user;
            set({ user, isAuthenticated: true });
            return true;
          } else {
            get().clearAuth();
            return false;
          }
        } catch (error) {
          console.log('Auth check failed:', error);
          get().clearAuth();
          return false;
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        
        if (!tokens?.refreshToken) {
          return false;
        }
        
        try {
          const response = await apiClient.post('/auth/refresh-token', {
            refreshToken: tokens.refreshToken,
          });
          
          if (response.data.success) {
            const newTokens = response.data.data.tokens;
            get().setTokens(newTokens);
            return true;
          } else {
            get().clearAuth();
            return false;
          }
        } catch (error) {
          console.log('Token refresh failed:', error);
          get().clearAuth();
          return false;
        }
      },
    }),
    {
      name: 'mentormatch-auth',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);