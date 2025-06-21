// app/(onboarding)/interests.tsx - Interests Selection Screen
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

// Subjects/Interests data
const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Engineering',
  'English Literature',
  'Creative Writing',
  'History',
  'Geography',
  'Economics',
  'Business Studies',
  'Psychology',
  'Philosophy',
  'Art & Design',
  'Music',
  'Photography',
  'Spanish',
  'French',
  'Japanese',
  'Physical Education',
  'Health & Nutrition',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Digital Marketing',
  'Public Speaking',
  'Leadership',
  'Entrepreneurship',
];

export default function InterestsScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
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

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleContinue = () => {
    if (selectedInterests.length > 0) {
      updateProfile({ interests: selectedInterests });
      router.push("/(onboarding)/goals");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderInterestItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = selectedInterests.includes(item);
    
    return (
      <Animated.View
        style={[
          styles.interestItemContainer,
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
            styles.interestItem,
            isSelected && styles.interestItemSelected,
          ]}
          onPress={() => toggleInterest(item)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.interestText,
            isSelected && styles.interestTextSelected,
          ]}>
            {item}
          </Text>
          {isSelected && (
            <View style={styles.checkIcon}>
              <MaterialIcons name="check" size={16} color="#fff" />
            </View>
          )}
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
          <Text style={styles.title}>What interests you?</Text>
          <Text style={styles.subtitle}>
            Select topics you want to learn about. Choose at least 3 to get personalized recommendations.
          </Text>
          <Text style={styles.selectedCount}>
            Selected: {selectedInterests.length}
          </Text>
        </Animated.View>

        {/* Interests Grid */}
        <Animated.View
          style={[
            styles.interestsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <FlatList
            data={subjects}
            renderItem={renderInterestItem}
            keyExtractor={(item) => item}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.interestsList}
            columnWrapperStyle={styles.interestsRow}
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
              selectedInterests.length === 0 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={selectedInterests.length === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedInterests.length === 0 ? ['#9CA3AF', '#9CA3AF'] : ['#4F46E5', '#7C3AED']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {selectedInterests.length === 0 && (
            <Text style={styles.helperText}>
              Select at least one interest to continue
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
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
          <Text style={styles.progressText}>3 of 4</Text>
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
  interestsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  interestsList: {
    paddingBottom: 20,
  },
  interestsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  interestItemContainer: {
    width: (width - 60) / 2,
  },
  interestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  interestItemSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#fff',
    transform: [{ scale: 1.05 }],
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  interestTextSelected: {
    color: '#fff',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
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