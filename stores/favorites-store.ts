import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type FavoritesState = {
  favoriteMentors: string[];
  addFavorite: (mentorId: string) => void;
  removeFavorite: (mentorId: string) => void;
  isFavorite: (mentorId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteMentors: [],
      addFavorite: (mentorId) => {
        set((state) => ({
          favoriteMentors: [...state.favoriteMentors, mentorId],
        }));
      },
      removeFavorite: (mentorId) => {
        set((state) => ({
          favoriteMentors: state.favoriteMentors.filter((id) => id !== mentorId),
        }));
      },
      isFavorite: (mentorId) => {
        return get().favoriteMentors.includes(mentorId);
      },
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);