import { useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { mentors } from "@/mocks/mentors";
import { Star, Calendar, Clock, MapPin, Award, BookOpen, ChevronRight, Bookmark } from "lucide-react-native";
import ReviewCard from "@/components/ReviewCard";
import { useFavoritesStore } from "@/stores/favorites-store";

export default function MentorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  
  const mentor = mentors.find((m) => m.id === id);
  const isBookmarked = isFavorite(id);
  
  if (!mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Mentor not found</Text>
      </SafeAreaView>
    );
  }

  const toggleFavorite = () => {
    if (isBookmarked) {
      removeFavorite(id);
    } else {
      addFavorite(id);
    }
  };

  const displayedReviews = showAllReviews
    ? mentor.reviews
    : mentor.reviews.slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView>
        <View style={styles.header}>
          <Image source={{ uri: mentor.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{mentor.name}</Text>
          <Text style={styles.title}>{mentor.title}</Text>
          
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>
              {mentor.rating} ({mentor.reviews.length} reviews)
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.location}>{mentor.location}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.favoriteButton, isBookmarked && styles.favoriteButtonActive]} 
            onPress={toggleFavorite}
          >
            <Bookmark 
              size={18} 
              color={isBookmarked ? "#fff" : "#5B8FF9"} 
              fill={isBookmarked ? "#fff" : "transparent"} 
            />
            <Text style={[styles.favoriteButtonText, isBookmarked && styles.favoriteButtonTextActive]}>
              {isBookmarked ? "Bookmarked" : "Add to Favorites"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{mentor.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.expertiseContainer}>
            {mentor.subjects.map((subject) => (
              <View key={subject} style={styles.expertiseTag}>
                <Text style={styles.expertiseText}>{subject}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Experience</Text>
          {mentor.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Award size={16} color="#5B8FF9" />
              <View style={styles.educationContent}>
                <Text style={styles.educationTitle}>{edu.degree}</Text>
                <Text style={styles.educationSubtitle}>{edu.institution}</Text>
                <Text style={styles.educationYear}>{edu.year}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Types</Text>
          {mentor.sessionTypes.map((session, index) => (
            <View key={index} style={styles.sessionItem}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleContainer}>
                  <BookOpen size={16} color="#5B8FF9" />
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                </View>
                <Text style={styles.sessionPrice}>${session.price}</Text>
              </View>
              <Text style={styles.sessionDescription}>{session.description}</Text>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionDetail}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.sessionDetailText}>{session.duration} min</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {mentor.reviews.length > 2 && (
              <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
                <Text style={styles.viewAllText}>
                  {showAllReviews ? "Show Less" : "View All"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {displayedReviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </View>

        <View style={styles.bookingSection}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/booking/${mentor.id}`)}
          >
            <Calendar size={20} color="#fff" />
            <Text style={styles.bookButtonText}>Book a Session</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
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
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5B8FF9",
  },
  favoriteButtonActive: {
    backgroundColor: "#5B8FF9",
  },
  favoriteButtonText: {
    fontSize: 14,
    color: "#5B8FF9",
    marginLeft: 6,
  },
  favoriteButtonTextActive: {
    color: "#fff",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  expertiseTag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  expertiseText: {
    fontSize: 14,
    color: "#666",
  },
  educationItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  educationContent: {
    marginLeft: 12,
    flex: 1,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  educationSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 14,
    color: "#999",
  },
  sessionItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
  sessionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: "row",
  },
  sessionDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  sessionDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#5B8FF9",
    fontWeight: "600",
  },
  bookingSection: {
    padding: 20,
    paddingBottom: 40,
  },
  bookButton: {
    backgroundColor: "#5B8FF9",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },
});