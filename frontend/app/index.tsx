// app/index.tsx - Modern Professional Educational Splash Screen
import { useEffect, useRef } from "react";
import { View, StyleSheet, Text, Animated, Easing, Dimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.7)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(40)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(30)).current;
  const mentorSlideAnim = useRef(new Animated.Value(-width)).current;
  const menteeSlideAnim = useRef(new Animated.Value(width)).current;
  const connectionAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      // Step 1: Initial fade in and logo entrance (1s)
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
          easing: Easing.out(Easing.back(1.1)),
        }),
      ]),
      
      // Step 2: Logo glow effect (0.6s)
      Animated.timing(logoGlowAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 3: Title slide in (0.7s)
      Animated.timing(titleSlideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 4: Subtitle slide in (0.5s)
      Animated.timing(subtitleSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 5: Mentor and Mentee avatars slide in (0.8s)
      Animated.parallel([
        Animated.timing(mentorSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
        Animated.timing(menteeSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }),
      ]),
      
      // Step 6: Connection animation (1s)
      Animated.timing(connectionAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
      
      // Step 7: Progress bar animation (1.2s)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }),
    ]);

    // Continuous floating animations
    const floatingAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim1, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatingAnim1, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim2, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatingAnim2, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim3, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(floatingAnim3, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ),
    ];

    // Shimmer effect
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    sequence.start();
    floatingAnimations.forEach(anim => anim.start());
    shimmerAnimation.start();

    // Navigation timer - Total duration: ~6 seconds
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/(auth)/login");
      } else if (!isOnboarded) {
        router.replace("/(onboarding)/welcome");
      } else {
        router.replace("/(tabs)");
      }
    }, 6000);

    return () => {
      clearTimeout(timer);
      sequence.stop();
      floatingAnimations.forEach(anim => anim.stop());
      shimmerAnimation.stop();
    };
  }, [isAuthenticated, isOnboarded]);

  // Interpolations
  const logoGlowOpacity = logoGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const connectionWidth = connectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.3],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.6],
  });

  const float1Y = floatingAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const float2Y = floatingAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float3Y = floatingAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View style={styles.container}>
      {/* Warm Elegant Background Gradient */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec', '#e8e6e1']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Secondary Warm Overlay */}
      <LinearGradient
        colors={['rgba(251, 243, 219, 0.3)', 'rgba(254, 252, 243, 0.1)', 'rgba(245, 238, 228, 0.2)']}
        style={styles.backgroundOverlay}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Geometric Background Pattern */}
      <View style={styles.backgroundPattern}>
        <Animated.View
          style={[
            styles.geometricShape,
            styles.shape1,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float1Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.geometricShape,
            styles.shape2,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float2Y }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.geometricShape,
            styles.shape3,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float3Y }],
            },
          ]}
        />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: fadeAnim },
        ]}
      >
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            
            {/* Logo Glow Effect */}
            <Animated.View
              style={[
                styles.logoGlow,
                { opacity: logoGlowOpacity },
              ]}
            />
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ translateY: titleSlideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>MentorMatch</Text>
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={[
            styles.subtitleContainer,
            {
              transform: [{ translateY: subtitleSlideAnim }],
            },
          ]}
        >
          <Text style={styles.subtitle}>Where expertise meets ambition</Text>
        </Animated.View>

        {/* Mentor-Mentee Connection Visual */}
        <View style={styles.connectionSection}>
          {/* Mentor Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              styles.mentorContainer,
              {
                transform: [{ translateX: mentorSlideAnim }],
              },
            ]}
          >
            <View style={styles.avatar}>
              <LinearGradient
                colors={['#8b5a3c', '#a0692e']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="person" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.avatarLabel}>Expert</Text>
          </Animated.View>

          {/* Connection Line */}
          <View style={styles.connectionContainer}>
            <Animated.View
              style={[
                styles.connectionLine,
                { width: connectionWidth }
              ]}
            >
              <LinearGradient
                colors={['#8b5a3c', '#d97706', '#059669']}
                style={styles.connectionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
            
            {/* Connection Dots */}
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

          {/* Mentee Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              styles.menteeContainer,
              {
                transform: [{ translateX: menteeSlideAnim }],
              },
            ]}
          >
            <View style={styles.avatar}>
              <LinearGradient
                colors={['#059669', '#047857']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="school" size={32} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.avatarLabel}>Learner</Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Loading Section */}
      <Animated.View
        style={[
          styles.loadingSection,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: progressWidth }
              ]}
            >
              <LinearGradient
                colors={['#8b5a3c', '#d97706']}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
        </View>
        <Text style={styles.loadingText}>Connecting you to your future...</Text>
      </Animated.View>

      {/* Brand Footer */}
      <Animated.View
        style={[
          styles.brandFooter,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.brandText}>Innovative Learning Experience</Text>
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
  backgroundOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  geometricShape: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'rgba(184, 134, 100, 0.08)',
  },
  shape1: {
    width: 60,
    height: 60,
    top: height * 0.15,
    left: width * 0.1,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(158, 129, 105, 0.06)',
  },
  shape2: {
    width: 40,
    height: 40,
    top: height * 0.25,
    right: width * 0.15,
    borderRadius: 20,
    backgroundColor: 'rgba(194, 154, 108, 0.07)',
  },
  shape3: {
    width: 80,
    height: 20,
    bottom: height * 0.3,
    left: width * 0.2,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 139, 118, 0.05)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#5d4e37',
    fontFamily: 'System',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(184, 134, 100, 0.15)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  titleContainer: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4a3728',
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 248, 235, 0.8)',
    transform: [{ skewX: '-20deg' }],
  },
  subtitleContainer: {
    marginBottom: 60,
  },
  subtitle: {
    fontSize: 18,
    color: '#8b7355',
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  connectionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
    marginBottom: 80,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  mentorContainer: {
    marginRight: 20,
  },
  menteeContainer: {
    marginLeft: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 12,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarLabel: {
    fontSize: 14,
    color: '#6b5b47',
    fontWeight: '600',
    fontFamily: 'System',
  },
  connectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 4,
  },
  connectionLine: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  connectionGradient: {
    width: '100%',
    height: '100%',
  },
  connectionDots: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    shadowColor: '#8b5a3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingSection: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    width: width * 0.8,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    width: width * 0.6,
    height: 6,
    backgroundColor: 'rgba(184, 134, 100, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '400',
  },
  brandFooter: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 12,
    color: '#a0916d',
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: 1,
  },
});