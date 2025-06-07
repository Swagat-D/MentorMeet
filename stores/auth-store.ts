import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  interests?: string[];
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isDarkMode: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  completeOnboarding: (interests: string[]) => void;
  toggleDarkMode: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,
      isDarkMode: false,
      login: (email, password) => {
        // In a real app, this would validate credentials with a backend
        set({
          user: {
            id: "user-1",
            name: "Student User",
            email,
          },
          isAuthenticated: true,
        });
      },
      signup: (name, email, password) => {
        // In a real app, this would register the user with a backend
        set({
          user: {
            id: "user-" + Date.now(),
            name,
            email,
          },
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isOnboarded: false,
        });
      },
      completeOnboarding: (interests) => {
        set((state) => ({
          isOnboarded: true,
          user: state.user
            ? {
                ...state.user,
                interests,
              }
            : null,
        }));
      },
      toggleDarkMode: () => {
        set((state) => ({
          isDarkMode: !state.isDarkMode,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);