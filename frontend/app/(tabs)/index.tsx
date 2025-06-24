// app/(tabs)/index.tsx - Updated Dashboard with Professional Warm Theme
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

  const QuickStatsCard = ({ icon: Icon, title, value, subtitle, color, gradient, onPress }: any) => (
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
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={getResponsiveValue(20, 24, 28)} color={color} strokeWidth={2} />
        </View>
        <Text style={[styles.statValue, { fontSize: getFontSize(16) }]}>{value}</Text>
        <Text style={[styles.statTitle, { fontSize: getFontSize(11) }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { fontSize: getFontSize(10) }]}>{subtitle}</Text>
        )}
      </LinearGradient>
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
          <MaterialIcons name="star" size={getResponsiveValue(12, 14, 16)} color="#d97706" fill="#d97706" />
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
            <MaterialIcons name="event" size={getResponsiveValue(10, 12, 14)} color="#8b7355" />
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
          <MaterialIcons name="play-arrow" size={getResponsiveValue(12, 14, 16)} color="#5d4e37" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ActionCard = ({ icon: Icon, title, subtitle, backgroundColor, iconColor, onPress }: any) => (
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
      activeOpacity={0.8}
    >
      <View style={[styles.actionIcon, { backgroundColor }]}>
        <Icon size={getResponsiveValue(20, 24, 28)} color={iconColor} />
      </View>
      <Text style={[styles.actionTitle, { fontSize: getFontSize(14) }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { fontSize: getFontSize(11) }]}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 17) return '☀️';
    return '🌙';
  };

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section with Creative Warm Theme */}
        <View style={[styles.welcomeSection, { paddingHorizontal: getHorizontalPadding() }]}>
          {/* Background with subtle pattern */}
          <LinearGradient
            colors={["#fefbf3", "#f8f6f0", "#f1f0ec"]}
            style={styles.welcomeBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Creative overlay */}
          <LinearGradient
            colors={["rgba(139, 90, 60, 0.1)", "rgba(217, 119, 6, 0.08)", "rgba(245, 158, 11, 0.06)"]}
            style={styles.welcomeOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />
          </View>

          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeGreeting, { fontSize: getFontSize(24) }]}>
                {getGreeting()}! {getGreetingEmoji()}
              </Text>
              <Text style={[styles.welcomeMessage, { fontSize: getFontSize(16) }]}>
                Ready to continue your learning journey?
              </Text>
            </View>
            <View style={styles.avatarWrapper}>
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
              <View style={styles.avatarGlow} />
            </View>
          </View>

          {/* Enhanced Stats with Student-Relevant Metrics */}
          <View style={[
            styles.statsContainer,
            isTablet && styles.statsContainerTablet
          ]}>
            <QuickStatsCard
              icon={() => <MaterialIcons name="schedule" size={getResponsiveValue(20, 24, 28)} color="#8b5a3c" />}
              title="Hours Learned"
              value={`${user?.stats?.totalHoursLearned || 42}h`}
              subtitle="This month"
              color="#8b5a3c"
              gradient={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              onPress={() => router.push('/progress')}
            />
            <QuickStatsCard
              icon={() => <MaterialIcons name="local-fire-department" size={getResponsiveValue(20, 24, 28)} color="#d97706" />}
              title="Study Streak"
              value={`${user?.stats?.studyStreak || 7}`}
              subtitle="Days in a row"
              color="#d97706"
              gradient={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              onPress={() => router.push('/achievements')}
            />
            <QuickStatsCard
              icon={() => <MaterialIcons name="group" size={getResponsiveValue(20, 24, 28)} color="#f59e0b" />}
              title="Mentors"
              value={user?.stats?.mentorsConnected || 5}
              subtitle="Connected"
              color="#f59e0b"
              gradient={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              onPress={() => router.push('/favorites')}
            />
            <QuickStatsCard
              icon={() => <MaterialIcons name="star" size={getResponsiveValue(20, 24, 28)} color="#059669" />}
              title="Progress"
              value={`${user?.stats?.completionRate || 85}%`}
              subtitle="Goal completion"
              color="#059669"
              gradient={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              onPress={() => router.push('/progress')}
            />
          </View>
        </View>

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

        {/* Learning Insights Section */}
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Your Learning Journey</Text>
          
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialIcons name="trending-up" size={20} color="#8b5a3c" />
                <Text style={styles.insightTitle}>This Week's Progress</Text>
              </View>
              <Text style={styles.insightValue}>
                {user?.stats?.weeklyGoalProgress || 75}% of goal completed
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${user?.stats?.weeklyGoalProgress || 75}%` }]} />
              </View>
              <Text style={styles.insightSubtext}>Keep it up! 3 more hours to reach your weekly goal</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <MaterialIcons name="psychology" size={20} color="#d97706" />
                <Text style={styles.insightTitle}>Learning Streak</Text>
              </View>
              <Text style={styles.insightValue}>
                {user?.stats?.studyStreak || 7} days in a row
              </Text>
              <Text style={styles.insightSubtext}>
                Amazing! You're building great study habits 🔥
              </Text>
            </View>
          </View>

          <View style={styles.nextSessionCard}>
            <LinearGradient
              colors={["rgba(139, 90, 60, 0.08)", "rgba(217, 119, 6, 0.05)"]}
              style={styles.nextSessionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.nextSessionContent}>
                <View style={styles.nextSessionIcon}>
                  <MaterialIcons name="schedule" size={24} color="#8b5a3c" />
                </View>
                <View style={styles.nextSessionInfo}>
                  <Text style={styles.nextSessionTitle}>Ready for your next session?</Text>
                  <Text style={styles.nextSessionSubtitle}>
                    Book with your favorite mentors or discover new ones
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.nextSessionButton}
                  onPress={() => router.push('/(tabs)/search')}
                >
                  <MaterialIcons name="arrow-forward" size={18} color="#8b5a3c" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
        <View style={[styles.section, { paddingHorizontal: getHorizontalPadding() }]}>
          <Text style={[styles.sectionTitle, { fontSize: getFontSize(20) }]}>Quick Actions</Text>
          <View style={[
            styles.actionsGrid,
            { justifyContent: isTablet ? 'flex-start' : 'space-between' }
          ]}>
            <ActionCard
              icon={() => <MaterialIcons name="group" size={getResponsiveValue(20, 22, 24)} color="#5d4e37" />}
              title="Find Mentors"
              subtitle="Discover experts"
              backgroundColor="rgba(93, 78, 55, 0.1)"
              iconColor="#5d4e37"
              onPress={() => router.push('/(tabs)/search')}
            />
            <ActionCard
              icon={() => <MaterialIcons name="event" size={getResponsiveValue(20, 22, 24)} color="#8b5a3c" />}
              title="Book Session"
              subtitle="Schedule learning"
              backgroundColor="rgba(139, 90, 60, 0.1)"
              iconColor="#8b5a3c"
              onPress={() => router.push('/booking')}
            />
            <ActionCard
              icon={() => <MaterialIcons name="trending-up" size={getResponsiveValue(20, 22, 24)} color="#d97706" />}
              title="My Progress"
              subtitle="Track learning"
              backgroundColor="rgba(217, 119, 6, 0.1)"
              iconColor="#d97706"
              onPress={() => router.push('/progress')}
            />
            <ActionCard
              icon={() => <MaterialIcons name="psychology" size={getResponsiveValue(20, 22, 24)} color="#f59e0b" />}
              title="Interests"
              subtitle="Manage topics"
              backgroundColor="rgba(245, 158, 11, 0.1)"
              iconColor="#f59e0b"
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
                      <View style={[styles.featuredAvatar, { backgroundColor: '#f1f0ec' }]} />
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
    backgroundColor: "#fefbf3",
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingTop: getResponsiveValue(20, 24, 32),
    paddingBottom: getResponsiveValue(24, 28, 32),
    marginBottom: 8,
    position: 'relative',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  welcomeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 90, 60, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -15,
    left: -25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(217, 119, 6, 0.06)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(24, 28, 32),
    zIndex: 1,
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeGreeting: {
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  welcomeMessage: {
    color: "#8b7355",
  },
  avatarWrapper: {
    position: 'relative',
  },
  welcomeAvatar: {
    borderWidth: 3,
    borderColor: "rgba(139, 90, 60, 0.3)",
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: getResponsiveValue(30, 35, 40),
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    zIndex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: isTablet ? 'wrap' : 'nowrap',
    zIndex: 1,
  },
  statsContainerTablet: {
    justifyContent: 'flex-start',
  },
  statCard: {
    borderRadius: getResponsiveValue(16, 18, 20),
    flex: isTablet ? 0 : 1,
    marginHorizontal: isTablet ? 6 : 4,
    marginBottom: isTablet ? 12 : 0,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.15)",
  },
  statCardGradient: {
    alignItems: "center",
    padding: getResponsiveValue(16, 18, 20),
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
    color: "#4a3728",
    marginBottom: 2,
  },
  statTitle: {
    color: "#8b7355",
    textAlign: "center",
    fontWeight: "500",
  },
  statSubtitle: {
    color: "#a0916d",
    textAlign: "center",
    marginTop: 2,
    fontWeight: "400",
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
    color: "#4a3728",
  },
  sectionLink: {
    color: "#8b5a3c",
    fontWeight: "600",
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    marginBottom: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#4a3728",
    marginBottom: 2,
  },
  sessionSubject: {
    color: "#8b5a3c",
    fontWeight: "500",
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionDate: {
    color: "#8b7355",
    marginLeft: 4,
  },
  sessionRight: {
    alignItems: "center",
  },
  joinButton: {
    width: getResponsiveValue(36, 40, 44),
    height: getResponsiveValue(36, 40, 44),
    borderRadius: getResponsiveValue(18, 20, 22),
    backgroundColor: "rgba(93, 78, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  actionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(20, 22, 24),
    alignItems: "center",
    marginBottom: getResponsiveValue(16, 18, 20),
    marginRight: isTablet ? getResponsiveValue(16, 20, 24) : 0,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#4a3728",
    marginBottom: 4,
    textAlign: "center",
  },
  actionSubtitle: {
    color: "#8b7355",
    textAlign: "center",
  },
  horizontalList: {
    paddingLeft: 0,
  },
  featuredCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: getResponsiveValue(16, 18, 20),
    padding: getResponsiveValue(16, 18, 20),
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#4a3728",
    marginBottom: 4,
  },
  featuredTitle: {
    color: "#8b7355",
    marginBottom: getResponsiveValue(8, 10, 12),
    lineHeight: getResponsiveValue(16, 18, 20),
  },
  featuredRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  ratingText: {
    color: "#4a3728",
    marginLeft: 4,
    fontWeight: "600",
  },
  reviewCount: {
    color: "#a0916d",
    marginLeft: 2,
  },
  featuredPrice: {
    fontWeight: "bold",
    color: "#8b5a3c",
  },
  categoriesList: {
    paddingLeft: 0,
  },
  categoryItem: {
    paddingHorizontal: getResponsiveValue(16, 18, 20),
    paddingVertical: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(16, 18, 20),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    marginRight: getResponsiveValue(12, 14, 16),
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  selectedCategoryItem: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  categoryText: {
    fontWeight: "600",
    color: "#8b7355",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  mentorsList: {
    marginTop: 8,
  },
  skeletonText: {
    backgroundColor: "#f1f0ec",
    borderRadius: 4,
  },
  bottomPadding: {
    height: getResponsiveValue(100, 120, 140),
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a3728',
    marginLeft: 8,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 8,
  },
  insightSubtext: {
    fontSize: 12,
    color: '#8b7355',
    lineHeight: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(139, 90, 60, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5a3c',
    borderRadius: 3,
  },
  nextSessionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextSessionGradient: {
    padding: 16,
  },
  nextSessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextSessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  nextSessionInfo: {
    flex: 1,
  },
  nextSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3728',
    marginBottom: 4,
  },
  nextSessionSubtitle: {
    fontSize: 14,
    color: '#8b7355',
    lineHeight: 18,
  },
  nextSessionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});