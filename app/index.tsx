import { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Text, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/auth-store";

export default function SplashScreen() {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    // Navigation timer
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/auth");
      } else if (!isOnboarded) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnboarded, fadeAnim, scaleAnim, translateYAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#f0f8ff", "#e6f2ff", "#d9ecff"]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
          },
        ]}
      >
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000" }}
          style={styles.logo}
        />
        <View style={styles.iconOverlay}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>MM</Text>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        }}
      >
        <Text style={styles.title}>MentorMatch</Text>
        <Text style={styles.subtitle}>Connect with expert mentors</Text>
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
    position: "relative",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  iconOverlay: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "transparent",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#5B8FF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  iconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#5B8FF9",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});