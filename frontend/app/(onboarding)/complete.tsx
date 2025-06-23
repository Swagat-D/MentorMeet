// app/(onboarding)/complete.tsx - Onboarding Complete Screen with Warm Theme
import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingCompleteScreen() {
  const { completeOnboarding, user } = useAuthStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const starAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Initial fade and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.elastic(1.2),
        }),
      ]),
      
      // Slide up content
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]);

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    // Star animations
    const starAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(starAnim1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim2, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(starAnim2, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(starAnim3, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(starAnim3, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
    ];

    sequence.start();
    
    // Start animations after initial sequence
    setTimeout(() => {
      pulseAnimation.start();
      starAnimations.forEach(anim => anim.start());
    }, 2000);

    return () => {
      sequence.stop();
      pulseAnimation.stop();
      starAnimations.forEach(anim => anim.stop());
    };
  }, []);

  const handleGetStarted = () => {
    completeOnboarding(user?.interests, user?.goals);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Warm Background Gradient */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Secondary Warm Overlay */}
      <LinearGradient
        colors={['rgba(251, 243, 219, 0.2)', 'rgba(254, 252, 243, 0.1)', 'rgba(245, 238, 228, 0.15)']}
        style={styles.backgroundOverlay}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Animated Stars */}
      <Animated.View 
        style={[
          styles.star,
          styles.star1,
          {
            opacity: starAnim1,
            transform: [{
              scale: starAnim1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1.2],
              })
            }]
          }
        ]}
      >
        <MaterialIcons name="star" size={20} color="#d97706" />
      </Animated.View>
      <Animated.View 
        style={[
          styles.star,
          styles.star2,
          {
            opacity: starAnim2,
            transform: [{
              scale: starAnim2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              })
            }]
          }
        ]}
      >
        <MaterialIcons name="auto-awesome" size={16} color="#059669" />
      </Animated.View>
      <Animated.View 
        style={[
          styles.star,
          styles.star3,
          {
            opacity: starAnim3,
            transform: [{
              scale: starAnim3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1.3],
              })
            }]
          }
        ]}
      >
        <MaterialIcons name="emoji-events" size={18} color="#8b5a3c" />
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successIcon}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.successIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="check-circle" size={60} color="#059669" />
            </LinearGradient>
          </View>
          <View style={styles.sparkleOverlay}>
            <MaterialIcons name="auto-awesome" size={20} color="#d97706" />
          </View>
        </Animated.View>

        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome aboard, {user?.name?.split(' ')[0]}! 🎉</Text>
          <Text style={styles.subtitle}>
            Your learning journey is ready to begin. We've matched your profile with the perfect mentors to help you achieve your goals.
          </Text>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View
          style={[
            styles.summaryContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="person" size={24} color="#8b5a3c" />
            </View>
            <Text style={styles.summaryTitle}>Your Profile</Text>
            <Text style={styles.summaryValue}>
              {user?.studyLevel?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Student'}
            </Text>
            <Text style={styles.summarySubtitle}>
              Age: {user?.ageRange || 'Not specified'}
            </Text>
          </View>

          {/* Goals Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="my-location" size={24} color="#d97706" />
            </View>
            <Text style={styles.summaryTitle}>Learning Goals</Text>
            <Text style={styles.summaryValue}>
              {user?.goals?.length || 0} selected
            </Text>
            <Text style={styles.summarySubtitle}>
              Ready to achieve
            </Text>
          </View>
        </Animated.View>

        {/* What's Next Section */}
        <Animated.View
          style={[
            styles.nextStepsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.nextStepsTitle}>Your learning journey starts now!</Text>
          
          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="search" size={20} color="#8b5a3c" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Discover Mentors</Text>
              <Text style={styles.stepDescription}>
                Browse through our curated list of expert mentors matched to your goals
              </Text>
            </View>
          </View>

          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="event" size={20} color="#d97706" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Book Sessions</Text>
              <Text style={styles.stepDescription}>
                Schedule personalized learning sessions that fit your schedule
              </Text>
            </View>
          </View>

          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="trending-up" size={20} color="#059669" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Track Progress</Text>
              <Text style={styles.stepDescription}>
                Monitor your learning journey and celebrate achievements
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Fun Stats */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.statsTitle}>Did you know?</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Expert Mentors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>95%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5a3c', '#d97706']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="rocket-launch" size={20} color="#fff" />
              <Text style={styles.getStartedText}>Start Learning Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.welcomeText}>
            ✨ Ready to unlock your potential!
          </Text>
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View 
          style={[
            styles.progressContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.progressDots}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>
          <Text style={styles.progressText}>3 of 3 - Complete!</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    zIndex: 1,
  },
  star1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  star2: {
    top: height * 0.25,
    right: width * 0.15,
  },
  star3: {
    bottom: height * 0.3,
    left: width * 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
    minHeight: height,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  successIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  sparkleOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    width: '100%',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: (width - 72) / 2,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  summaryIcon: {
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#8b7355',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    color: '#4a3728',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#a0916d',
    textAlign: 'center',
  },
  nextStepsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 20,
    textAlign: 'center',
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3728',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8b7355',
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: 'rgba(139, 90, 60, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 60, 0.1)',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5a3c',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b7355',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  getStartedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5a3c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 16,
    width: '100%',
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#8b5a3c',
    width: 24,
  },
  progressText: {
    fontSize: 12,
    color: '#8b7355',
    fontWeight: '600',
  },
});