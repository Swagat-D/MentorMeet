import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useFavoritesStore } from "@/stores/favorites-store";
import { mentors } from "@/mocks/mentors";
import MentorCard from "@/components/MentorCard";
import { Bookmark } from "lucide-react-native";
import { Mentor } from "@/types/mentor";

export default function FavoritesScreen() {
  const { favoriteMentors } = useFavoritesStore();
  const [favoriteMentorsList, setFavoriteMentorsList] = useState<Mentor[]>([]);

  useEffect(() => {
    const filteredMentors = mentors.filter(mentor => 
      favoriteMentors.includes(mentor.id)
    );
    setFavoriteMentorsList(filteredMentors);
  }, [favoriteMentors]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Favorites" }} />
      
      <FlatList
        data={favoriteMentorsList}
        renderItem={({ item }) => <MentorCard mentor={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.mentorsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bookmark size={60} color="#ccc" />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Bookmark mentors you like to find them easily later
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mentorsList: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});