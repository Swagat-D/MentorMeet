import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { mentors } from "@/mocks/mentors";
import { subjects } from "@/constants/subjects";
import { Star } from "lucide-react-native";
import MentorCard from "@/components/MentorCard";
import { MentorCardSkeleton } from "@/components/SkeletonLoader";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [filteredMentors, setFilteredMentors] = useState(mentors);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredMentors(mentors);
    } else {
      setFilteredMentors(
        mentors.filter((mentor) => mentor.subjects.includes(selectedCategory))
      );
    }
  }, [selectedCategory]);

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4].map((item) => (
        <MentorCardSkeleton key={item} />
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || "Student"}</Text>
            <Text style={styles.subtitle}>Find your perfect mentor today</Text>
          </View>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" }}
            style={styles.avatar}
          />
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Mentors</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          >
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <View key={item} style={styles.featuredItem}>
                  <View style={styles.featuredImageSkeleton} />
                  <View style={styles.featuredInfo}>
                    <View style={styles.featuredNameSkeleton} />
                    <View style={styles.featuredSubjectSkeleton} />
                    <View style={styles.featuredRatingSkeleton} />
                  </View>
                </View>
              ))
            ) : (
              mentors.slice(0, 5).map((mentor) => (
                <TouchableOpacity
                  key={mentor.id}
                  style={styles.featuredItem}
                  onPress={() => router.push(`/mentor/${mentor.id}`)}
                >
                  <Image source={{ uri: mentor.avatar }} style={styles.featuredImage} />
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{mentor.name}</Text>
                    <Text style={styles.featuredSubject}>{mentor.title}</Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.ratingText}>{mentor.rating}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Browse by Subject</Text>
          <FlatList
            data={["All", ...subjects]}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <View style={styles.mentorsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All" ? "All Mentors" : selectedCategory + " Mentors"}
          </Text>
          <View style={styles.mentorsList}>
            {isLoading ? (
              renderSkeletons()
            ) : (
              filteredMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  featuredSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featuredList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  featuredItem: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: 120,
  },
  featuredImageSkeleton: {
    width: "100%",
    height: 120,
    backgroundColor: "#E1E9EE",
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  featuredNameSkeleton: {
    height: 16,
    width: "70%",
    backgroundColor: "#E1E9EE",
    marginBottom: 8,
    borderRadius: 4,
  },
  featuredSubject: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  featuredSubjectSkeleton: {
    height: 14,
    width: "90%",
    backgroundColor: "#E1E9EE",
    marginBottom: 8,
    borderRadius: 4,
  },
  featuredRatingSkeleton: {
    height: 14,
    width: "40%",
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  categoriesSection: {
    marginTop: 30,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  selectedCategoryItem: {
    backgroundColor: "#5B8FF9",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  mentorsSection: {
    marginTop: 30,
    paddingBottom: 30,
  },
  mentorsList: {
    paddingHorizontal: 20,
  },
});