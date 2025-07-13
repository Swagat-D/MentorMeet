// app/profile/personal-info.tsx - Updated with Dynamic API Service
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, TokenManager } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from "@/services/api"; // Updated import

const { width } = Dimensions.get('window');

// ... (all the existing options remain the same)
const genderOptions = [
  { 
    id: 'male', 
    label: 'Male', 
    icon: 'person', 
    emoji: '👨',
    description: 'Identify as male'
  },
  { 
    id: 'female', 
    label: 'Female', 
    icon: 'person', 
    emoji: '👩',
    description: 'Identify as female'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: 'person', 
    emoji: '🧑',
    description: 'Other gender identity'
  },
  { 
    id: 'prefer-not-to-say', 
    label: 'Prefer not to say', 
    icon: 'person', 
    emoji: '🤐',
    description: 'Keep this private'
  },
];

const ageRanges = [
  { 
    id: '13-17', 
    label: '13-17', 
    icon: 'cake', 
    emoji: '🎂',
    description: 'Teen years',
    color: '#ff6b6b'
  },
  { 
    id: '18-22', 
    label: '18-22', 
    icon: 'cake', 
    emoji: '🎓',
    description: 'College age',
    color: '#4ecdc4'
  },
  { 
    id: '23-27', 
    label: '23-27', 
    icon: 'cake', 
    emoji: '💼',
    description: 'Early career',
    color: '#45b7d1'
  },
  { 
    id: '28+', 
    label: '28+', 
    icon: 'cake', 
    emoji: '🌟',
    description: 'Experienced',
    color: '#f9ca24'
  },
];

const studyLevels = [
  { 
    id: 'high-school', 
    label: 'High School', 
    icon: 'school', 
    description: 'Grade 9-12',
    emoji: '📚',
    gradient: ['#ff9a9e', '#fecfef'],
    benefits: ['Foundation building', 'College preparation', 'Core subjects']
  },
  { 
    id: 'undergraduate', 
    label: 'Undergraduate', 
    icon: 'business', 
    description: 'Bachelor\'s Degree',
    emoji: '🎓',
    gradient: ['#a8edea', '#fed6e3'],
    benefits: ['Specialized knowledge', 'Career preparation', 'Research skills']
  },
  { 
    id: 'graduate', 
    label: 'Graduate', 
    icon: 'work', 
    description: 'Master\'s/PhD',
    emoji: '🔬',
    gradient: ['#d299c2', '#fef9d7'],
    benefits: ['Advanced research', 'Expertise development', 'Academic careers']
  },
  { 
    id: 'professional', 
    label: 'Professional', 
    icon: 'emoji-events', 
    description: 'Working Professional',
    emoji: '💼',
    gradient: ['#89f7fe', '#66a6ff'],
    benefits: ['Skill enhancement', 'Career advancement', 'Industry knowledge']
  },
];

const timezoneGroups = {
  'Popular': [
    { id: 'UTC+05:30', label: 'India Standard Time (IST)', flag: '🇮🇳' },
    { id: 'UTC-08:00', label: 'Pacific Time (PST)', flag: '🇺🇸' },
    { id: 'UTC-05:00', label: 'Eastern Time (EST)', flag: '🇺🇸' },
    { id: 'UTC+00:00', label: 'Greenwich Mean Time (GMT)', flag: '🇬🇧' },
  ],
  'Asia': [
    { id: 'UTC+08:00', label: 'China Standard Time', flag: '🇨🇳' },
    { id: 'UTC+09:00', label: 'Japan Standard Time', flag: '🇯🇵' },
    { id: 'UTC+07:00', label: 'Thailand Time', flag: '🇹🇭' },
  ],
  'Europe': [
    { id: 'UTC+01:00', label: 'Central European Time', flag: '🇩🇪' },
    { id: 'UTC+02:00', label: 'Eastern European Time', flag: '🇷🇴' },
    { id: 'UTC+03:00', label: 'Moscow Time', flag: '🇷🇺' },
  ],
  'Others': [
    { id: 'UTC+10:00', label: 'Australian Eastern Time', flag: '🇦🇺' },
    { id: 'UTC-03:00', label: 'Argentina Time', flag: '🇦🇷' },
    { id: 'UTC+04:00', label: 'Gulf Standard Time', flag: '🇦🇪' },
  ],
};

interface UpdatePersonalInfoData {
  gender?: string;
  ageRange?: string;
  studyLevel?: string;
  timezone?: string;
}

export default function PersonalInfoScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Form state - Initialize with user data
  const [selectedGender, setSelectedGender] = useState(user?.gender || '');
  const [selectedAge, setSelectedAge] = useState(user?.ageRange || '');
  const [selectedStudyLevel, setSelectedStudyLevel] = useState(user?.studyLevel || '');
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || 'UTC+05:30');
  
  const [errors, setErrors] = useState<{
    gender?: string;
    age?: string;
    studyLevel?: string;
  }>({});

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Floating animation
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    );

    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
    };
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!selectedGender) {
      newErrors.gender = "Please select your gender";
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const authToken = await TokenManager.getAccessToken();
      
      if (!authToken) {
        Alert.alert("Authentication Error", "Please log in again to continue.");
        return;
      }

      const updateData: UpdatePersonalInfoData = {
        gender: selectedGender,
        ageRange: selectedAge,
        studyLevel: selectedStudyLevel,
        timezone: selectedTimezone,
      };

      console.log('🔄 Updating personal info with data:', updateData);

      // Use the new ApiService with dynamic endpoint discovery
      const result = await ApiService.put('UPDATE_PROFILE', updateData);
      
      console.log('📋 Personal info update response:', result);

      if (result.success) {
        if (result.data && result.data.user) {
          await updateProfile(result.data.user);
        }
        
        Alert.alert(
          "✨ Profile Updated!",
          "Your personal information has been updated successfully!",
          [
            {
              text: "Great!",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        const errorMessage = result.message || 'Failed to update personal information';
        
        if (result.errors && Array.isArray(result.errors)) {
          const newErrors: typeof errors = {};
          result.errors.forEach((error: any) => {
            if (error.field) {
              newErrors[error.field as keyof typeof errors] = error.message;
            }
          });
          setErrors(newErrors);
        } else {
          Alert.alert("Error", errorMessage);
        }
      }
    } catch (error: any) {
      console.error('💥 Personal info update error:', error);
      
      if (error.message.includes('Network error') || error.message.includes('timeout')) {
        Alert.alert(
          "Connection Error", 
          "Could not connect to the server. Please check your connection settings and try again.",
          [
            {
              text: "Check Settings",
              onPress: () => router.push('/settings/connection'),
            },
            {
              text: "Try Again",
              onPress: handleSave,
            },
          ]
        );
      } else {
        Alert.alert(
          "Error", 
          "Failed to update personal information. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animated floating elements
  const floatY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const floatY2 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  // ... (all the existing component functions remain the same)
  const CreativeSection = ({ title, emoji, children, error }: any) => (
    <Animated.View
      style={[
        styles.creativeSection,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 246, 240, 0.9)']}
        style={styles.sectionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>{emoji}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          {error && (
            <View style={styles.errorBadge}>
              <MaterialIcons name="error" size={16} color="#fff" />
            </View>
          )}
        </View>
        {children}
        {error && (
          <View style={styles.sectionError}>
            <MaterialIcons name="error-outline" size={16} color="#dc2626" />
            <Text style={styles.sectionErrorText}>{error}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  // ... (all other component functions remain the same - GenderCard, AgeCard, StudyLevelCard, TimezoneGroup)
  const GenderCard = ({ option, isSelected, onSelect }: any) => (
    <TouchableOpacity
      style={[
        styles.genderCard,
        isSelected && styles.genderCardSelected,
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isSelected ? ['#8b5a3c', '#d97706'] : ['#ffffff', '#f8f9fa']}
        style={styles.genderCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.genderEmoji, isSelected && styles.selectedEmoji]}>
          {option.emoji}
        </Text>
        <Text style={[styles.genderLabel, isSelected && styles.selectedLabel]}>
          {option.label}
        </Text>
        <Text style={[styles.genderDescription, isSelected && styles.selectedDescription]}>
          {option.description}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const AgeCard = ({ option, isSelected, onSelect }: any) => (
    <TouchableOpacity
      style={[
        styles.ageCard,
        isSelected && styles.ageCardSelected,
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.ageCardContent,
        { backgroundColor: isSelected ? option.color : '#f8f9fa' }
      ]}>
        <Text style={[styles.ageEmoji, isSelected && { transform: [{ scale: 1.2 }] }]}>
          {option.emoji}
        </Text>
        <Text style={[styles.ageLabel, isSelected && styles.ageSelectedLabel]}>
          {option.label}
        </Text>
        <Text style={[styles.ageDescription, isSelected && styles.ageSelectedDescription]}>
          {option.description}
        </Text>
        {isSelected && (
          <View style={styles.ageSelectedIndicator}>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const StudyLevelCard = ({ option, isSelected, onSelect }: any) => (
    <TouchableOpacity
      style={[
        styles.studyCard,
        isSelected && styles.studyCardSelected,
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isSelected ? ['#8b5a3c', '#d97706'] : option.gradient}
        style={styles.studyCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.studyCardHeader}>
          <Text style={styles.studyEmoji}>{option.emoji}</Text>
          <Text style={[styles.studyLabel, isSelected && styles.studySelectedLabel]}>
            {option.label}
          </Text>
          {isSelected && (
            <MaterialIcons name="verified" size={20} color="#fff" />
          )}
        </View>
        
        <Text style={[styles.studyDescription, isSelected && styles.studySelectedDescription]}>
          {option.description}
        </Text>
        
        <View style={styles.studyBenefits}>
          {option.benefits.map((benefit: string, index: number) => (
            <View key={index} style={styles.benefitItem}>
              <MaterialIcons 
                name="check-circle" 
                size={12} 
                color={isSelected ? "rgba(255, 255, 255, 0.8)" : "#8b5a3c"} 
              />
              <Text style={[styles.benefitText, isSelected && styles.benefitSelectedText]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const TimezoneGroup = ({ groupName, timezones }: any) => (
    <View style={styles.timezoneGroup}>
      <Text style={styles.timezoneGroupTitle}>{groupName}</Text>
      {timezones.map((timezone: any, index: number) => (
        <TouchableOpacity
          key={timezone.id}
          style={[
            styles.timezoneOption,
            selectedTimezone === timezone.id && styles.timezoneSelected,
          ]}
          onPress={() => setSelectedTimezone(timezone.id)}
          activeOpacity={0.7}
        >
          <View style={styles.timezoneLeft}>
            <Text style={styles.timezoneFlag}>{timezone.flag}</Text>
            <View style={styles.timezoneInfo}>
              <Text style={[
                styles.timezoneLabel,
                selectedTimezone === timezone.id && styles.timezoneLabelSelected,
              ]}>
                {timezone.label}
              </Text>
              <Text style={[
                styles.timezoneId,
                selectedTimezone === timezone.id && styles.timezoneIdSelected,
              ]}>
                {timezone.id}
              </Text>
            </View>
          </View>
          {selectedTimezone === timezone.id && (
            <MaterialIcons name="radio-button-checked" size={20} color="#8b5a3c" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
              transform: [{ translateY: floatY }],
            },
          ]}
        >
          <MaterialIcons name="person" size={24} color="rgba(139, 90, 60, 0.4)" />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
              transform: [{ translateY: floatY2 }],
            },
          ]}
        >
          <MaterialIcons name="school" size={20} color="rgba(217, 119, 6, 0.4)" />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element3,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4],
              }),
              transform: [{ translateY: floatY }],
            },
          ]}
        >
          <MaterialIcons name="cake" size={18} color="rgba(245, 158, 11, 0.4)" />
        </Animated.View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.headerSave, isLoading && styles.headerSaveDisabled]}>
            {isLoading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 246, 240, 0.8)']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIcon}>
              <MaterialIcons name="person-outline" size={36} color="#8b5a3c" />
            </View>
            <Text style={styles.heroTitle}>Tell us about yourself</Text>
            <Text style={styles.heroSubtitle}>
              Help us personalize your learning experience with mentors who understand your journey
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Gender Selection */}
        <CreativeSection title="Gender Identity" emoji="👤" error={errors.gender}>
          <View style={styles.genderGrid}>
            {genderOptions.map((option) => (
              <GenderCard
                key={option.id}
                option={option}
                isSelected={selectedGender === option.id}
                onSelect={setSelectedGender}
              />
            ))}
          </View>
        </CreativeSection>

        {/* Age Range Selection */}
        <CreativeSection title="Age Range" emoji="🎂" error={errors.age}>
          <View style={styles.ageGrid}>
            {ageRanges.map((option) => (
              <AgeCard
                key={option.id}
                option={option}
                isSelected={selectedAge === option.id}
                onSelect={setSelectedAge}
              />
            ))}
          </View>
        </CreativeSection>

        {/* Study Level Selection */}
        <CreativeSection title="Study Level" emoji="📚" error={errors.studyLevel}>
          <View style={styles.studyGrid}>
            {studyLevels.map((option) => (
              <StudyLevelCard
                key={option.id}
                option={option}
                isSelected={selectedStudyLevel === option.id}
                onSelect={setSelectedStudyLevel}
              />
            ))}
          </View>
        </CreativeSection>

        {/* Timezone Selection */}
        <CreativeSection title="Timezone" emoji="🌍">
          <View style={styles.timezoneContainer}>
            {Object.entries(timezoneGroups).map(([groupName, timezones]) => (
              <TimezoneGroup
                key={groupName}
                groupName={groupName}
                timezones={timezones}
              />
            ))}
          </View>
        </CreativeSection>

        {/* Save Button */}
        <Animated.View
          style={[
            styles.saveSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#a0916d', '#a0916d'] : ['#8b5a3c', '#d97706']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <>
                  <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Saving Changes...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Personal Information</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingElement: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  element1: {
    top: '15%',
    left: '8%',
  },
  element2: {
    top: '35%',
    right: '10%',
  },
  element3: {
    top: '65%',
    left: '12%',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
    zIndex: 1,
  },
  headerButton: {
    width: 60,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerSave: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8b5a3c",
  },
  headerSaveDisabled: {
    color: "#a0916d",
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  heroGradient: {
    padding: 32,
    alignItems: "center",
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 12,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
  },
  creativeSection: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionGradient: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    position: 'relative',
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4a3728",
    flex: 1,
  },
  errorBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 4,
  },
  sectionError: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  sectionErrorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  
  // Gender Cards
  genderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  genderCard: {
    width: (width - 72) / 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  genderCardSelected: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  genderCardGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
    position: "relative",
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  selectedEmoji: {
    transform: [{ scale: 1.2 }],
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
    textAlign: "center",
  },
  selectedLabel: {
    color: "#fff",
  },
  genderDescription: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "center",
  },
  selectedDescription: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 4,
  },
  
  // Age Cards
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  ageCard: {
    width: (width - 88) / 4,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  ageCardSelected: {
    transform: [{ scale: 1.1 }],
  },
  ageCardContent: {
    padding: 16,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
    position: "relative",
    borderRadius: 16,
  },
  ageEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  ageLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 2,
    textAlign: "center",
  },
  ageSelectedLabel: {
    color: "#fff",
  },
  ageDescription: {
    fontSize: 10,
    color: "#8b7355",
    textAlign: "center",
  },
  ageSelectedDescription: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  ageSelectedIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  
  // Study Level Cards
  studyGrid: {
    gap: 16,
  },
  studyCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  studyCardSelected: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  studyCardGradient: {
    padding: 20,
  },
  studyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  studyEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  studyLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    flex: 1,
  },
  studySelectedLabel: {
    color: "#fff",
  },
  studyDescription: {
    fontSize: 14,
    color: "#8b7355",
    marginBottom: 16,
  },
  studySelectedDescription: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  studyBenefits: {
    gap: 6,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitText: {
    fontSize: 12,
    color: "#6b5b47",
    marginLeft: 6,
    fontWeight: "500",
  },
  benefitSelectedText: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  
  // Timezone Selection
  timezoneContainer: {
    gap: 20,
  },
  timezoneGroup: {
    marginBottom: 8,
  },
  timezoneGroupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 12,
    paddingLeft: 8,
  },
  timezoneOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  timezoneSelected: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderColor: "#8b5a3c",
    transform: [{ scale: 1.02 }],
  },
  timezoneLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timezoneFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneLabel: {
    fontSize: 14,
    color: "#4a3728",
    fontWeight: "500",
    marginBottom: 2,
  },
  timezoneLabelSelected: {
    color: "#8b5a3c",
    fontWeight: "600",
  },
  timezoneId: {
    fontSize: 12,
    color: "#8b7355",
  },
  timezoneIdSelected: {
    color: "#8b5a3c",
  },
  
  // Save Section
  saveSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});