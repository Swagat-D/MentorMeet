// app/(tabs)/index.tsx - Fully Responsive Dashboard Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { mentors, sessions } from "@/mocks/mentors";
import { subjects } from "@/constants/subjects";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import MentorCard from "@/components/cards/MentorCard";
import { MentorCardSkeleton } from "@/components/ui/SkeletonLoader";

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isTablet = width >= 768;
const isLargeScreen = width >= 1024;

// Responsive utilities
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isLargeScreen) return large;
  if (isTablet) return medium;
  return small;
};

const getGridColumns = () => {
  return getResponsiveValue(2, 3, 4);
};

const getHorizontalPadding = () => {
  return getResponsiveValue(20, 32, 48);
};

const getFontSize = (base: number) => {
  const scale = getResponsiveValue(1, 1.1, 1.2);
  return Math.round(base * scale);
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [filteredMentors, setFilteredMentors] = useState(mentors);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const upcomingSessions = sessions.filter(
    session => new Date(session.date) > new Date()
  ).slice(0, getResponsiveValue(2, 3, 4));

  const recommendedMentors = mentors.filter(mentor => 
    mentor.subjects.some(subject => user?.interests?.includes(subject))
  ).slice(0, getResponsiveValue(3, 4, 6));

  const QuickStatsCard = ({ icon: Icon, title, value, color, onPress }: any) => (
    <TouchableOpacity 
      style={[
        styles.statCard,
        { 
          width: isTablet ? (screenData.width - getHorizontalPadding() * 2 - 48) / 4 : undefined,
          minWidth: isTablet ? 120 : undefined,
        }
      ]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={getResponsiveValue(20, 24, 28)} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { fontSize: getFontSize(16) }]}>{value}</Text>
      <Text style={[styles.statTitle, { fontSize: getFontSize(11) }]}>{title}</Text>
    </TouchableOpacity>
  );

  const CategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.selectedCategoryText,
          { fontSize: getFontSize(14) }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const FeaturedMentorCard = ({ mentor }: { mentor: any }) => (
    <TouchableOpacity
      style={[
        styles.featuredCard,
        { 
          width: getResponsiveValue(180, 200, 220),
          marginRight: getResponsiveValue(16, 20, 24),
        }
      ]}
      onPress={() => router.push(`/mentor/${mentor.id}`)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: mentor.avatar }} style={styles.featuredAvatar} />
      <View style={styles.featuredContent}>
        <Text style={[styles.featuredName, { fontSize: getFontSize(16) }]} numberOfLines={1}>
          {mentor.name}
        </Text>
        <Text style={[styles.featuredTitle, { fontSize: getFontSize(12) }]} numberOfLines={2}>
          {mentor.title}
        </Text>
        <View style={styles.featuredRating}>
          <MaterialIcons name="star" size={getResponsiveValue(12, 14, 16)} color="#F59E0B" fill="#F59E0B" />
          <Text style={[styles.ratingText, { fontSize: getFontSize(12) }]}>{mentor.rating}</Text>
          <Text style={[styles.reviewCount, { fontSize: getFontSize(11) }]}>({mentor.reviews.length})</Text>
        </View>
        <Text style={[styles.featuredPrice, { fontSize: getFontSize(14) }]}>
          From ${Math.min(...mentor.sessionTypes.map((s: any) => s.price))}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const SessionCard = ({ session }: { session: any }) => (
    <TouchableOpacity 
      style={styles.sessionCard}
      onPress={() => router.push(`/session/${session.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.sessionLeft}>
        <Image source={{ uri: session.mentor.avatar }} style={styles.sessionAvatar} />
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionMentor, { fontSize: getFontSize(16) }]}>
            {session.mentor.name}
          </Text>
          <Text style={[styles.sessionSubject, { fontSize: getFontSize(14) }]}>
            {session.subject}
          </Text>
          <View style={styles.sessionMeta}>
            <MaterialIcons name="event" size={getResponsiveValue(10, 12, 14)} color="#6B7280" />
            <Text style={[styles.sessionDate, { fontSize: getFontSize(12) }]}>
              {new Date(session.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.sessionRight}>
        <View style={styles.joinButton}>
          <MaterialIcons name="play-arrow" size={getResponsiveValue(12, 14, 16)} color="#4F46E5" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ActionCard = ({ icon: Icon, title, subtitle, backgroundColor, onPress }: any) => (
    <TouchableOpacity 
      style={[
        styles.actionCard,
        { 
          width: getResponsiveValue(
            (screenData.width - getHorizontalPadding() * 2 - 16) / 2,
            (screenData.width - getHorizontalPadding() * 2 - 32) / 3,
            (screenData.width - getHorizontalPadding() * 2 - 48) / 4
          ),
        }
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor }]}>
        <Icon size={getResponsiveValue(20, 24, 28)} color="#4F46E5" />
      </View>
      <Text style={[styles.actionTitle, { fontSize: getFontSize(14) }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { fontSize: getFontSize(11) }]}>{subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={[styles.welcomeSection, { paddingHorizontal: getHorizontalPadding() }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeGreeting, { fontSize: getFontSize(24) }]}>
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}! 👋
              </Text>
              <Text style={[styles.welcomeMessage, { fontSize: getFontSize(16) }]}>
                Ready to continue your learning journey?
              </Text>
            </View>
            <Image
              source={{
                uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200"
              }}
              style={[
                styles.welcomeAvatar,
                { 
                  width: getResponsiveValue(50, 60, 70),
                  height: getResponsiveValue(50, 60, 70),
                  borderRadius: getResponsiveValue(25, 30, 35),
                }
              ]}
            />
          </View>

          {/* Quick Stats */}
          <View style={[
            styles.statsContainer,
            isTablet && styles.statsContainerTablet
          ]}>
            <QuickStatsCard
    icon={() => <MaterialIcons name="schedule" size={getResponsiveValue(20, 24, 28)} color="#10B981" />}
    title="Hours Learned"
    value={`${user?.stats?.totalHoursLearned || 0}h`}
    color="#10B981"
    onPress={() => router.push('/progress')}
  />
            <QuickStatsCard
              icon={() => <MaterialIcons name="event" size={getResponsiveValue(20, 24, 28)} color="#F59E0B" />}
              title="Sessions"
              value={user?.stats?.sessionsCompleted || 0}
              color="#F59E0B"
              onPress={() => router.push('/(tabs)/sessions')}
            />
            <QuickStatsCard
              icon={() => <MaterialIcons name="group" size={getResponsiveValue(20, 24, 28)} color="#EF4444" />}
              title="Mentors"
              value={user?.stats?.mentorsConnected || 0}
              color="#EF4444"
              onPress={() => router.push('/favorites')}
            />
            <QuickStatsCard
               icon={() => <MaterialIcons name="emoji-events" size={getResponsiveValue(20, 24, 28)} color="#8B5CF6" />}
              title="Rating"
              value={user?.stats?.averageRating || 0}
              color="#8B5CF6"
              onPress={() => router.push('/achievements')}
            />
          </View>
        </LinearGradient>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>
                Upcoming Sessions
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/sessions')}>
                <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingSessions.map((session, index) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Quick Actions</Text>
          <View style={[
            styles.actionsGrid,
            { justifyContent: isTablet ? 'flex-start' : 'space-between' }
          ]}>
            <ActionCard
              icon={() => <MaterialIcons name="group" size={getResponsiveValue(20, 22, 24)} color="#4F46E5" />}
              title="Find Mentors"
              subtitle="Discover experts"
              backgroundColor="#EEF2FF"
              onPress={() => router.push('/(tabs)/search')}
            />
            <ActionCard
              icon={() => <MaterialIcons name="event" size={getResponsiveValue(20, 22, 24)} color="#EF4444" />}
              title="Book Session"
              subtitle="Schedule learning"
              backgroundColor="#F0FDF4"
              onPress={() => router.push('/booking')}
            />
            <ActionCard
               icon={() => <MaterialIcons name="trending-up" size={getResponsiveValue(20, 22, 24)} color="#F59E0B" />}
              title="My Progress"
              subtitle="Track learning"
              backgroundColor="#FEF3C7"
              onPress={() => router.push('/progress')}
            />
            <ActionCard
              icon={() => <MaterialIcons name="psychology" size={getResponsiveValue(20, 22, 24)} color="#EF4444" />}
              title="Interests"
              subtitle="Manage topics"
              backgroundColor="#FDF2F8"
              onPress={() => router.push('/edit-interests')}
            />
          </View>
        </View>

        {/* Recommended Mentors */}
        {recommendedMentors.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>
                Recommended for You
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>See More</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.horizontalList, { paddingRight: getHorizontalPadding() }]}
            >
              {isLoading
                ? [1, 2, 3].map((item) => (
                    <View key={item} style={[
                      styles.featuredCard,
                      { width: getResponsiveValue(180, 200, 220) }
                    ]}>
                      <View style={[styles.featuredAvatar, { backgroundColor: '#E5E7EB' }]} />
                      <View style={styles.featuredContent}>
                        <View style={[styles.skeletonText, { width: '80%', height: 16 }]} />
                        <View style={[styles.skeletonText, { width: '100%', height: 14, marginTop: 4 }]} />
                        <View style={[styles.skeletonText, { width: '60%', height: 12, marginTop: 8 }]} />
                      </View>
                    </View>
                  ))
                : recommendedMentors.map((mentor) => (
                    <FeaturedMentorCard key={mentor.id} mentor={mentor} />
                  ))
              }
            </ScrollView>
          </View>
        )}

        {/* Browse by Subject */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Browse by Subject</Text>
          <FlatList
            data={["All", ...subjects.slice(0, getResponsiveValue(8, 12, 16))]}
            renderItem={CategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoriesList, { paddingRight: getHorizontalPadding() }]}
          />
        </View>

        {/* Recent Mentors */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>
              {selectedCategory === "All" ? "Popular Mentors" : `${selectedCategory} Mentors`}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={[styles.sectionLink, { fontSize: getFontSize(14) }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mentorsList}>
            {isLoading
              ? [1, 2, 3].map((item) => <MentorCardSkeleton key={item} />)
              : filteredMentors.slice(0, getResponsiveValue(3, 4, 6)).map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))
            }
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
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
  welcomeSection: {
    paddingTop: getResponsiveValue(20, 24, 32),
    paddingBottom: getResponsiveValue(24, 28, 32),
    marginBottom: 8,
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(24, 28, 32),
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeGreeting: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  welcomeMessage: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  welcomeAvatar: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: isTablet ? 'wrap' : 'nowrap',
  },
  statsContainerTablet: {
    justifyContent: 'flex-start',
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    alignItems: "center",
    flex: isTablet ? 0 : 1,
    marginHorizontal: isTablet ? 6 : 4,
    marginBottom: isTablet ? 12 : 0,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statIconContainer: {
    width: getResponsiveValue(36, 40, 44),
    height: getResponsiveValue(36, 40, 44),
    borderRadius: getResponsiveValue(18, 20, 22),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  statValue: {
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  statTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  section: {
    paddingVertical: getResponsiveValue(16, 20, 24),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(16, 18, 20),
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  sectionLink: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sessionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sessionAvatar: {
    width: getResponsiveValue(48, 52, 56),
    height: getResponsiveValue(48, 52, 56),
    borderRadius: getResponsiveValue(24, 26, 28),
    marginRight: getResponsiveValue(12, 14, 16),
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMentor: {
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  sessionSubject: {
    color: "#4F46E5",
    fontWeight: "500",
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDate: {
    color: "#6B7280",
    marginLeft: 4,
  },
  sessionRight: {
    alignItems: "center",
  },
  joinButton: {
    width: getResponsiveValue(36, 40, 44),
    height: getResponsiveValue(36, 40, 44),
    borderRadius: getResponsiveValue(18, 20, 22),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(20, 22, 24),
    alignItems: "center",
    marginBottom: getResponsiveValue(16, 18, 20),
    marginRight: isTablet ? getResponsiveValue(16, 20, 24) : 0,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  actionIcon: {
    width: getResponsiveValue(44, 48, 52),
    height: getResponsiveValue(44, 48, 52),
    borderRadius: getResponsiveValue(22, 24, 26),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  actionTitle: {
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center",
  },
  actionSubtitle: {
    color: "#6B7280",
    textAlign: "center",
  },
  horizontalList: {
    paddingLeft: 0,
  },
  featuredCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  featuredAvatar: {
    width: "100%",
    height: getResponsiveValue(100, 110, 120),
    borderRadius: getResponsiveValue(12, 14, 16),
    marginBottom: getResponsiveValue(12, 14, 16),
  },
  featuredContent: {
    alignItems: "flex-start",
  },
  featuredName: {
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  featuredTitle: {
    color: "#6B7280",
    marginBottom: getResponsiveValue(8, 10, 12),
    lineHeight: getResponsiveValue(16, 18, 20),
  },
  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  ratingText: {
    color: "#1F2937",
    marginLeft: 4,
    fontWeight: "600",
  },
  reviewCount: {
    color: "#9CA3AF",
    marginLeft: 2,
  },
  featuredPrice: {
    fontWeight: "bold",
    color: "#4F46E5",
  },
  categoriesList: {
    paddingLeft: 0,
  },
  categoryItem: {
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(16, 18, 20),
    backgroundColor: "#F3F4F6",
    marginRight: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedCategoryItem: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  categoryText: {
    fontWeight: "600",
    color: "#6B7280",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  mentorsList: {
    marginTop: 8,
  },
  skeletonText: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  bottomPadding: {
    height: getResponsiveValue(32, 40, 48),
  },
});