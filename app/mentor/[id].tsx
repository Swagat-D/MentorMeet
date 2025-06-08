
// app/mentor/[id].tsx - Updated Mentor Profile with Header
import { useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { mentors } from "@/mocks/mentors";
import { Star, Calendar, Clock, MapPin, Award, BookOpen, ChevronRight, Bookmark, Share } from "lucide-react-native";
import ReviewCard from "@/components/cards/ReviewCard";
import { useFavoritesStore } from "@/stores/favorites-store";
import SecondaryHeader from "@/components/navigation/SecondaryHeader";

export default function MentorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  
  const mentor = mentors.find((m) => m.id === id);
  const isBookmarked = isFavorite(id || '');
  
  if (!mentor) {
    return (
      <View style={styles.container}>
        <SecondaryHeader title="Mentor Not Found" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mentor not found</Text>
        </View>
      </View>
    );
  }

  const toggleFavorite = () => {
    if (isBookmarked) {
      removeFavorite(id || '');
    } else {
      addFavorite(id || '');
    }
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share mentor profile');
  };

  const displayedReviews = showAllReviews
    ? mentor.reviews
    : mentor.reviews.slice(0, 2);

  const rightComponent = (
    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
        <Share size={20} color="#6B7280" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.headerButton, isBookmarked && styles.headerButtonActive]} 
        onPress={toggleFavorite}
      >
        <Bookmark 
          size={20} 
          color={isBookmarked ? "#4F46E5" : "#6B7280"} 
          fill={isBookmarked ? "#4F46E5" : "transparent"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SecondaryHeader 
        title={mentor.name} 
        subtitle={mentor.title}
        rightComponent={rightComponent}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: mentor.avatar }} style={styles.avatar} />
          
          <View style={styles.ratingContainer}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.rating}>
              {mentor.rating} ({mentor.reviews.length} reviews)
            </Text>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#9CA3AF" />
            <Text style={styles.location}>{mentor.location}</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{mentor.bio}</Text>
        </View>

        {/* Expertise */}
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

        {/* Session Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Types</Text>
          {mentor.sessionTypes.map((session, index) => (
            <View key={index} style={styles.sessionItem}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleContainer}>
                  <BookOpen size={16} color="#4F46E5" />
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                </View>
                <Text style={styles.sessionPrice}>${session.price}</Text>
              </View>
              <Text style={styles.sessionDescription}>{session.description}</Text>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionDetail}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.sessionDetailText}>{session.duration} min</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Reviews */}
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

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Book Session Button */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginLeft: 8,
  },
  headerButtonActive: {
    backgroundColor: "#EEF2FF",
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 14,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  expertiseTag: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  expertiseText: {
    fontSize: 14,
    color: "#6B7280",
  },
  sessionItem: {
    backgroundColor: "#F9FAFB",
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
    color: "#1F2937",
    marginLeft: 8,
  },
  sessionPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  sessionDescription: {
    fontSize: 14,
    color: "#6B7280",
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
    color: "#6B7280",
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
    color: "#4F46E5",
    fontWeight: "600",
  },
  bookingSection: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  bookButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  bottomPadding: {
    height: 20,
  },
});