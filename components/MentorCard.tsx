import { View, Text, StyleSheet, Image, TouchableOpacity, GestureResponderEvent } from "react-native";
import { router } from "expo-router";
import { Star, Bookmark } from "lucide-react-native";
import { Mentor } from "@/types/mentor";
import { useFavoritesStore } from "@/stores/favorites-store";

type MentorCardProps = {
  mentor: Mentor;
};

export default function MentorCard({ mentor }: MentorCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const isBookmarked = isFavorite(mentor.id);

  const toggleFavorite = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (isBookmarked) {
      removeFavorite(mentor.id);
    } else {
      addFavorite(mentor.id);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/mentor/${mentor.id}`)}
    >
      <Image source={{ uri: mentor.avatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{mentor.name}</Text>
          <TouchableOpacity 
            style={styles.bookmarkButton} 
            onPress={toggleFavorite}
          >
            <Bookmark 
              size={20} 
              color={isBookmarked ? "#5B8FF9" : "#ccc"} 
              fill={isBookmarked ? "#5B8FF9" : "transparent"} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title} numberOfLines={1}>{mentor.title}</Text>
        
        <View style={styles.ratingContainer}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>
            {mentor.rating} ({mentor.reviews.length} reviews)
          </Text>
        </View>
        
        <View style={styles.subjectsContainer}>
          {mentor.subjects.slice(0, 2).map((subject, index) => (
            <View key={index} style={styles.subjectTag}>
              <Text style={styles.subjectText} numberOfLines={1}>{subject}</Text>
            </View>
          ))}
          {mentor.subjects.length > 2 && (
            <Text style={styles.moreSubjects}>+{mentor.subjects.length - 2}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>From</Text>
        <Text style={styles.price}>
          ${Math.min(...mentor.sessionTypes.map((s) => s.price))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  subjectsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  subjectTag: {
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 12,
    color: "#666",
  },
  moreSubjects: {
    fontSize: 12,
    color: "#999",
  },
  priceContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    minWidth: 60,
  },
  priceLabel: {
    fontSize: 12,
    color: "#999",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5B8FF9",
  },
});