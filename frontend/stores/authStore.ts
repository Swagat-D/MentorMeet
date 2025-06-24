// stores/authStore.ts - Enhanced Auth Store with Gender Field
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
type UserStats = {
  totalHoursLearned: number;
  averageRating: number;
  sessionsCompleted: number;
  mentorsConnected: number;
  studyStreak: number;
  completionRate: number;
  monthlyHours: number;
  weeklyGoalProgress: number;
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  interests?: string[];
  goals?: string[];
  role: 'mentee' | 'mentor';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: UserStats;
  ageRange: string;
  studyLevel: string;
  gender: string; // Added gender field
}

export interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  
  // Session state
  accessToken: string | null;
  
  // Onboarding state
  onboardingStep: number;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'mentee' | 'mentor';
  }) => Promise<void>;
  logout: () => void;
  
  // Profile actions
  updateProfile: (updates: Partial<User>) => void;
  
  // Onboarding actions
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (interests?: string[], goals?: string[]) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
}

const createUser = (userData: any): User => ({
  id: userData.id || `user_${Date.now()}`,
  name: userData.name || '',
  email: userData.email || '',
  avatar: userData.avatar,
  phone: userData.phone,
  interests: userData.interests || [],
  goals: userData.goals || [],
  role: userData.role || 'mentee',
  isEmailVerified: userData.isEmailVerified || false,
  createdAt: userData.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ageRange: userData.ageRange || '',
  studyLevel: userData.studyLevel || '',
  gender: userData.gender || '', // Added gender field
  stats: userData.stats || {
    totalHoursLearned: 42,
    averageRating: 4.8,
    sessionsCompleted: 15,
    mentorsConnected: 5,
    studyStreak: 7,
    completionRate: 85,
    monthlyHours: 28,
    weeklyGoalProgress: 75,
  },
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
      accessToken: null,
      onboardingStep: 0,

      // Authentication actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Mock user data - in real app, this comes from API
          const userData = {
            id: `user_${Date.now()}`,
            name: email.split('@')[0], // Use email prefix as name
            email,
            role: 'mentee' as const,
            isEmailVerified: true,
            interests: [],
            goals: [],
          };

          const user = createUser(userData);

          set({
            user,
            isAuthenticated: true,
            isOnboarded: user.interests && user.interests.length > 0,
            accessToken: `mock_token_${Date.now()}`,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));

          const user = createUser({
            ...userData,
            id: `user_${Date.now()}`,
          });

          set({
            user,
            isAuthenticated: true,
            isOnboarded: false, // New users need onboarding
            accessToken: `mock_token_${Date.now()}`,
            onboardingStep: 1,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
          accessToken: null,
          onboardingStep: 0,
        });
      },

      // Profile actions
      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      // Onboarding actions
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      completeOnboarding: (interests = [], goals = []) => {
        const { user } = get();
        if (user) {
          const updatedUser = {
            ...user,
            interests,
            goals,
            updatedAt: new Date().toISOString(),
          };

          set({
            user: updatedUser,
            isOnboarded: true,
            onboardingStep: 0,
          });
        }
      },

      // Utility actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
        accessToken: state.accessToken,
        onboardingStep: state.onboardingStep,
      }),
    }
  )
);