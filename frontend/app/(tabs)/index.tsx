// app/(tabs)/index.tsx - Optimized Home Screen with Rate Limiting Prevention
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import studentService, { StudentProgress, UpcomingSession, LearningInsight, Achievement } from "@/services/studentService";
import mentorService, { MentorProfile } from "@/services/mentorService";

const { width } = Dimensions.get('window');

// Cache configuration
const CACHE_KEYS = {
  STUDENT_PROGRESS: 'home_student_progress',
  FEATURED_MENTORS: 'home_featured_mentors',
  UPCOMING_SESSIONS: 'home_upcoming_sessions',
  LEARNING_INSIGHTS: 'home_learning_insights',
  ACHIEVEMENTS: 'home_achievements',
  TRENDING_SUBJECTS: 'home_trending_subjects',
  LAST_REFRESH: 'home_last_refresh',
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MIN_REFRESH_INTERVAL = 30 * 1000; // 30 seconds minimum between manual refreshes
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // Auto refresh every 5 minutes

export default function HomeScreen() {
  const { user } = useAuthStore();
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionError, setConnectionError] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [dataAge, setDataAge] = useState<number>(0);
  
  // Data state with proper initialization
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [featuredMentors, setFeaturedMentors] = useState<MentorProfile[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [trendingSubjects, setTrendingSubjects] = useState<string[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Prevent multiple concurrent API calls
  const isApiCallInProgress = useRef(false);
  const autoRefreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Cache management functions
  const getCachedData = async (key: string): Promise<any> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const isExpired = (Date.now() - parsed.timestamp) > CACHE_DURATION;
      
      return isExpired ? null : parsed.data;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  };

  const setCachedData = async (key: string, data: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error(`Error caching data for ${key}:`, error);
    }
  };

  // Load data from cache first, then fetch if needed
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      console.log('📋 Loading data from cache...');
      let hasValidCache = false;

      const [
        cachedProgress,
        cachedMentors,
        cachedSessions,
        cachedInsights,
        cachedAchievements,
        cachedSubjects,
      ] = await Promise.all([
        getCachedData(CACHE_KEYS.STUDENT_PROGRESS),
        getCachedData(CACHE_KEYS.FEATURED_MENTORS),
        getCachedData(CACHE_KEYS.UPCOMING_SESSIONS),
        getCachedData(CACHE_KEYS.LEARNING_INSIGHTS),
        getCachedData(CACHE_KEYS.ACHIEVEMENTS),
        getCachedData(CACHE_KEYS.TRENDING_SUBJECTS),
      ]);

      if (cachedProgress) {
        setStudentProgress(cachedProgress);
        hasValidCache = true;
        console.log('✅ Loaded progress from cache');
      }

      if (cachedMentors) {
        setFeaturedMentors(cachedMentors);
        hasValidCache = true;
        console.log(`✅ Loaded ${cachedMentors.length} mentors from cache`);
      }

      if (cachedSessions) {
        setUpcomingSessions(cachedSessions);
        hasValidCache = true;
        console.log('✅ Loaded sessions from cache');
      }

      if (cachedInsights) {
        setLearningInsights(cachedInsights);
        hasValidCache = true;
        console.log('✅ Loaded insights from cache');
      }

      if (cachedAchievements) {
        setAchievements(cachedAchievements);
        hasValidCache = true;
        console.log('✅ Loaded achievements from cache');
      }

      if (cachedSubjects) {
        setTrendingSubjects(cachedSubjects);
        hasValidCache = true;
        console.log('✅ Loaded subjects from cache');
      }

      return hasValidCache;
    } catch (error) {
      console.error('❌ Error loading from cache:', error);
      return false;
    }
  }, []);

  // Fetch fresh data with rate limiting protection
  const fetchFreshData = useCallback(async (): Promise<void> => {
    if (isApiCallInProgress.current) {
      console.log('⏳ API call already in progress, skipping...');
      return;
    }

    try {
      isApiCallInProgress.current = true;
      setConnectionError(false);
      
      console.log('🌐 Fetching fresh data from APIs...');

      // Add delays between API calls to prevent rate limiting
      const apiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      const results = await Promise.allSettled([
        // Fetch student progress
        (async () => {
          try {
            console.log('📊 Fetching student progress...');
            const progress = await studentService.getStudentProgress(user?.id);
            setStudentProgress(progress);
            await setCachedData(CACHE_KEYS.STUDENT_PROGRESS, progress);
            console.log('✅ Student progress loaded');
          } catch (error) {
            console.error('❌ Error fetching student progress:', error);
          }
          await apiDelay(1000); // 1 second delay
        })(),

        // Fetch featured mentors with retry logic
        (async () => {
          try {
            console.log('⭐ Fetching featured mentors...');
            const mentors = await mentorService.getFeaturedMentors(6);
            setFeaturedMentors(mentors);
            await setCachedData(CACHE_KEYS.FEATURED_MENTORS, mentors);
            console.log(`✅ Featured mentors loaded: ${mentors.length}`);
          } catch (error) {
            console.error('❌ Error fetching featured mentors:', error);
            // Try fallback method
            try {
              console.log('🔄 Trying fallback mentor fetch...');
              const fallbackMentors = await mentorService.searchMentors({});
              const featured = fallbackMentors.mentors.slice(0, 6);
              setFeaturedMentors(featured);
              await setCachedData(CACHE_KEYS.FEATURED_MENTORS, featured);
              console.log(`✅ Fallback mentors loaded: ${featured.length}`);
            } catch (fallbackError) {
              console.error('❌ Fallback mentor fetch also failed:', fallbackError);
            }
          }
          await apiDelay(1000);
        })(),

        // Fetch upcoming sessions
        (async () => {
          try {
            console.log('📅 Fetching upcoming sessions...');
            const sessions = await studentService.getUpcomingSessions(user?.id, 3);
            setUpcomingSessions(sessions);
            await setCachedData(CACHE_KEYS.UPCOMING_SESSIONS, sessions);
            console.log(`✅ Upcoming sessions loaded: ${sessions.length}`);
          } catch (error) {
            console.error('❌ Error fetching upcoming sessions:', error);
          }
          await apiDelay(1000);
        })(),

        // Fetch learning insights
        (async () => {
          try {
            console.log('💡 Fetching learning insights...');
            const insights = await studentService.getLearningInsights(user?.id);
            setLearningInsights(insights);
            await setCachedData(CACHE_KEYS.LEARNING_INSIGHTS, insights);
            console.log(`✅ Learning insights loaded: ${insights.length}`);
          } catch (error) {
            console.error('❌ Error fetching learning insights:', error);
          }
          await apiDelay(1000);
        })(),

        // Fetch achievements
        (async () => {
          try {
            console.log('🏆 Fetching achievements...');
            const userAchievements = await studentService.getAchievements(user?.id, 3);
            setAchievements(userAchievements);
            await setCachedData(CACHE_KEYS.ACHIEVEMENTS, userAchievements);
            console.log(`✅ Achievements loaded: ${userAchievements.length}`);
          } catch (error) {
            console.error('❌ Error fetching achievements:', error);
          }
          await apiDelay(1000);
        })(),

        // Fetch trending subjects
        (async () => {
          try {
            console.log('📈 Fetching trending subjects...');
            const subjects = await mentorService.getTrendingExpertise(8);
            setTrendingSubjects(subjects);
            await setCachedData(CACHE_KEYS.TRENDING_SUBJECTS, subjects);
            console.log(`✅ Trending subjects loaded: ${subjects.length}`);
          } catch (error) {
            console.error('❌ Error fetching trending subjects:', error);
          }
        })(),
      ]);

      // Update last refresh time
      await setCachedData(CACHE_KEYS.LAST_REFRESH, Date.now());
      setLastRefreshTime(Date.now());

      // Check if any critical API calls failed
      const failedCount = results.filter(result => result.status === 'rejected').length;
      if (failedCount > 3) {
        setConnectionError(true);
        console.warn(`⚠️ ${failedCount} API calls failed`);
      }

      console.log('✅ Fresh data fetch completed');

    } catch (error) {
      console.error('❌ Error fetching fresh data:', error);
      setConnectionError(true);
    } finally {
      isApiCallInProgress.current = false;
    }
  }, [user?.id]);

  // Initialize data with cache-first approach
  const initializeData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      console.log('🚀 Initializing home screen data...');

      // First, load from cache for instant display
      if (!forceRefresh) {
        const hasCache = await loadFromCache();
        if (hasCache) {
          setLoading(false); // Show cached data immediately
        }
      }

      // Check if we need fresh data
      const lastRefresh = await getCachedData(CACHE_KEYS.LAST_REFRESH);
      const shouldFetchFresh = forceRefresh || 
                              !lastRefresh || 
                              (Date.now() - lastRefresh) > CACHE_DURATION;

      if (shouldFetchFresh) {
        await fetchFreshData();
      } else {
        console.log('📋 Using cached data (still fresh)');
        setDataAge(Date.now() - lastRefresh);
      }

    } catch (error) {
      console.error('❌ Error initializing data:', error);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, fetchFreshData]);

  // Setup auto-refresh timer
  const setupAutoRefresh = useCallback(() => {
    if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }

    autoRefreshTimer.current = setInterval(async () => {
      if (!refreshing && !isApiCallInProgress.current) {
        console.log('🔄 Auto-refreshing data...');
        await fetchFreshData();
      }
    }, AUTO_REFRESH_INTERVAL);
  }, [fetchFreshData, refreshing]);

  // Manual refresh with rate limiting
  const onRefresh = useCallback(async () => {
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      const waitTime = Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh) / 1000);
      Alert.alert(
        'Please Wait',
        `You can refresh again in ${waitTime} seconds to prevent rate limiting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setRefreshing(true);
    try {
      await initializeData(true);
      Alert.alert('Refreshed!', 'Your data has been updated successfully.', [{ text: 'OK' }]);
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      Alert.alert('Refresh Failed', 'Could not refresh data. Please try again later.', [{ text: 'OK' }]);
    } finally {
      setRefreshing(false);
    }
  }, [initializeData, lastRefreshTime]);

  // Focus effect - only refresh if data is stale
  useFocusEffect(
    useCallback(() => {
      const checkAndRefresh = async () => {
        const lastRefresh = await getCachedData(CACHE_KEYS.LAST_REFRESH);
        const isStale = !lastRefresh || (Date.now() - lastRefresh) > CACHE_DURATION;
        
        if (isStale && !loading && !refreshing) {
          console.log('🔄 Data is stale, refreshing on focus...');
          await fetchFreshData();
        }
      };

      checkAndRefresh();
    }, [fetchFreshData, loading, refreshing])
  );

  // Main useEffect for initialization
  useEffect(() => {
    initializeData(false);
    setupAutoRefresh();
    
    // Update time every minute
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Start animations
    startAnimations();
    
    return () => {
      clearInterval(timeTimer);
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [initializeData, setupAutoRefresh]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const getTimeBasedMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 9) return "Early bird catches the worm!";
    if (hour < 12) return "Perfect time for learning!";
    if (hour < 17) return "Keep the momentum going!";
    if (hour < 21) return "Evening progress session?";
    return "Night owl mode activated!";
  };

  const handleRetryConnection = async () => {
    Alert.alert(
      "Retry Connection",
      "Would you like to try reconnecting to the server?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Retry", 
          onPress: async () => {
            setLoading(true);
            await initializeData(true);
          }
        }
      ]
    );
  };

  const formatDataAge = (age: number): string => {
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  if (loading && featuredMentors.length === 0 && !studentProgress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
          <Text style={styles.loadingSubtext}>Fetching data from server...</Text>
          {connectionError && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetryConnection}>
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#8B4513']}
            tintColor="#8B4513"
            title="Pull to refresh"
          />
        }
      >
        {/* Connection Error Banner */}
        {connectionError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={20} color="#EF4444" />
            <Text style={styles.errorText}>Some data may be outdated</Text>
            <TouchableOpacity onPress={handleRetryConnection}>
              <MaterialIcons name="refresh" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Data Freshness Indicator */}
        {dataAge > 0 && (
          <View style={styles.dataIndicator}>
            <MaterialIcons name="update" size={16} color="#10B981" />
            <Text style={styles.dataIndicatorText}>
              Last updated {formatDataAge(dataAge)}
            </Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={16} color="#8B4513" />
            </TouchableOpacity>
          </View>
        )}

        {/* Professional Header */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Student'}</Text>
              <Text style={styles.motivationText}>{getTimeBasedMessage()}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.profileSection}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Image
                source={{
                  uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                }}
                style={styles.profileAvatar}
              />
              <View style={styles.streakBadge}>
                <MaterialIcons name="local-fire-department" size={14} color="#FF6B35" />
                <Text style={styles.streakText}>{studentProgress?.currentStreak || 0}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Progress Overview */}
        <Animated.View
          style={[
            styles.progressSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Your Learning Journey</Text>
          
          <View style={styles.progressGrid}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="schedule" size={24} color="#8B4513" />
                <Text style={styles.progressValue}>{studentProgress?.totalLearningHours?.toFixed(1) || '0'}h</Text>
              </View>
              <Text style={styles.progressLabel}>Total Learning</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(((studentProgress?.totalLearningHours || 0) / 50) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="school" size={24} color="#D4AF37" />
                <Text style={styles.progressValue}>{studentProgress?.completedSessions || 0}</Text>
              </View>
              <Text style={styles.progressLabel}>Sessions Done</Text>
              <Text style={styles.progressSubtext}>
                {studentProgress?.completionRate || 0}% completion rate
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="trending-up" size={24} color="#10B981" />
                <Text style={styles.progressValue}>{studentProgress?.currentStreak || 0}</Text>
              </View>
              <Text style={styles.progressLabel}>Day Streak</Text>
              <Text style={styles.progressSubtext}>
                Best: {studentProgress?.longestStreak || 0} days
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="star" size={24} color="#F59E0B" />
                <Text style={styles.progressValue}>{studentProgress?.averageSessionRating?.toFixed(1) || '0.0'}</Text>
              </View>
              <Text style={styles.progressLabel}>Avg Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name="star"
                    size={12}
                    color={star <= Math.round(studentProgress?.averageSessionRating || 0) ? "#F59E0B" : "#E5E7EB"}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/search')}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="search" size={24} color="#8B4513" />
              </View>
              <Text style={styles.actionTitle}>Find Mentors</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/booking')}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="event" size={24} color="#8B4513" />
              </View>
              <Text style={styles.actionTitle}>Book Session</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/sessions')}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="video-call" size={24} color="#8B4513" />
              </View>
              <Text style={styles.actionTitle}>My Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/progress')}
            >
              <View style={styles.actionIcon}>
                <MaterialIcons name="analytics" size={24} color="#8B4513" />
              </View>
              <Text style={styles.actionTitle}>Progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Mentors - Enhanced with database integration */}
        {featuredMentors.length > 0 && (
          <View style={styles.mentorsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Mentors ({featuredMentors.length})</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mentorsScroll}
            >
              {featuredMentors.map((mentor, index) => (
                <TouchableOpacity 
                  key={mentor._id || index} 
                  style={styles.mentorCard}
                  onPress={() => router.push(`/mentor/${mentor._id}`)}
                >
                  <Image 
                    source={{ 
                      uri: mentor.profileImage || 
                           `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.displayName || mentor.firstName || 'Mentor')}&background=8B4513&color=fff&size=200`
                    }} 
                    style={styles.mentorAvatar}
                    onError={() => console.log(`Failed to load avatar for ${mentor.displayName}`)}
                  />
                  
                  <Text style={styles.mentorName} numberOfLines={2}>
                    {mentor.displayName || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || 'Anonymous Mentor'}
                  </Text>
                  <Text style={styles.mentorExpertise} numberOfLines={2}>
                    {mentor.expertise?.slice(0, 2).join(', ') || 
                     mentor.specialties?.slice(0, 2).join(', ') || 
                     'General Teaching'}
                  </Text>
                  
                  <View style={styles.mentorMeta}>
                    <View style={styles.mentorRating}>
                      <MaterialIcons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.mentorRatingText}>
                        {mentor.rating?.toFixed(1) || '5.0'}
                      </Text>
                    </View>
                    
                    {mentor.pricing?.hourlyRate && (
                      <Text style={styles.mentorPrice}>
                        ${mentor.pricing.hourlyRate}/hr
                      </Text>
                    )}
                  </View>
                  
                  {mentor.isOnline && (
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Online</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Show message if no mentors found */}
        {featuredMentors.length === 0 && !loading && (
          <View style={styles.emptyMentorsState}>
            <MaterialIcons name="school" size={48} color="#8B7355" />
            <Text style={styles.emptyStateTitle}>No Mentors Available</Text>
            <Text style={styles.emptyStateText}>
              We're working on bringing you amazing mentors. Check back soon!
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={onRefresh}
            >
              <Text style={styles.emptyStateButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rest of sections... */}
        {/* Include other sections like upcoming sessions, insights, etc. */}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#10B981';
    case 'scheduled': return '#F59E0B';
    case 'pending': return '#EF4444';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#2A2A2A',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Data freshness indicator
  dataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  dataIndicatorText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 6,
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 4,
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  profileSection: {
    alignItems: 'center',
    position: 'relative',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#D1C4B8',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginLeft: 2,
  },

  // Progress Section
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  progressLabel: {
    fontSize: 14,
    color: '#8B7355',
    fontWeight: '500',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#8B7355',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8DDD1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: (width - 80) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
    marginBottom: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A2A2A',
    textAlign: 'center',
  },

  // Mentors Section
  mentorsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionLink: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
  },
  mentorsScroll: {
    paddingHorizontal: 20,
  },
  mentorCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    alignItems: 'center',
  },
  mentorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    backgroundColor: '#F0F0F0', // Fallback background
  },
  mentorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 35, // Ensure consistent height
  },
  mentorExpertise: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 30, // Ensure consistent height
  },
  mentorMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  mentorRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A2A2A',
    marginLeft: 4,
  },
  mentorPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Empty States
  emptyMentorsState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 100,
  },
});