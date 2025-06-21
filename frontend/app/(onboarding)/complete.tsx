// app/(onboarding)/complete.tsx - Onboarding Complete Screen
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
          toValue: 1.1,
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

    sequence.start();
    
    // Start pulse animation after initial animations
    setTimeout(() => {
      pulseAnimation.start();
    }, 2000);

    return () => {
      sequence.stop();
      pulseAnimation.stop();
    };
  }, []);

  const handleGetStarted = () => {
    completeOnboarding(user?.interests, user?.goals);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#EC4899']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Confetti Elements */}
      <Animated.View 
        style={[
          styles.confetti,
          styles.confetti1,
          {
            opacity: confettiAnim,
            transform: [{
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 200],
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.confetti,
          styles.confetti2,
          {
            opacity: confettiAnim,
            transform: [{
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-150, 300],
              })
            }]
          }
        ]}
      />
      <Animated.View 
        style={[
          styles.confetti,
          styles.confetti3,
          {
            opacity: confettiAnim,
            transform: [{
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-80, 250],
              })
            }]
          }
        ]}
      />

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
            <MaterialIcons name="check-circle" size={80} color="#10B981" />
          </View>
          <View style={styles.sparkleOverlay}>
            <MaterialIcons name="auto-awesome" size={24} color="#FFD700" />
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
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Welcome to MentorMatch! Your profile is ready and we're excited to help you achieve your goals.
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
          {/* Role Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="group" size={28} color="#4ECDC4" />
            </View>
            <Text style={styles.summaryTitle}>Your Role</Text>
            <Text style={styles.summaryValue}>
              {user?.role === 'mentee' ? 'Learner & Mentee' : 'Expert & Mentor'}
            </Text>
          </View>

          {/* Interests Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="auto-awesome" size={24} color="#10B981" />
            </View>
            <Text style={styles.summaryTitle}>Interests</Text>
            <Text style={styles.summaryValue}>
              {user?.interests?.length || 0} selected
            </Text>
          </View>

          {/* Goals Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="my-location" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.summaryTitle}>Goals</Text>
            <Text style={styles.summaryValue}>
              {user?.goals?.length || 0} selected
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
          <Text style={styles.nextStepsTitle}>What's next?</Text>
          
          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="star" size={20} color="#FFD700" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Discover Mentors</Text>
              <Text style={styles.stepDescription}>
                Browse through our curated list of expert mentors
              </Text>
            </View>
          </View>

          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="group" size={28} color="#4ECDC4" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Book Sessions</Text>
              <Text style={styles.stepDescription}>
                Schedule one-on-one sessions with your chosen mentors
              </Text>
            </View>
          </View>

          <View style={styles.nextStep}>
            <View style={styles.stepIcon}>
              <MaterialIcons name="my-location" size={28} color="#FF6B6B" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Achieve Goals</Text>
              <Text style={styles.stepDescription}>
                Track your progress and reach your learning objectives
              </Text>
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
              colors={['#10B981', '#059669']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Start Learning</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.welcomeText}>
            🎉 Welcome to your learning journey!
          </Text>
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
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confetti1: {
    backgroundColor: '#FFD700',
    left: '20%',
    top: 0,
  },
  confetti2: {
    backgroundColor: '#FF6B6B',
    left: '60%',
    top: 0,
  },
  confetti3: {
    backgroundColor: '#4ECDC4',
    left: '80%',
    top: 0,
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
    marginBottom: 40,
  },
  successIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 80,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  sparkleOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    width: '100%',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (width - 72) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIcon: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextStepsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  getStartedButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '600',
  },
});