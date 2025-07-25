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

import { MentorProfile } from "@/services/mentorService";
import { useFavoritesStore } from "@/stores/favorites-store";

type MentorCardProps = {
  mentor: MentorProfile;
  variant?: 'default' | 'compact' | 'featured';
  showQuickBook?: boolean;
};

export default function MentorCard({ 
  mentor, 
  variant = 'default',
  showQuickBook = true,
}: MentorCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const isBookmarked = isFavorite(mentor._id);

  const toggleFavorite = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (isBookmarked) {
      removeFavorite(mentor._id);
    } else {
      addFavorite(mentor._id);
    }
  };

  const handleQuickBook = (e: GestureResponderEvent) => {
    e.stopPropagation();
    // For now, navigate to mentor profile. In production, this would go to booking flow
    router.push(`/mentor/${mentor._id}`);
  };

  // Helper functions to extract data safely
  const getSubjectsDisplay = (): string[] => {
    if (!mentor.subjects || !Array.isArray(mentor.subjects)) return [];
    
    return mentor.subjects.map(subject => {
      if (typeof subject === 'string') return subject;
      if (subject && typeof subject === 'object' && subject.name) return subject.name;
      return 'General';
    }).slice(0, 3);
  };

  const getExpertiseDisplay = (): string[] => {
    if (!mentor.expertise || !Array.isArray(mentor.expertise)) return [];
    return mentor.expertise.slice(0, 2);
  };

  const getLanguagesDisplay = (): string[] => {
    if (!mentor.languages || !Array.isArray(mentor.languages)) return ['English'];
    return mentor.languages.slice(0, 2);
  };

  const getHourlyRate = (): number => {
    return mentor.pricing?.hourlyRate || 50;
  };

  const getCurrency = (): string => {
    return mentor.pricing?.currency || 'USD';
  };

  const getResponseTime = (): string => {
    const time = mentor.responseTime || 60;
    if (time < 60) return `${time}m`;
    const hours = Math.floor(time / 60);
    return `${hours}h`;
  };

  const subjectsDisplay = getSubjectsDisplay();
  const expertiseDisplay = getExpertiseDisplay();
  const languagesDisplay = getLanguagesDisplay();
  const isOnlineNow = mentor.isOnline || false;
  const displayName = mentor.displayName || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Anonymous Mentor';
  const location = mentor.location ? mentor.location.split(',')[0] : 'Remote';

  if (variant === 'compact') {
    return (
      <Pressable
        style={styles.compactCard}
        onPress={() => router.push(`/mentor/${mentor._id}`)}
      >
        <View style={styles.compactLeft}>
          <View style={styles.compactAvatarContainer}>
            <Image source={{ uri: mentor.profileImage }} style={styles.compactAvatar} />
            {isOnlineNow && <View style={styles.onlineIndicator} />}
            {mentor.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={12} color="#10B981" />
              </View>
            )}
          </View>
          
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>
              <TouchableOpacity onPress={toggleFavorite} style={styles.compactBookmark}>
                <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={16} color={isBookmarked ? "#8B4513" : "#8B7355"} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.compactExpertise} numberOfLines={1}>
              {expertiseDisplay.join(', ') || subjectsDisplay.join(', ') || 'General Teaching'}
            </Text>
            
            <View style={styles.compactMeta}>
              <View style={styles.compactRating}>
                <MaterialIcons name="star" size={12} color="#D4AF37" />
                <Text style={styles.compactRatingText}>{mentor.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.compactPrice}>From ${getHourlyRate()}</Text>
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
        onPress={() => router.push(`/mentor/${mentor._id}`)}
      >
        <View style={styles.featuredImageContainer}>
          <Image source={{ uri: mentor.profileImage }} style={styles.featuredAvatar} />
          {isOnlineNow && (
            <View style={styles.featuredOnlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
        </View>
        
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredName} numberOfLines={1}>{displayName}</Text>
            <TouchableOpacity onPress={toggleFavorite}>
              <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={18} color={isBookmarked ? "#8B4513" : "#8B7355"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.featuredExpertise} numberOfLines={2}>
            {expertiseDisplay.join(', ') || subjectsDisplay.join(', ') || 'General Teaching'}
          </Text>
          
          <View style={styles.featuredStats}>
            <View style={styles.featuredStat}>
              <MaterialIcons name="star" size={14} color="#D4AF37" />
              <Text style={styles.featuredStatText}>{mentor.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.featuredStat}>
              <MaterialIcons name="group" size={14} color="#8B7355" />
              <Text style={styles.featuredStatText}>{mentor.totalStudents}</Text>
            </View>
          </View>
          
          <Text style={styles.featuredPrice}>${getHourlyRate()}/{getCurrency()}</Text>
        </View>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/mentor/${mentor._id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: mentor.profileImage }} style={styles.avatar} />
          {isOnlineNow && <View style={styles.onlineIndicator} />}
          {mentor.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#10B981" />
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              {mentor.isVerified && (
                <MaterialIcons name="verified" size={16} color="#10B981" style={styles.verifiedIcon} />
              )}
            </View>
            <TouchableOpacity onPress={toggleFavorite} style={styles.bookmarkButton}>
              <MaterialIcons name={isBookmarked ? "bookmark" : "bookmark-border"} size={20} color={isBookmarked ? "#8B4513" : "#8B7355"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bio} numberOfLines={2}>
            {mentor.bio || `Expert in ${expertiseDisplay.join(', ') || subjectsDisplay.join(', ') || 'various subjects'}`}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={14} color="#D4AF37" />
              <Text style={styles.rating}>{mentor.rating.toFixed(1)}</Text>
              <Text style={styles.sessionCount}>({mentor.totalSessions} sessions)</Text>
            </View>
            
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={12} color="#8B7355" />
              <Text style={styles.location} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          
          <View style={styles.responseContainer}>
            <MaterialIcons name="schedule" size={12} color="#8B7355" />
            <Text style={styles.responseTime}>Responds in {getResponseTime()}</Text>
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
      
      <View style={styles.expertiseContainer}>
        {expertiseDisplay.length > 0 ? (
          expertiseDisplay.map((skill, index) => (
            <View key={index} style={styles.expertiseTag}>
              <Text style={styles.expertiseText} numberOfLines={1}>{skill}</Text>
            </View>
          ))
        ) : (
          subjectsDisplay.map((subject, index) => (
            <View key={index} style={styles.expertiseTag}>
              <Text style={styles.expertiseText} numberOfLines={1}>{subject}</Text>
            </View>
          ))
        )}
        {(expertiseDisplay.length > 2 || subjectsDisplay.length > 3) && (
          <Text style={styles.moreSkills}>
            +{(expertiseDisplay.length || subjectsDisplay.length) - (expertiseDisplay.length > 0 ? 2 : 3)}
          </Text>
        )}
      </View>
      
      <View style={styles.languagesContainer}>
        <MaterialIcons name="language" size={14} color="#8B7355" />
        <Text style={styles.languagesText}>
          {languagesDisplay.join(', ')}
        </Text>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.price}>${getHourlyRate()}</Text>
          <Text style={styles.priceUnit}>/{getCurrency()}</Text>
        </View>
        
        {showQuickBook && (
          <TouchableOpacity 
            style={styles.quickBookButton}
            onPress={handleQuickBook}
            activeOpacity={0.8}
          >
            <Text style={styles.quickBookText}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Default card styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8DDD1",
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
    backgroundColor: "#F0F0F0",
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
    borderColor: "#FFFFFF",
  },
  verifiedBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 2,
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
    color: "#2A2A2A",
    marginRight: 6,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  bookmarkButton: {
    padding: 4,
  },
  bio: {
    fontSize: 14,
    color: "#8B7355",
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
    color: "#2A2A2A",
    marginLeft: 4,
  },
  sessionCount: {
    fontSize: 12,
    color: "#8B7355",
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
    color: "#8B7355",
    marginLeft: 4,
    flex: 1,
  },
  responseContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  responseTime: {
    fontSize: 12,
    color: "#8B7355",
    marginLeft: 4,
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1C4B8",
    marginHorizontal: 8,
  },
  onlineText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: 4,
  },
  expertiseContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  expertiseTag: {
    backgroundColor: "#F8F3EE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  expertiseText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "500",
  },
  moreSkills: {
    fontSize: 12,
    color: "#8B7355",
    fontWeight: "500",
  },
  languagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  languagesText: {
    fontSize: 12,
    color: "#8B7355",
    marginLeft: 6,
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
    color: "#8B7355",
    marginRight: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
  },
  priceUnit: {
    fontSize: 12,
    color: "#8B7355",
    marginLeft: 2,
  },
  quickBookButton: {
    backgroundColor: "#8B4513",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickBookText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Compact card styles
  compactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8DDD1",
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
    backgroundColor: "#F0F0F0",
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
    color: "#2A2A2A",
    flex: 1,
  },
  compactBookmark: {
    padding: 4,
  },
  compactExpertise: {
    fontSize: 12,
    color: "#8B7355",
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
    color: "#2A2A2A",
    marginLeft: 2,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B4513",
  },

  // Featured card styles
  featuredCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  featuredImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  featuredAvatar: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  featuredOnlineIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
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
    color: "#2A2A2A",
    flex: 1,
  },
  featuredExpertise: {
    fontSize: 12,
    color: "#8B7355",
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
    color: "#8B7355",
    marginLeft: 4,
    fontWeight: "500",
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B4513",
  },
});