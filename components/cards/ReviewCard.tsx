import { View, Text, StyleSheet, Image } from "react-native";
import { Star } from "lucide-react-native";
import { Review } from "@/types/mentor";

type ReviewCardProps = {
  review: Review;
};

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: review.avatar }} style={styles.avatar} />
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{review.name}</Text>
          <Text style={styles.date}>{review.date}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              color="#FFD700"
              fill={star <= review.rating ? "#FFD700" : "transparent"}
            />
          ))}
        </View>
      </View>
      
      <Text style={styles.comment}>{review.comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  comment: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});