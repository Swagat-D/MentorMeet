// stores/favorites-store.ts - Favorites Management Store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  favoriteIds: string[];
  isLoading: boolean;
}

interface FavoritesActions {
  addFavorite: (mentorId: string) => void;
  removeFavorite: (mentorId: string) => void;
  isFavorite: (mentorId: string) => boolean;
  clearFavorites: () => void;
  getFavoriteCount: () => number;
  syncFavorites: () => Promise<void>;
}

type FavoritesStore = FavoritesState & FavoritesActions;

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      favoriteIds: [],
      isLoading: false,

      // Actions
      addFavorite: (mentorId: string) => {
        const currentFavorites = get().favoriteIds;
        if (!currentFavorites.includes(mentorId)) {
          set({
            favoriteIds: [...currentFavorites, mentorId],
          });
          
          // In a real app, sync with backend
          // syncToBackend('add', mentorId);
        }
      },

      removeFavorite: (mentorId: string) => {
        const currentFavorites = get().favoriteIds;
        set({
          favoriteIds: currentFavorites.filter(id => id !== mentorId),
        });
        
        // In a real app, sync with backend
        // syncToBackend('remove', mentorId);
      },

      isFavorite: (mentorId: string) => {
        return get().favoriteIds.includes(mentorId);
      },

      clearFavorites: () => {
        set({ favoriteIds: [] });
      },

      getFavoriteCount: () => {
        return get().favoriteIds.length;
      },

      syncFavorites: async () => {
        set({ isLoading: true });
        
        try {
          // Simulate API call to sync favorites
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real app, this would fetch favorites from the backend
          // and update the local state accordingly
          
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to sync favorites:', error);
        }
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
      }),
    }
  )
);