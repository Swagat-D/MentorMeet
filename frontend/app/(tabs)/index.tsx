// app/(tabs)/index.tsx - Sophisticated Professional Home Screen
import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';
import MentorService, { MentorProfile } from "@/services/mentorService";
import StudentService from "@/services/studentService";

const { width } = Dimensions.get('window');

// Enhanced interfaces for real database integration
interface StudentProgress {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  totalLearningHours: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionRating: number;
  completionRate: number;
  favoriteSubjects: Array<{
    subject: string;
    sessionsCount: number;
    averageRating: number;
  }>;
  recentAchievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
    icon: string;
  }>;
  weeklyGoal: {
    target: number;
    completed: number;
    percentage: number;
  };
}

interface UpcomingSession {
  _id: string;
  mentorName: string;
  mentorAvatar: string;
  subject: string;
  scheduledTime: string;
  duration: number;
  sessionType: 'video' | 'audio' | 'chat';
  status: 'scheduled' | 'confirmed' | 'pending';
}

interface LearningInsight {
  type: 'improvement' | 'milestone' | 'recommendation' | 'streak';
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  icon: string;
  color: string;
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real data from database
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalLearningHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageSessionRating: 0,
    completionRate: 0,
    favoriteSubjects: [],
    recentAchievements: [],
    weeklyGoal: { target: 0, completed: 0, percentage: 0 },
  });
  
  const [featuredMentors, setFeaturedMentors] = useState<MentorProfile[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [trendingSubjects, setTrendingSubjects] = useState<string[]>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    initializeData();
    
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Start animations
    startAnimations();
    
    return () => clearInterval(timer);
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStudentProgress(),
        fetchFeaturedMentors(),
        fetchUpcomingSessions(),
        fetchLearningInsights(),
        fetchTrendingSubjects(),
      ]);
    } catch (error) {
      console.error('Error initializing home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      const progress = await StudentService.getStudentProgress(user?.id);
      setStudentProgress(progress);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    }
  };

  const fetchFeaturedMentors = async () => {
    try {
      const mentors = await MentorService.getFeaturedMentors(4);
      setFeaturedMentors(mentors);
    } catch (error) {
      console.error('Error fetching featured mentors:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const sessions = await StudentService.getUpcomingSessions(user?.id, 3);
      setUpcomingSessions(sessions);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const fetchLearningInsights = async () => {
    try {
      const insights = await StudentService.getLearningInsights(user?.id);
      setLearningInsights(insights);
    } catch (error) {
      console.error('Error fetching learning insights:', error);
    }
  };

  const fetchTrendingSubjects = async () => {
    try {
      const subjects = await MentorService.getTrendingExpertise(6);
      setTrendingSubjects(subjects);
    } catch (error) {
      console.error('Error fetching trending subjects:', error);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
          />
        }
      >
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
                <Text style={styles.streakText}>{studentProgress.currentStreak}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dynamic Progress Overview */}
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
                <Text style={styles.progressValue}>{studentProgress.totalLearningHours}h</Text>
              </View>
              <Text style={styles.progressLabel}>Total Learning</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min((studentProgress.totalLearningHours / 100) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="school" size={24} color="#D4AF37" />
                <Text style={styles.progressValue}>{studentProgress.completedSessions}</Text>
              </View>
              <Text style={styles.progressLabel}>Sessions Done</Text>
              <Text style={styles.progressSubtext}>
                {studentProgress.completionRate}% completion rate
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="trending-up" size={24} color="#10B981" />
                <Text style={styles.progressValue}>{studentProgress.currentStreak}</Text>
              </View>
              <Text style={styles.progressLabel}>Day Streak</Text>
              <Text style={styles.progressSubtext}>
                Best: {studentProgress.longestStreak} days
              </Text>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="star" size={24} color="#F59E0B" />
                <Text style={styles.progressValue}>{studentProgress.averageSessionRating.toFixed(1)}</Text>
              </View>
              <Text style={styles.progressLabel}>Avg Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons
                    key={star}
                    name="star"
                    size={12}
                    color={star <= Math.round(studentProgress.averageSessionRating) ? "#F59E0B" : "#E5E7EB"}
                  />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions - Refined */}
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

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/sessions')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {upcomingSessions.map((session, index) => (
              <View key={session._id} style={styles.sessionCard}>
                <Image source={{ uri: session.mentorAvatar }} style={styles.sessionMentorAvatar} />
                
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionMentorName}>{session.mentorName}</Text>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <Text style={styles.sessionTime}>
                    {new Date(session.scheduledTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                
                <View style={styles.sessionActions}>
                  <View style={[styles.sessionStatus, { backgroundColor: getStatusColor(session.status) }]}>
                    <Text style={styles.sessionStatusText}>{session.status}</Text>
                  </View>
                  <TouchableOpacity style={styles.joinButton}>
                    <MaterialIcons name="videocam" size={20} color="#8B4513" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Learning Insights */}
        {learningInsights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Learning Insights</Text>
            
            {learningInsights.map((insight, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.insightCard}
                onPress={() => insight.actionRoute && router.push(insight.actionRoute)}
              >
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}15` }]}>
                  <MaterialIcons name={insight.icon as any} size={24} color={insight.color} />
                </View>
                
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                  {insight.action && (
                    <Text style={styles.insightAction}>{insight.action}</Text>
                  )}
                </View>
                
                {insight.actionRoute && (
                  <MaterialIcons name="arrow-forward-ios" size={16} color="#8B7355" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Featured Mentors */}
        {featuredMentors.length > 0 && (
          <View style={styles.mentorsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Mentors</Text>
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
                  key={mentor._id} 
                  style={styles.mentorCard}
                  onPress={() => router.push(`/mentor/${mentor._id}`)}
                >
                  <Image source={{ uri: mentor.profileImage }} style={styles.mentorAvatar} />
                  
                  <Text style={styles.mentorName}>{mentor.displayName}</Text>
                  <Text style={styles.mentorExpertise}>
                    {mentor.expertise.slice(0, 2).join(', ')}
                  </Text>
                  
                  <View style={styles.mentorMeta}>
                    <View style={styles.mentorRating}>
                      <MaterialIcons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.mentorRatingText}>{mentor.rating?.toFixed(1) || '5.0'}</Text>
                    </View>
                    
                    {mentor.pricing?.hourlyRate && (
                      <Text style={styles.mentorPrice}>${mentor.pricing.hourlyRate}/hr</Text>
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

        {/* Trending Subjects */}
        {trendingSubjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.sectionTitle}>Trending Subjects</Text>
            
            <View style={styles.subjectsGrid}>
              {trendingSubjects.map((subject, index) => (
                <TouchableOpacity 
                  key={subject} 
                  style={styles.subjectChip}
                  onPress={() => router.push(`/(tabs)/search?subject=${encodeURIComponent(subject)}`)}
                >
                  <Text style={styles.subjectText}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
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

  // Sessions Section
  sessionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '600',
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    alignItems: 'center',
  },
  sessionMentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionMentorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  sessionSubject: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: '#8B7355',
  },
  sessionActions: {
    alignItems: 'flex-end',
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  sessionStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },

  // Insights Section
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    alignItems: 'center',
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
    marginBottom: 4,
  },
  insightAction: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },

  // Mentors Section
  mentorsSection: {
    marginBottom: 24,
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
  },
  mentorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 4,
  },
  mentorExpertise: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginBottom: 8,
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

  // Subjects Section
  subjectsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1C4B8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subjectText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },

  bottomPadding: {
    height: 100,
  },
});