// components/cards/MentorCard.tsx - Enhanced Professional Mentor Card
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  GestureResponderEvent,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

import { Mentor } from "@/types/mentor";
import { useFavoritesStore } from "@/stores/favorites-store";

type MentorCardProps = {
  mentor: Mentor;
  variant?: 'default' | 'compact' | 'featured';
  showQuickBook?: boolean;
};

export default function MentorCard({ 
  mentor, 
  variant = 'default',
  showQuickBook = true,
}: MentorCardProps) {
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

  const handleQuickBook = (e: GestureResponderEvent) => {
    e.stopPropagation();
    router.push(`/booking/${mentor.id}`);
  };

  const minPrice = Math.min(...mentor.sessionTypes.map((s) => s.price));
  const isOnlineNow = mentor.isOnline;
  const responseTime = mentor.stats.responseTime;

  if (variant === 'compact') {
    return (
      <Pressable
        style={styles.compactCard}
        onPress={() => router.push(`/mentor/${mentor.id}`)}
      >
        <View style={styles.compactLeft}>
          <View style={styles.compactAvatarContainer}>
            <Image source={{ uri: mentor.avatar }} style={styles.compactAvatar} />
            {isOnlineNow && <View style={styles.onlineIndicator} />}
            {mentor.isPremium && (
              <View style={styles.premiumBadge}>
                <MaterialIcons name="workspace-premium" size={10} color="#F59E0B" />
              </View>
            )}
          </View>
          
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <Text style={styles.compactName} numberOfLines={1}>{mentor.name}</Text>
              <TouchableOpacity onPress={toggleFavorite} style={styles.compactBookmark}>
                <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={16} color={isBookmarked ? "#4F46E5" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.compactTitle} numberOfLines={1}>{mentor.title}</Text>
            
            <View style={styles.compactMeta}>
              <View style={styles.compactRating}>
                <MaterialIcons name="star" size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.compactRatingText}>{mentor.rating}</Text>
              </View>
              <Text style={styles.compactPrice}>From ${minPrice}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  if (variant === 'featured') {
    return (
      <Pressable
        style={styles.featuredCard}
        onPress={() => router.push(`/mentor/${mentor.id}`)}
      >
        <Image source={{ uri: mentor.avatar }} style={styles.featuredAvatar} />
        
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredName} numberOfLines={1}>{mentor.name}</Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={18} color={isBookmarked ? "#4F46E5" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.featuredTitle} numberOfLines={2}>{mentor.title}</Text>
          
          <View style={styles.featuredStats}>
            <View style={styles.featuredStat}>
              <MaterialIcons name="star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.featuredStatText}>{mentor.rating}</Text>
            </View>
            <View style={styles.featuredStat}>
              <MaterialIcons name="group" size={14} color="#6B7280" />
              <Text style={styles.featuredStatText}>{mentor.stats.totalStudents}</Text>
            </View>
          </View>
          
          <Text style={styles.featuredPrice}>From ${minPrice}/session</Text>
        </View>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/mentor/${mentor.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: mentor.avatar }} style={styles.avatar} />
          {isOnlineNow && <View style={styles.onlineIndicator} />}
          {mentor.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{mentor.name}</Text>
              {mentor.isPremium && (
                <MaterialIcons name="workspace-premium" size={16} color="#F59E0B" style={styles.premiumIcon} />
              )}
            </View>
            <TouchableOpacity onPress={toggleFavorite} style={styles.bookmarkButton}>
              <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={20} color={isBookmarked ? "#4F46E5" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title} numberOfLines={2}>{mentor.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.rating}>{mentor.rating}</Text>
              <Text style={styles.reviewCount}>({mentor.reviews.length})</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <MaterialIcons name="my-location" size={12} color="#9CA3AF" />
              <Text style={styles.location} numberOfLines={1}>
                {mentor.location.split(',')[0]}
              </Text>
            </View>
          </View>
          
          <View style={styles.responseContainer}>
            <MaterialIcons name="schedule" size={12} color="#6B7280" />
            <Text style={styles.responseTime}>Responds {responseTime}</Text>
            {isOnlineNow && (
              <>
                <View style={styles.separator} />
                <MaterialIcons name="flash-on" size={12} color="#10B981" />
                <Text style={styles.onlineText}>Online now</Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.subjectsContainer}>
        {mentor.subjects.slice(0, 3).map((subject, index) => (
          <View key={index} style={styles.subjectTag}>
            <Text style={styles.subjectText} numberOfLines={1}>{subject}</Text>
          </View>
        ))}
        {mentor.subjects.length > 3 && (
          <Text style={styles.moreSubjects}>+{mentor.subjects.length - 3}</Text>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>${minPrice}</Text>
          <Text style={styles.priceUnit}>/session</Text>
        </View>
        
        {showQuickBook && (
          <TouchableOpacity 
            style={styles.quickBookButton}
            onPress={handleQuickBook}
            activeOpacity={0.8}
          >
            <Text style={styles.quickBookText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Default card styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginRight: 6,
  },
  premiumIcon: {
    marginLeft: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  title: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 16,
  },
  location: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 4,
    flex: 1,
  },
  responseContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  responseTime: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 8,
  },
  onlineText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: 4,
  },
  subjectsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  subjectTag: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  moreSubjects: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  priceUnit: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 2,
  },
  quickBookButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickBookText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Compact card styles
  compactCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  compactLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  premiumBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 2,
  },
  compactContent: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  compactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  compactBookmark: {
    padding: 4,
  },
  compactTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  compactMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 2,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },

  // Featured card styles
  featuredCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  featuredAvatar: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  featuredContent: {
    flex: 1,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  featuredTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 16,
  },
  featuredStats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  featuredStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  featuredStatText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
});