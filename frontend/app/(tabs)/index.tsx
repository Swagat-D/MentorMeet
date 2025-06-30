// app/(tabs)/index.tsx - Revolutionary Creative Home Screen with Warm Theme
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
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';
import { useAuthStore } from "@/stores/authStore";
import { mentors, sessions } from "@/mocks/mentors";
import { subjects } from "@/constants/subjects";
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const slideDownAnim = useRef(new Animated.Value(-30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardStagger = useRef(Array(8).fill(0).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Update time
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.timing(slideDownAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start();

    // Staggered card animations
    const staggeredAnimations = cardStagger.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    );
    
    Animated.stagger(80, staggeredAnimations).start();

    // Continuous animations
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 5) return { text: 'Working late', icon: '🌙', time: 'night owl' };
    if (hour < 12) return { text: 'Good morning', icon: '🌅', time: 'early bird' };
    if (hour < 17) return { text: 'Good afternoon', icon: '☀️', time: 'go-getter' };
    if (hour < 21) return { text: 'Good evening', icon: '🌇', time: 'achiever' };
    return { text: 'Good night', icon: '🌙', time: 'night learner' };
  };

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  
  const upcomingSessions = sessions.filter(
    session => new Date(session.date) > new Date()
  ).slice(0, 2);

  const featuredMentors = mentors.slice(0, 4);
  const trendingSubjects = subjects.slice(0, 6);

  // Hero stats data
  const heroStats = [
    { value: user?.stats?.totalHoursLearned || 42, label: 'Hours', icon: 'schedule', color: '#8b5a3c' },
    { value: user?.stats?.studyStreak || 7, label: 'Streak', icon: 'local-fire-department', color: '#d97706' },
    { value: user?.stats?.sessionsCompleted || 24, label: 'Sessions', icon: 'emoji-events', color: '#f59e0b' },
  ];

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const CreativeStatCard = ({ stat, index }: any) => (
    <Animated.View
      style={[
        styles.heroStatCard,
        {
          opacity: cardStagger[index],
          transform: [{
            translateY: cardStagger[index].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.15)']}
        style={styles.heroStatGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.heroStatIcon, { backgroundColor: `${stat.color}20` }]}>
          <MaterialIcons name={stat.icon} size={20} color={stat.color} />
        </View>
        <Text style={styles.heroStatValue}>{stat.value}</Text>
        <Text style={styles.heroStatLabel}>{stat.label}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const QuickActionCard = ({ icon, title, description, gradient, onPress, index }: any) => (
    <Animated.View
      style={[
        styles.quickActionCard,
        {
          opacity: cardStagger[index + 3],
          transform: [{
            scale: cardStagger[index + 3].interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={gradient}
          style={styles.quickActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.quickActionHeader}>
            <View style={styles.quickActionIconContainer}>
              <MaterialIcons name={icon} size={24} color="#fff" />
            </View>
            <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
          </View>
          
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionDescription}>{description}</Text>
          
          <View style={styles.quickActionFooter}>
            <View style={styles.quickActionDots}>
              <View style={styles.quickActionDot} />
              <View style={styles.quickActionDot} />
              <View style={styles.quickActionDot} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const MentorSpotlightCard = ({ mentor, index }: any) => (
    <Animated.View
      style={[
        styles.mentorSpotlightCard,
        {
          opacity: cardStagger[index % 8],
          transform: [{
            translateX: cardStagger[index % 8].interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity onPress={() => router.push(`/mentor/${mentor.id}`)} activeOpacity={0.9}>
        <ImageBackground
          source={{ uri: mentor.avatar }}
          style={styles.mentorSpotlightImage}
          imageStyle={styles.mentorSpotlightImageStyle}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.mentorSpotlightOverlay}
          >
            <View style={styles.mentorSpotlightBadges}>
              <View style={styles.mentorRatingBadge}>
                <MaterialIcons name="star" size={12} color="#FFD700" />
                <Text style={styles.mentorRatingText}>{mentor.rating}</Text>
              </View>
              {mentor.isOnline && (
                <View style={styles.mentorOnlineBadge}>
                  <View style={styles.onlinePulse} />
                  <Text style={styles.mentorOnlineText}>Live</Text>
                </View>
              )}
            </View>
            
            <View style={styles.mentorSpotlightInfo}>
              <Text style={styles.mentorSpotlightName}>{mentor.name}</Text>
              <Text style={styles.mentorSpotlightTitle} numberOfLines={2}>{mentor.title}</Text>
              
              <View style={styles.mentorSpotlightMeta}>
                <Text style={styles.mentorSpotlightPrice}>
                  ${Math.min(...mentor.sessionTypes.map((s: any) => s.price))}/hr
                </Text>
                <View style={styles.mentorSpotlightStudents}>
                  <MaterialIcons name="people" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.mentorStudentsText}>{mentor.stats.totalStudents}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );

  const SessionPreviewCard = ({ session, index }: any) => (
    <Animated.View
      style={[
        styles.sessionPreviewCard,
        {
          opacity: cardStagger[index % 8],
          transform: [{
            translateY: cardStagger[index % 8].interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity onPress={() => router.push(`/session/${session.id}`)} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
          style={styles.sessionPreviewGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.sessionPreviewHeader}>
            <Image source={{ uri: session.mentor.avatar }} style={styles.sessionMentorAvatar} />
            <View style={styles.sessionPreviewInfo}>
              <Text style={styles.sessionMentorName}>{session.mentor.name}</Text>
              <Text style={styles.sessionSubjectName}>{session.subject}</Text>
            </View>
            <View style={styles.sessionJoinButton}>
              <MaterialIcons name="videocam" size={16} color="#8b5a3c" />
            </View>
          </View>
          
          <View style={styles.sessionPreviewDetails}>
            <View style={styles.sessionTimeContainer}>
              <MaterialIcons name="schedule" size={14} color="#8b7355" />
              <Text style={styles.sessionTimeText}>
                {new Date(session.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            
            <View style={styles.sessionProgressBar}>
              <View style={styles.sessionProgressFill} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const SubjectPillCard = ({ subject, index }: any) => (
    <Animated.View
      style={[
        styles.subjectPill,
        {
          opacity: cardStagger[index % 8],
          transform: [{
            scale: cardStagger[index % 8].interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity 
        onPress={() => router.push('/(tabs)/search')} 
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(139, 90, 60, 0.15)', 'rgba(217, 119, 6, 0.1)']}
          style={styles.subjectPillGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.subjectPillText}>{subject}</Text>
          <MaterialIcons name="trending-up" size={14} color="#8b5a3c" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["right", "left"]}>
      {/* Dynamic Background with Patterns */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Decorative Elements */}
      <Animated.View style={[styles.floatingShape1, { transform: [{ rotate: rotateInterpolate }] }]} />
      <Animated.View style={[styles.floatingShape2, { transform: [{ scale: pulseAnim }] }]} />
      <Animated.View style={[styles.floatingShape3, { transform: [{ rotate: rotateInterpolate }] }]} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideDownAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(139, 90, 60, 0.95)', 'rgba(217, 119, 6, 0.9)', 'rgba(245, 158, 11, 0.85)']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Hero Header */}
            <View style={styles.heroHeader}>
              <View style={styles.heroGreeting}>
                <Text style={styles.heroGreetingEmoji}>{greeting.icon}</Text>
                <View>
                  <Text style={styles.heroGreetingText}>{greeting.text}</Text>
                  <Text style={styles.heroUserName}>{firstName}</Text>
                  <Text style={styles.heroTimeText}>You're a {greeting.time}!</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.heroProfileContainer} onPress={() => router.push('/(tabs)/profile')}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Image
                    source={{
                      uri: user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200"
                    }}
                    style={styles.heroProfileImage}
                  />
                  <View style={styles.heroProfileBadge}>
                    <MaterialIcons name="auto-awesome" size={12} color="#f59e0b" />
                  </View>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Hero Stats */}
            <View style={styles.heroStatsContainer}>
              {heroStats.map((stat, index) => (
                <CreativeStatCard key={index} stat={stat} index={index} />
              ))}
            </View>

            {/* Hero CTA */}
            <Animated.View
              style={[
                styles.heroCTA,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              <Text style={styles.heroCTAText}>Ready to level up today?</Text>
              <TouchableOpacity 
                style={styles.heroCTAButton}
                onPress={() => router.push('/(tabs)/search')}
                activeOpacity={0.9}
              >
                <Text style={styles.heroCTAButtonText}>Find Your Mentor</Text>
                <MaterialIcons name="rocket-launch" size={18} color="#8b5a3c" />
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              icon="search"
              title="Discover"
              description="Find perfect mentors"
              gradient={['rgba(139, 90, 60, 0.9)', 'rgba(93, 78, 55, 0.8)']}
              onPress={() => router.push('/(tabs)/search')}
              index={0}
            />
            <QuickActionCard
              icon="event"
              title="Schedule"
              description="Book your session"
              gradient={['rgba(217, 119, 6, 0.9)', 'rgba(245, 158, 11, 0.8)']}
              onPress={() => router.push('/booking')}
              index={1}
            />
            <QuickActionCard
              icon="trending-up"
              title="Progress"
              description="Track your growth"
              gradient={['rgba(245, 158, 11, 0.9)', 'rgba(251, 191, 36, 0.8)']}
              onPress={() => router.push('/progress')}
              index={2}
            />
            <QuickActionCard
              icon="bookmark"
              title="Saved"
              description="Your favorites"
              gradient={['rgba(5, 150, 105, 0.9)', 'rgba(16, 185, 129, 0.8)']}
              onPress={() => router.push('/favorites')}
              index={3}
            />
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
            
            <View style={styles.sessionsList}>
              {upcomingSessions.map((session, index) => (
                <SessionPreviewCard key={session.id} session={session} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Mentor Spotlight */}
        <View style={styles.mentorSpotlightSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Mentors</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.sectionLink}>Explore</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentorSpotlightScroll}
          >
            {featuredMentors.map((mentor, index) => (
              <MentorSpotlightCard key={mentor.id} mentor={mentor} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Trending Subjects */}
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>Trending Topics</Text>
          <View style={styles.trendingGrid}>
            {trendingSubjects.map((subject, index) => (
              <SubjectPillCard key={subject} subject={subject} index={index} />
            ))}
          </View>
        </View>

        {/* Motivation Quote */}
        <Animated.View
          style={[
            styles.motivationSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(139, 90, 60, 0.1)', 'rgba(217, 119, 6, 0.05)']}
            style={styles.motivationCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="format-quote" size={32} color="rgba(139, 90, 60, 0.6)" />
            <Text style={styles.motivationText}>
              "Education is the most powerful weapon which you can use to change the world."
            </Text>
            <Text style={styles.motivationAuthor}>- Nelson Mandela</Text>
            
            <View style={styles.motivationDecor}>
              <View style={styles.motivationDot} />
              <View style={styles.motivationLine} />
              <View style={styles.motivationDot} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  floatingShape1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 90, 60, 0.05)',
    top: height * 0.1,
    right: -40,
  },
  floatingShape2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    top: height * 0.5,
    left: -30,
  },
  floatingShape3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    bottom: height * 0.2,
    right: width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  heroGradient: {
    padding: 24,
    minHeight: 240,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroGreetingEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  heroGreetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroUserName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  heroTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  heroProfileContainer: {
    position: 'relative',
  },
  heroProfileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroProfileBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroStatCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroStatGradient: {
    padding: 12,
    alignItems: 'center',
  },
  heroStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  heroCTA: {
    alignItems: 'center',
  },
  heroCTAText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  heroCTAButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5a3c',
    marginRight: 8,
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLink: {
    fontSize: 14,
    color: '#8b5a3c',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionGradient: {
    padding: 20,
    minHeight: 120,
  },
  quickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  quickActionFooter: {
    alignItems: 'flex-start',
  },
  quickActionDots: {
    flexDirection: 'row',
  },
  quickActionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 4,
  },
  sessionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sessionsList: {
    gap: 12,
  },
  sessionPreviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sessionPreviewGradient: {
    padding: 16,
  },
  sessionPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionMentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  sessionPreviewInfo: {
    flex: 1,
  },
  sessionMentorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 2,
  },
  sessionSubjectName: {
    fontSize: 14,
    color: '#8b5a3c',
    fontWeight: '500',
  },
  sessionJoinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionPreviewDetails: {
    gap: 8,
  },
  sessionTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTimeText: {
    fontSize: 12,
    color: '#8b7355',
    marginLeft: 6,
    fontWeight: '500',
  },
  sessionProgressBar: {
    height: 4,
    backgroundColor: 'rgba(139, 90, 60, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sessionProgressFill: {
    width: '30%',
    height: '100%',
    backgroundColor: '#8b5a3c',
    borderRadius: 2,
  },
  mentorSpotlightSection: {
    marginBottom: 24,
  },
  mentorSpotlightScroll: {
    paddingHorizontal: 20,
  },
  mentorSpotlightCard: {
    width: 200,
    height: 280,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  mentorSpotlightImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  mentorSpotlightImageStyle: {
    borderRadius: 20,
  },
  mentorSpotlightOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  mentorSpotlightBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mentorRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mentorRatingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  mentorOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlinePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  mentorOnlineText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  mentorSpotlightInfo: {
    alignItems: 'flex-start',
  },
  mentorSpotlightName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  mentorSpotlightTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
    marginBottom: 12,
  },
  mentorSpotlightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mentorSpotlightPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  mentorSpotlightStudents: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorStudentsText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
    fontWeight: '500',
  },
  trendingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectPill: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  subjectPillText: {
    fontSize: 13,
    color: '#8b5a3c',
    fontWeight: '600',
  },
  motivationSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  motivationCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 60, 0.1)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  motivationText: {
    fontSize: 16,
    color: '#4a3728',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
    marginVertical: 16,
    fontWeight: '500',
  },
  motivationAuthor: {
    fontSize: 14,
    color: '#8b7355',
    fontWeight: '600',
    marginBottom: 16,
  },
  motivationDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  motivationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(139, 90, 60, 0.4)',
  },
  motivationLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(139, 90, 60, 0.3)',
  },
  bottomPadding: {
    height: 120,
  },
});