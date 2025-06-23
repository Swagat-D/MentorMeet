// app/(onboarding)/goals.tsx - Goals Selection Screen with Warm Theme
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
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Learning Goals data for students
const learningGoals = [
  { id: 'academic-excellence', label: 'Academic Excellence', icon: 'school', description: 'Improve grades & understanding' },
  { id: 'exam-preparation', label: 'Exam Preparation', icon: 'quiz', description: 'Ace your upcoming tests' },
  { id: 'skill-development', label: 'Skill Development', icon: 'build', description: 'Learn new abilities' },
  { id: 'career-guidance', label: 'Career Guidance', icon: 'work', description: 'Plan your future path' },
  { id: 'homework-help', label: 'Homework Help', icon: 'assignment', description: 'Get support with assignments' },
  { id: 'study-habits', label: 'Study Habits', icon: 'schedule', description: 'Develop better routines' },
  { id: 'college-prep', label: 'College Preparation', icon: 'business', description: 'Get ready for higher education' },
  { id: 'subject-mastery', label: 'Subject Mastery', icon: 'auto-awesome', description: 'Excel in specific subjects' },
  { id: 'confidence-building', label: 'Confidence Building', icon: 'emoji-events', description: 'Boost self-esteem' },
  { id: 'time-management', label: 'Time Management', icon: 'access-time', description: 'Organize your schedule' },
  { id: 'research-skills', label: 'Research Skills', icon: 'search', description: 'Learn to find information' },
  { id: 'presentation-skills', label: 'Presentation Skills', icon: 'presentation', description: 'Improve public speaking' },
];

export default function GoalsScreen() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { updateProfile } = useAuthStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;

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
    ]).start();

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

    floatingAnimations.forEach(anim => anim.start());

    return () => {
      floatingAnimations.forEach(anim => anim.stop());
    };
  }, []);

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      updateProfile({ goals: selectedGoals });
      router.push("/(onboarding)/complete");
    }
  };

  const handleSkip = () => {
    // Skip with creativity - show animation
    const skipAnimation = Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    skipAnimation.start(() => {
      updateProfile({ goals: [] });
      router.push("/(onboarding)/complete");
    });
  };

  const renderGoalItem = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedGoals.includes(item.id);
    
    return (
      <Animated.View
        style={[
          styles.goalItemContainer,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.goalItem,
            isSelected && styles.goalItemSelected,
          ]}
          onPress={() => toggleGoal(item.id)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.goalIcon,
            isSelected && styles.goalIconSelected,
          ]}>
            <MaterialIcons
              name={item.icon as any} 
              size={24} 
              color={isSelected ? "#fff" : "#8b5a3c"} 
            />
          </View>
          
          <View style={styles.goalContent}>
            <Text style={[
              styles.goalTitle,
              isSelected && styles.goalTitleSelected,
            ]}>
              {item.label}
            </Text>
            <Text style={[
              styles.goalDescription,
              isSelected && styles.goalDescriptionSelected,
            ]}>
              {item.description}
            </Text>
          </View>
          
          {isSelected && (
            <View style={styles.checkIcon}>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Interpolations for floating elements
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
          <MaterialIcons name="my-location" size={20} color="rgba(139, 90, 60, 0.4)" />
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
          <MaterialIcons name="emoji-events" size={18} color="rgba(217, 119, 6, 0.4)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            {
              opacity: fadeAnim,
              transform: [{ translateY: float3Y }],
            },
          ]}
        >
          <MaterialIcons name="star" size={16} color="rgba(5, 150, 105, 0.4)" />
        </Animated.View>
      </View>

      <View style={styles.content}>
        {/* Creative Header with Skip Option */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.logoSmall}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.logoSmallGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="my-location" size={20} color="#5d4e37" />
              </LinearGradient>
            </View>
            
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <MaterialIcons name="fast-forward" size={16} color="#8b7355" />
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>What are your learning goals?</Text>
          <Text style={styles.subtitle}>
            Select your objectives so we can match you with the perfect mentors
          </Text>
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check" size={16} color="#8b5a3c" />
            <Text style={styles.selectedCount}>
              {selectedGoals.length} selected
            </Text>
          </View>
        </Animated.View>

        {/* Goals List */}
        <Animated.View
          style={[
            styles.goalsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <FlatList
            data={learningGoals}
            renderItem={renderGoalItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.goalsList}
          />
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
              selectedGoals.length === 0 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={selectedGoals.length === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedGoals.length === 0 ? ['#b8a082', '#b8a082'] : ['#8b5a3c', '#d97706']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>
                {selectedGoals.length === 0 ? 'Select goals to continue' : 'Complete Setup'}
              </Text>
              <MaterialIcons name="check" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {selectedGoals.length === 0 && (
            <Text style={styles.helperText}>
              Choose at least one goal or skip to continue
            </Text>
          )}
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
          </View>
          <Text style={styles.progressText}>2 of 3</Text>
        </Animated.View>
      </View>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  element1: {
    top: height * 0.2,
    left: width * 0.15,
  },
  element2: {
    top: height * 0.35,
    right: width * 0.1,
  },
  element3: {
    bottom: height * 0.25,
    left: width * 0.25,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  logoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logoSmallGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  skipText: {
    fontSize: 12,
    color: '#8b7355',
    marginLeft: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 60, 0.2)',
  },
  selectedCount: {
    fontSize: 14,
    color: '#8b5a3c',
    fontWeight: '600',
    marginLeft: 6,
  },
  goalsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  goalsList: {
    paddingBottom: 20,
  },
  goalItemContainer: {
    marginBottom: 12,
  },
  goalItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 100, 0.2)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalItemSelected: {
    backgroundColor: '#8b5a3c',
    borderColor: '#8b5a3c',
    transform: [{ scale: 1.02 }],
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  goalIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3728',
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: '#fff',
  },
  goalDescription: {
    fontSize: 13,
    color: '#8b7355',
  },
  goalDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  checkIcon: {
    marginLeft: 12,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5a3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  helperText: {
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