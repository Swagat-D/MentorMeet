// app/index.tsx - Improved Professional Splash Screen
import { useEffect, useRef } from "react";
import { View, StyleSheet, Text, Animated, Easing, Dimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../stores/authStore";

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideLeftAnim = useRef(new Animated.Value(-width * 0.5)).current;
  const slideRightAnim = useRef(new Animated.Value(width * 0.5)).current;
  const connectionAnim = useRef(new Animated.Value(0)).current;
  const textRevealAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Step 1: Initial fade in and logo scale (1s)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      
      // Step 2: Wait a bit before figures appear (0.5s)
      Animated.delay(500),
      
      // Step 3: Slide in mentor first (0.8s)
      Animated.timing(slideLeftAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      
      // Step 4: Wait before mentee appears (0.3s)
      Animated.delay(300),
      
      // Step 5: Slide in mentee (0.8s)
      Animated.timing(slideRightAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      
      // Step 6: Wait before connection (0.5s)
      Animated.delay(500),
      
      // Step 7: Connection animation (1.2s)
      Animated.timing(connectionAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 8: Text reveal (0.8s)
      Animated.timing(textRevealAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 9: Loading animation (1s)
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
    ]);

    sequence.start();

    // Navigation timer - Total duration: ~8 seconds
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/(auth)/login");
      } else if (!isOnboarded) {
        router.replace("/(onboarding)/welcome");
      } else {
        router.replace("/(tabs)");
      }
    }, 8000); // Increased to 8 seconds

    return () => {
      clearTimeout(timer);
      sequence.stop();
    };
  }, [isAuthenticated, isOnboarded]);

  const connectionWidth = connectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.4],
  });

  return (
    <View style={styles.container}>
      {/* Professional Background Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#EC4899']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Central Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScaleAnim }],
          },
        ]}
      >
        <View style={styles.logoBackground}>
          <Text style={styles.logoText}>M</Text>
        </View>
      </Animated.View>

      {/* Mentor Figure */}
      <Animated.View
        style={[
          styles.figure,
          styles.mentorFigure,
          {
            transform: [{ translateX: slideLeftAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={[styles.avatar, styles.mentorAvatar]}>
          <Text style={styles.avatarEmoji}>👨‍💼</Text>
        </View>
        <Text style={styles.figureLabel}>Mentor</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Expert</Text>
        </View>
      </Animated.View>

      {/* Mentee Figure */}
      <Animated.View
        style={[
          styles.figure,
          styles.menteeFigure,
          {
            transform: [{ translateX: slideRightAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={[styles.avatar, styles.menteeAvatar]}>
          <Text style={styles.avatarEmoji}>👩‍🎓</Text>
        </View>
        <Text style={styles.figureLabel}>Mentee</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Learner</Text>
        </View>
      </Animated.View>

      {/* Connection Line */}
      <View style={styles.connectionContainer}>
        <Animated.View
          style={[
            styles.connectionLine,
            { width: connectionWidth }
          ]}
        />
        <View style={styles.connectionDots}>
          <Animated.View
            style={[
              styles.connectionDot,
              {
                opacity: connectionAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 1, 1],
                })
              }
            ]}
          />
          <Animated.View
            style={[
              styles.connectionDot,
              {
                opacity: connectionAnim.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0, 1, 1],
                })
              }
            ]}
          />
          <Animated.View
            style={[
              styles.connectionDot,
              {
                opacity: connectionAnim.interpolate({
                  inputRange: [0, 0.9, 1],
                  outputRange: [0, 1, 1],
                })
              }
            ]}
          />
        </View>
      </View>

      {/* App Title and Subtitle */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textRevealAnim,
            transform: [{
              translateY: textRevealAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }],
          },
        ]}
      >
        <Text style={styles.title}>MentorMatch</Text>
        <Text style={styles.subtitle}>Where expertise meets ambition</Text>
      </Animated.View>

      {/* Loading Progress */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: textRevealAnim }
        ]}
      >
        <View style={styles.loadingBar}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: loadingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                })
              }
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Connecting you to your future...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  figure: {
    position: 'absolute',
    alignItems: 'center',
    top: height * 0.45,
  },
  mentorFigure: {
    left: width * 0.1,
  },
  menteeFigure: {
    right: width * 0.1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mentorAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  menteeAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: '#10B981',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  figureLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectionContainer: {
    position: 'absolute',
    top: height * 0.45 + 40,
    left: width * 0.1 + 80,
    right: width * 0.1 + 80,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionLine: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  connectionDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    position: 'absolute',
    bottom: height * 0.25,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
    width: width * 0.7,
  },
  loadingBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});