// app/(onboarding)/welcome.tsx - Updated Welcome Screen with Student Info
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
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Study levels for students
const studyLevels = [
  { id: 'high-school', label: 'High School', icon: 'school', description: 'Grade 9-12' },
  { id: 'undergraduate', label: 'Undergraduate', icon: 'business', description: 'Bachelor\'s Degree' },
  { id: 'graduate', label: 'Graduate', icon: 'work', description: 'Master\'s/PhD' },
  { id: 'professional', label: 'Professional', icon: 'emoji-events', description: 'Working Professional' },
];

// Age ranges
const ageRanges = [
  { id: '13-17', label: '13-17 years' },
  { id: '18-22', label: '18-22 years' },
  { id: '23-27', label: '23-27 years' },
  { id: '28+', label: '28+ years' },
];

export default function OnboardingWelcomeScreen() {
  const { updateProfile } = useAuthStore();
  
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState<string>("");
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<string>("");
  const [errors, setErrors] = useState<{
    name?: string;
    age?: string;
    studyLevel?: string;
  }>({});

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;

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
    ];

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
    floatingAnimations.forEach(anim => anim.start());
    
    // Start bounce animation after initial animations
    setTimeout(() => {
      bounceAnimation.start();
    }, 1500);

    return () => {
      sequence.stop();
      floatingAnimations.forEach(anim => anim.stop());
      bounceAnimation.stop();
    };
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Please enter your name";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    if (!selectedAge) {
      newErrors.age = "Please select your age range";
      isValid = false;
    }

    if (!selectedStudyLevel) {
      newErrors.studyLevel = "Please select your study level";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGetStarted = () => {
    if (!validateForm()) {
      return;
    }

    // Update profile with basic info
    updateProfile({
      name: name.trim(),
      ageRange: selectedAge,
      studyLevel: selectedStudyLevel,
      role: 'mentee', // Fixed as student/mentee
    });

    router.push("/(onboarding)/goals");
  };

  // Interpolations
  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const float1Y = floatingAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const float2Y = floatingAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

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

      {/* Floating Elements */}
      <View style={styles.backgroundPattern}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float1Y }],
            },
          ]}
        >
          <MaterialIcons name="school" size={24} color="rgba(139, 90, 60, 0.3)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float2Y }],
            },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={20} color="rgba(217, 119, 6, 0.3)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float1Y }],
            },
          ]}
        >
          <MaterialIcons name="lightbulb" size={18} color="rgba(5, 150, 105, 0.3)" />
        </Animated.View>
      </View>

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
              colors={['#ffffff', '#f8fafc']}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>M</Text>
            </LinearGradient>
            
            <View style={styles.sparkleContainer}>
              <MaterialIcons name="auto-awesome" size={16} color="#d97706" />
            </View>
          </View>

          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>MentorMatch</Text>
          <Text style={styles.tagline}>Let's personalize your learning journey</Text>
        </Animated.View>

        {/* Main Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>What should we call you?</Text>
            <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
              <MaterialIcons name="person" size={20} color={errors.name ? "#d97706" : "#a0916d"} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#b8a082"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: undefined }));
                  }
                }}
                autoCapitalize="words"
                autoFocus={true}
              />
            </View>
            {errors.name && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={12} color="#d97706" />
                <Text style={styles.errorText}>{errors.name}</Text>
              </View>
            )}
          </View>

          {/* Age Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>How old are you?</Text>
            <View style={styles.optionsGrid}>
              {ageRanges.map((age) => (
                <TouchableOpacity
                  key={age.id}
                  style={[
                    styles.optionCard,
                    selectedAge === age.id && styles.optionCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedAge(age.id);
                    if (errors.age) {
                      setErrors(prev => ({ ...prev, age: undefined }));
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons 
                    name="cake" 
                    size={20} 
                    color={selectedAge === age.id ? "#fff" : "#8b5a3c"} 
                  />
                  <Text style={[
                    styles.optionText,
                    selectedAge === age.id && styles.optionTextSelected,
                  ]}>
                    {age.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.age && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={12} color="#d97706" />
                <Text style={styles.errorText}>{errors.age}</Text>
              </View>
            )}
          </View>

          {/* Study Level Selection */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>What's your current study level?</Text>
            <View style={styles.studyLevelGrid}>
              {studyLevels.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.studyLevelCard,
                    selectedStudyLevel === level.id && styles.studyLevelCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedStudyLevel(level.id);
                    if (errors.studyLevel) {
                      setErrors(prev => ({ ...prev, studyLevel: undefined }));
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.studyLevelIcon,
                    selectedStudyLevel === level.id && styles.studyLevelIconSelected,
                  ]}>
                    <MaterialIcons 
                      name={level.icon as any} 
                      size={24} 
                      color={selectedStudyLevel === level.id ? "#fff" : "#8b5a3c"} 
                    />
                  </View>
                  <Text style={[
                    styles.studyLevelTitle,
                    selectedStudyLevel === level.id && styles.studyLevelTitleSelected,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.studyLevelDescription,
                    selectedStudyLevel === level.id && styles.studyLevelDescriptionSelected,
                  ]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.studyLevel && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={12} color="#d97706" />
                <Text style={styles.errorText}>{errors.studyLevel}</Text>
              </View>
            )}
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
              colors={['#8b5a3c', '#d97706']}
              style={styles.getStartedGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.getStartedText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.setupTime}>Just a few more steps to go!</Text>
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
          </View>
          <Text style={styles.progressText}>1 of 3</Text>
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
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingElement: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  element1: {
    top: height * 0.15,
    left: width * 0.1,
  },
  element2: {
    top: height * 0.25,
    right: width * 0.15,
  },
  element3: {
    bottom: height * 0.3,
    left: width * 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: height,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  logoText: {
    color: '#5d4e37',
    fontSize: 32,
    fontWeight: 'bold',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#8b7355',
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  inputSection: {
    marginBottom: 32,
  },
  selectionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  inputError: {
    borderColor: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.05)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4a3728",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
  },
  errorText: {
    color: "#d97706",
    fontSize: 12,
    marginLeft: 4,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  optionCardSelected: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    marginTop: 8,
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#fff",
  },
  studyLevelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  studyLevelCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  studyLevelCardSelected: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  studyLevelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  studyLevelIconSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  studyLevelTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
    textAlign: "center",
  },
  studyLevelTitleSelected: {
    color: "#fff",
  },
  studyLevelDescription: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "center",
  },
  studyLevelDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  getStartedButton: {
    width: width - 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5a3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
  },
  getStartedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  setupTime: {
    fontSize: 14,
    color: '#8b7355',
    textAlign: 'center',
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
  },
});