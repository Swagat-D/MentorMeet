// app/(onboarding)/role-selection.tsx - Role Selection Screen
import { useState, useRef, useEffect } from "react";
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
import { ArrowRight, GraduationCap, Users, ArrowLeft } from "lucide-react-native";

const { width, height } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<'mentee' | 'mentor' | null>(null);
  const { updateProfile } = useAuthStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (selectedRole) {
      updateProfile({ role: selectedRole });
      router.push("/(onboarding)/interests");
    }
  };

  const handleBack = () => {
    router.back();
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
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

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
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Choose your role to get personalized recommendations
          </Text>
        </Animated.View>

        {/* Role Options */}
        <Animated.View
          style={[
            styles.rolesContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Mentee Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'mentee' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('mentee')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIcon, styles.menteeIcon]}>
              <GraduationCap size={40} color="#4F46E5" />
            </View>
            <Text style={styles.roleTitle}>I want to learn</Text>
            <Text style={styles.roleSubtitle}>Mentee</Text>
            <Text style={styles.roleDescription}>
              Connect with experienced mentors to accelerate your learning journey and achieve your goals faster.
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.roleFeature}>• Find expert mentors</Text>
              <Text style={styles.roleFeature}>• Get personalized guidance</Text>
              <Text style={styles.roleFeature}>• Track your progress</Text>
              <Text style={styles.roleFeature}>• Join learning communities</Text>
            </View>
            {selectedRole === 'mentee' && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedText}>✓ Selected</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mentor Option */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'mentor' && styles.roleCardSelected,
            ]}
            onPress={() => setSelectedRole('mentor')}
            activeOpacity={0.8}
          >
            <View style={[styles.roleIcon, styles.mentorIcon]}>
              <Users size={40} color="#10B981" />
            </View>
            <Text style={styles.roleTitle}>I want to teach</Text>
            <Text style={styles.roleSubtitle}>Mentor</Text>
            <Text style={styles.roleDescription}>
              Share your expertise with aspiring learners and make a meaningful impact on their growth.
            </Text>
            <View style={styles.roleFeatures}>
              <Text style={styles.roleFeature}>• Share your expertise</Text>
              <Text style={styles.roleFeature}>• Build your reputation</Text>
              <Text style={styles.roleFeature}>• Earn from mentoring</Text>
              <Text style={styles.roleFeature}>• Help others succeed</Text>
            </View>
            {selectedRole === 'mentor' && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedText}>✓ Selected</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRole && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedRole}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!selectedRole ? ['#9CA3AF', '#9CA3AF'] : ['#4F46E5', '#7C3AED']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <ArrowRight size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
          <Text style={styles.progressText}>2 of 4</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: height,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  rolesContainer: {
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#fff',
    transform: [{ scale: 1.02 }],
  },
  roleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  menteeIcon: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  mentorIcon: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  roleFeatures: {
    alignItems: 'flex-start',
  },
  roleFeature: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectedIndicator: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  continueButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
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