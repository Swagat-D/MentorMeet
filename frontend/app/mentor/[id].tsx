import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import mentorService, { MentorProfile } from "@/services/mentorService";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useAuthStore } from "@/stores/authStore";

const { width } = Dimensions.get('window');

export default function MentorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuthStore();

  const isBookmarked = isFavorite(id || '');

  useEffect(() => {
    if (id) {
      fetchMentorData();
    }
  }, [id]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const mentorData = await mentorService.getMentorById(id!);
      
      if (!mentorData) {
        setError('Mentor not found');
        return;
      }
      
      setMentor(mentorData);
    } catch (err: any) {
      console.error('Error fetching mentor:', err);
      setError(err.message || 'Failed to load mentor profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    if (isBookmarked) {
      removeFavorite(id || '');
      Alert.alert('Removed', 'Mentor removed from favorites');
    } else {
      addFavorite(id || '');
      Alert.alert('Added', 'Mentor added to favorites');
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Share Mentor Profile',
      `Share ${mentor?.displayName}'s profile with others?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => console.log('Share functionality to be implemented') }
      ]
    );
  };

  const handleSocialLink = (url: string, platform: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', `Cannot open ${platform} link`);
      });
    }
  };

const handleBookSession = async () => {
  if (!mentor) return;
  
  // Check if user is logged in
  if (!user) {
    Alert.alert(
      'Login Required',
      'Please log in to book a session with this mentor.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: () => router.push('/auth/login')
        }
      ]
    );
    return;
  }

  // Check if user is trying to book themselves
  if (user.id === mentor._id) {
    Alert.alert(
      'Cannot Book',
      'You cannot book a session with yourself.',
      [{ text: 'OK' }]
    );
    return;
  }

  try {
    setBookingLoading(true);
    
    // Navigate to booking flow
    router.push({
      pathname: '/booking/[mentorId]',
      params: { mentorId: mentor._id }
    });
    
  } catch (error: any) {
    console.error('❌ Error initiating booking:', error);
    Alert.alert(
      'Booking Error',
      'Unable to start booking process. Please try again.',
      [{ text: 'OK' }]
    );
  } finally {
    setBookingLoading(false);
  }
};

const handleQuickMessage = () => {
  if (!user) {
    Alert.alert(
      'Login Required',
      'Please log in to message this mentor.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/auth/login') }
      ]
    );
    return;
  }

  Alert.alert(
    'Send Message',
    `Send a message to ${mentor?.displayName}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Send Message', 
        onPress: () => {
          // Navigate to chat or message screen
          router.push({
            pathname: '/chat/[mentorId]',
            params: { mentorId: mentor?._id }
          });
        }
      }
    ]
  );
};

  const renderAvailabilityDay = (day: string, slots: any[]) => {
    if (!slots || slots.length === 0) {
      return (
        <Text key={day} style={styles.unavailableDay}>
          {day.charAt(0).toUpperCase() + day.slice(1)}: Not Available
        </Text>
      );
    }

    return (
      <View key={day} style={styles.availabilityDay}>
        <Text style={styles.dayName}>
          {day.charAt(0).toUpperCase() + day.slice(1)}:
        </Text>
        {slots.map((slot, index) => (
          <Text key={index} style={styles.timeSlot}>
            {slot.startTime} - {slot.endTime}
          </Text>
        ))}
      </View>
    );
  };

  const renderSubjects = () => {
    if (!mentor?.subjects || mentor.subjects.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.subjectsContainer}>
          {mentor.subjects.map((subject, index) => (
            <View key={index} style={styles.subjectTag}>
              <Text style={styles.subjectText}>
                {typeof subject === "string" ? subject : subject.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPricing = () => {
    if (!mentor?.pricing) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.pricingCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Hourly Rate:</Text>
            <Text style={styles.priceValue}>
              ${mentor.pricing.hourlyRate} {mentor.pricing.currency || 'USD'}
            </Text>
          </View>
          
          {mentor.pricing.trialSessionEnabled && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Trial Session:</Text>
              <Text style={styles.priceValue}>
                ${mentor.pricing.trialSessionRate} {mentor.pricing.currency || 'USD'}
              </Text>
            </View>
          )}
          
          {mentor.pricing.groupSessionEnabled && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Group Session:</Text>
              <Text style={styles.priceValue}>
                ${mentor.pricing.groupSessionRate} {mentor.pricing.currency || 'USD'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading mentor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mentor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#8B7355" />
          <Text style={styles.errorTitle}>{error || 'Mentor not found'}</Text>
          <Text style={styles.errorText}>
            The mentor profile could not be loaded. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMentorData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#8B4513" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {mentor.displayName}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#8B7355" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, isBookmarked && styles.headerButtonActive]} 
            onPress={toggleFavorite}
          >
            <MaterialIcons
              name={isBookmarked ? "bookmark" : "bookmark-border"} 
              size={20} 
              color={isBookmarked ? "#8B4513" : "#8B7355"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: mentor.profileImage }} style={styles.avatar} />
          
          <Text style={styles.mentorName}>{mentor.displayName}</Text>
          
          {mentor.bio && (
            <Text style={styles.mentorBio}>{mentor.bio}</Text>
          )}
          
          <View style={styles.metaContainer}>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#D4AF37" />
              <Text style={styles.rating}>
                {mentor.rating.toFixed(1)} ({mentor.totalSessions} sessions)
              </Text>
            </View>
            
            {mentor.location && (
              <View style={styles.locationContainer}>
                <MaterialIcons name="location-on" size={16} color="#8B7355" />
                <Text style={styles.location}>{mentor.location}</Text>
              </View>
            )}
            
            {mentor.isOnline && (
              <View style={styles.onlineContainer}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online now</Text>
              </View>
            )}
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleQuickMessage}
            >
              <MaterialIcons name="message" size={18} color="#8B4513" />
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push(`/mentor/${mentor._id}/reviews`)}
            >
              <MaterialIcons name="rate-review" size={18} color="#8B4513" />
              <Text style={styles.quickActionText}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Expertise Section */}
        {mentor.expertise && mentor.expertise.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expertise</Text>
            <View style={styles.expertiseContainer}>
              {mentor.expertise.map((skill, index) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Subjects Section */}
        {renderSubjects()}

        {/* Teaching Styles */}
        {mentor.teachingStyles && mentor.teachingStyles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching Style</Text>
            <View style={styles.teachingStylesContainer}>
              {mentor.teachingStyles.map((style, index) => (
                <View key={index} style={styles.teachingStyleTag}>
                  <MaterialIcons name="school" size={16} color="#8B4513" />
                  <Text style={styles.teachingStyleText}>{style}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {mentor.languages && mentor.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.languagesContainer}>
              {mentor.languages.map((language, index) => (
                <View key={index} style={styles.languageTag}>
                  <MaterialIcons name="language" size={16} color="#8B4513" />
                  <Text style={styles.languageText}>{language}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing Section */}
        {renderPricing()}

        {/* Availability Section */}
        {mentor.weeklySchedule && Object.keys(mentor.weeklySchedule).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityContainer}>
              {Object.entries(mentor.weeklySchedule).map(([day, slots]) => 
                renderAvailabilityDay(day, slots as any[])
              )}
            </View>
          </View>
        )}

        {/* Social Links */}
        {mentor.socialLinks && Object.values(mentor.socialLinks).some(link => link) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            <View style={styles.socialLinksContainer}>
              {mentor.socialLinks.linkedin && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(mentor.socialLinks.linkedin!, 'LinkedIn')}
                >
                  <MaterialIcons name="work" size={20} color="#0077B5" />
                  <Text style={styles.socialButtonText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              
              {mentor.socialLinks.github && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(mentor.socialLinks.github!, 'GitHub')}
                >
                  <MaterialIcons name="code" size={20} color="#333" />
                  <Text style={styles.socialButtonText}>GitHub</Text>
                </TouchableOpacity>
              )}
              
              {mentor.socialLinks.website && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocialLink(mentor.socialLinks.website!, 'Website')}
                >
                  <MaterialIcons name="public" size={20} color="#8B4513" />
                  <Text style={styles.socialButtonText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.responseTime || 60}m</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Book Session Button */}
      <View style={styles.bookingSection}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            bookingLoading && styles.bookButtonLoading
          ]}
          onPress={handleBookSession}
          disabled={bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="event" size={20} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Book Session</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3EE",
  },
  
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DDD1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8F3EE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A2A2A",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8F3EE",
    marginLeft: 8,
  },
  headerButtonActive: {
    backgroundColor: "#E8DDD1",
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8B7355",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A2A2A",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Content Styles
  content: {
    flex: 1,
  },
  
  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#E8DDD1",
  },
  mentorName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A2A2A",
    marginBottom: 8,
    textAlign: "center",
  },
  mentorBio: {
    fontSize: 16,
    color: "#8B7355",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  metaContainer: {
    alignItems: "center",
    gap: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: "#8B7355",
    marginLeft: 6,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: "#8B7355",
    marginLeft: 6,
  },
  onlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Section Styles
  section: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A2A2A",
    marginBottom: 16,
  },

  // Expertise
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expertiseTag: {
    backgroundColor: "#F8F3EE",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  expertiseText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },

  // Subjects
  subjectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectTag: {
    backgroundColor: "#E8DDD1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subjectText: {
    fontSize: 14,
    color: "#2A2A2A",
    fontWeight: "500",
  },

  // Teaching Styles
  teachingStylesContainer: {
    gap: 8,
  },
  teachingStyleTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  teachingStyleText: {
    fontSize: 14,
    color: "#2A2A2A",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Languages
  languagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  languageTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8DDD1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languageText: {
    fontSize: 14,
    color: "#2A2A2A",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Pricing
  pricingCard: {
    backgroundColor: "#F8F3EE",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#8B7355",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "bold",
  },

  // Availability
  availabilityContainer: {
    gap: 8,
  },
  availabilityDay: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A2A",
    width: 80,
  },
  timeSlot: {
    fontSize: 14,
    color: "#8B7355",
    marginLeft: 16,
    backgroundColor: "#F8F3EE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  unavailableDay: {
    fontSize: 14,
    color: "#D1D5DB",
    paddingVertical: 8,
    fontStyle: "italic",
  },

  // Social Links
  socialLinksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  socialButtonText: {
    fontSize: 14,
    color: "#2A2A2A",
    marginLeft: 8,
    fontWeight: "500",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#F8F3EE",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8B7355",
    fontWeight: "500",
  },

  // Booking Section
  bookingSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8DDD1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bookButton: {
    backgroundColor: "#8B4513",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  bookButtonPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    opacity: 0.9,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F3EE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8DDD1",
  },
  quickActionText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
    marginLeft: 6,
  },
  
  // Book Button Loading State
  bookButtonLoading: {
    backgroundColor: "#D1C4B8",
  },

  bottomPadding: {
    height: 20,
  },
});