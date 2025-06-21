// app/(onboarding)/welcome.tsx - Fixed Scrollable Onboarding Welcome Screen
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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingWelcomeScreen() {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Initial fade and slide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
      ]),
    ]);

    // Continuous bounce animation for the CTA button
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    sequence.start();
    
    // Start bounce animation after initial animations
    setTimeout(() => {
      bounceAnimation.start();
    }, 1500);

    return () => {
      sequence.stop();
      bounceAnimation.stop();
    };
  }, []);

  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const handleGetStarted = () => {
    router.push("/(onboarding)/role-selection");
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            
            <View style={styles.sparkleContainer}>
              <MaterialIcons name="auto-awesome" size={20} color="#FFD700" />
            </View>
          </View>

          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>MentorMatch</Text>
          <Text style={styles.tagline}>Where learning meets expertise</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="group" size={28} color="#4ECDC4" />
            </View>
            <Text style={styles.featureTitle}>Connect with Experts</Text>
            <Text style={styles.featureDescription}>
              Find experienced mentors in your field of interest and get personalized guidance
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="my-location" size={28} color="#FF6B6B" />
            </View>
            <Text style={styles.featureTitle}>Achieve Your Goals</Text>
            <Text style={styles.featureDescription}>
              Set clear learning objectives and track your progress with expert mentorship
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="auto-awesome" size={28} color="#FFD700" />
            </View>
            <Text style={styles.featureTitle}>Grow Together</Text>
            <Text style={styles.featureDescription}>
              Join a supportive community of learners and mentors helping each other succeed
            </Text>
          </View>
        </Animated.View>

        {/* CTA Section */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: bounceTranslate }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.setupTime}>Takes less than 2 minutes</Text>
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View 
          style={[
            styles.progressContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.progressDots}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
          <Text style={styles.progressText}>1 of 4</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  getStartedButton: {
    width: width - 48,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    marginBottom: 16,
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
  setupTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});