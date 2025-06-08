// app/favorites.tsx - Favorites Page with Header
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Heart, Search } from "lucide-react-native";
import { useFavoritesStore } from "@/stores/favorites-store";
import { mentors } from "@/mocks/mentors";
import MentorCard from "@/components/cards/MentorCard";
import SecondaryHeader from "@/components/navigation/SecondaryHeader";

export default function FavoritesScreen() {
  const { favoriteIds } = useFavoritesStore();
  const [favoriteMentors, setFavoriteMentors] = useState<any[]>([]);

  useEffect(() => {
    const favorites = mentors.filter(mentor => favoriteIds.includes(mentor.id));
    setFavoriteMentors(favorites);
  }, [favoriteIds]);

  const rightComponent = (
    <TouchableOpacity 
      style={styles.searchButton}
      onPress={() => router.push('/(tabs)/search')}
    >
      <Search size={20} color="#6B7280" />
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Heart size={48} color="#E5E7EB" />
      </View>
      <Text style={styles.emptyTitle}>No saved mentors yet</Text>
      <Text style={styles.emptySubtitle}>
        Save mentors you're interested in to easily find them later
      </Text>
      <TouchableOpacity
        style={styles.findMentorsButton}
        onPress={() => router.push('/(tabs)/search')}
      >
        <Text style={styles.findMentorsButtonText}>Find Mentors</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SecondaryHeader 
        title="Saved Mentors" 
        subtitle={`${favoriteMentors.length} mentor${favoriteMentors.length !== 1 ? 's' : ''} saved`}
        rightComponent={rightComponent}
      />
      
      {favoriteMentors.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={favoriteMentors}
          renderItem={({ item }) => <MentorCard mentor={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.mentorsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  mentorsList: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  findMentorsButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  findMentorsButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

