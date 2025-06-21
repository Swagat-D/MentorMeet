// app/(onboarding)/goals.tsx - Goals Selection Screen
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

// Learning Goals data
const learningGoals = [
  'Academic Excellence',
  'Career Development',
  'Skill Enhancement',
  'Personal Growth',
  'Test Preparation',
  'College Admission',
  'Job Interview Prep',
  'Industry Certification',
  'Creative Projects',
  'Research & Development',
  'Language Fluency',
  'Technical Mastery',
  'Leadership Skills',
  'Communication Skills',
  'Problem Solving',
  'Critical Thinking',
  'Time Management',
  'Stress Management',
  'Networking',
  'Portfolio Building',
  'Public Speaking',
  'Team Collaboration',
  'Project Management',
  'Financial Literacy',
];

export default function GoalsScreen() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const { updateProfile } = useAuthStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, []);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      updateProfile({ goals: selectedGoals });
      router.push("/(onboarding)/complete");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderGoalItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = selectedGoals.includes(item);
    
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
          onPress={() => toggleGoal(item)}
          activeOpacity={0.8}
        >
          <View style={styles.goalContent}>
            <MaterialIcons
              name="my-location" 
              size={20} 
              color={isSelected ? "#fff" : "#4F46E5"} 
              style={styles.goalIcon}
            />
            <Text style={[
              styles.goalText,
              isSelected && styles.goalTextSelected,
            ]}>
              {item}
            </Text>
            {isSelected && (
              <View style={styles.checkIcon}>
                <MaterialIcons name="check" size={16} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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

      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
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
          <Text style={styles.title}>What are your goals?</Text>
          <Text style={styles.subtitle}>
            Tell us what you want to achieve. This helps us match you with the right mentors and resources.
          </Text>
          <Text style={styles.selectedCount}>
            Selected: {selectedGoals.length}
          </Text>
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
            keyExtractor={(item) => item}
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
              colors={selectedGoals.length === 0 ? ['#9CA3AF', '#9CA3AF'] : ['#4F46E5', '#7C3AED']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {selectedGoals.length === 0 && (
            <Text style={styles.helperText}>
              Select at least one goal to continue
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
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>
          <Text style={styles.progressText}>4 of 4</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 30,
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
    marginBottom: 16,
  },
  selectedCount: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
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
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalItemSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#fff',
    transform: [{ scale: 1.02 }],
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalIcon: {
    marginRight: 12,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  goalTextSelected: {
    color: '#fff',
  },
  checkIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
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
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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