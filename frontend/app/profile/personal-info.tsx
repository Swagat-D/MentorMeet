// app/profile/personal-info.tsx - Personal Information Edit Screen with Backend Integration
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

const { width } = Dimensions.get('window');

// Options from your user model
const genderOptions = [
  { id: 'male', label: 'Male', icon: 'person' },
  { id: 'female', label: 'Female', icon: 'person' },
  { id: 'other', label: 'Other', icon: 'person' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say', icon: 'person' },
];

const ageRanges = [
  { id: '13-17', label: '13-17 years', icon: 'cake' },
  { id: '18-22', label: '18-22 years', icon: 'cake' },
  { id: '23-27', label: '23-27 years', icon: 'cake' },
  { id: '28+', label: '28+ years', icon: 'cake' },
];

const studyLevels = [
  { id: 'high-school', label: 'High School', icon: 'school', description: 'Grade 9-12' },
  { id: 'undergraduate', label: 'Undergraduate', icon: 'business', description: 'Bachelor\'s Degree' },
  { id: 'graduate', label: 'Graduate', icon: 'work', description: 'Master\'s/PhD' },
  { id: 'professional', label: 'Professional', icon: 'emoji-events', description: 'Working Professional' },
];

// Common timezones
const timezones = [
  { id: 'UTC+05:30', label: 'India Standard Time (IST)' },
  { id: 'UTC-08:00', label: 'Pacific Time (PST)' },
  { id: 'UTC-05:00', label: 'Eastern Time (EST)' },
  { id: 'UTC+00:00', label: 'Greenwich Mean Time (GMT)' },
  { id: 'UTC+01:00', label: 'Central European Time (CET)' },
  { id: 'UTC+08:00', label: 'China Standard Time (CST)' },
  { id: 'UTC+09:00', label: 'Japan Standard Time (JST)' },
  { id: 'UTC+10:00', label: 'Australian Eastern Time (AET)' },
];

interface UpdatePersonalInfoData {
  gender?: string;
  ageRange?: string;
  studyLevel?: string;
  timezone?: string;
}

export default function PersonalInfoScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
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
  const floatingAnim = useRef(new Animated.Value(0)).current;

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
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    // Floating animation
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
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
      // Get the auth token using TokenManager
      const authToken = await TokenManager.getAccessToken();
      
      if (!authToken) {
        Alert.alert("Authentication Error", "Please log in again to continue.");
        return;
      }

      // Prepare the update data
      const updateData: UpdatePersonalInfoData = {
        gender: selectedGender,
        ageRange: selectedAge,
        studyLevel: selectedStudyLevel,
        timezone: selectedTimezone,
      };

      // Get the API base URL - adjust this based on your environment
      const API_BASE_URL = __DEV__ 
        ? 'http://10.0.2.2:5000' // Android emulator
        : 'https://your-production-api.com'; // Production URL

      console.log('🔄 Updating personal info with data:', updateData);

      // Call the backend API to update personal information
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      console.log('📋 Personal info update response:', result);

      if (response.ok && result.success) {
        // Update the local auth store with the new user data
        if (result.data && result.data.user) {
          await updateProfile(result.data.user);
        }
        
        Alert.alert(
          "Personal Information Updated",
          "Your personal information has been updated successfully!",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // Handle API errors
        const errorMessage = result.message || 'Failed to update personal information';
        
        if (result.errors && Array.isArray(result.errors)) {
          // Handle validation errors from backend
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
      
      if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
        Alert.alert(
          "Network Error", 
          "Please check your internet connection and try again."
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

  const OptionCard = ({ 
    title, 
    options, 
    selectedValue, 
    onSelect, 
    error,
    showDescription = false,
    columns = 2
  }: any) => (
    <View style={styles.optionSection}>
      <Text style={styles.optionTitle}>{title}</Text>
      <View style={[
        styles.optionsGrid,
        columns === 1 && styles.optionsGridSingle,
        columns === 4 && styles.optionsGridQuad
      ]}>
        {options.map((option: any, index: number) => (
          <Animated.View
            key={option.id}
            style={[
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 + (index * 5)],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionCard,
                columns === 1 && styles.optionCardFull,
                columns === 4 && styles.optionCardQuarter,
                selectedValue === option.id && styles.optionCardSelected,
                error && styles.optionCardError,
              ]}
              onPress={() => {
                onSelect(option.id);
                if (error) {
                  setErrors(prev => ({ ...prev, [title.toLowerCase().replace(/\s+/g, '')]: undefined }));
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[
                styles.optionIcon,
                selectedValue === option.id && styles.optionIconSelected,
              ]}>
                <MaterialIcons 
                  name={option.icon as any} 
                  size={columns === 4 ? 16 : 20} 
                  color={selectedValue === option.id ? "#fff" : "#8b5a3c"} 
                />
              </View>
              <Text style={[
                styles.optionLabel,
                selectedValue === option.id && styles.optionLabelSelected,
                columns === 4 && styles.optionLabelSmall,
              ]}>
                {option.label}
              </Text>
              {showDescription && option.description && (
                <Text style={[
                  styles.optionDescription,
                  selectedValue === option.id && styles.optionDescriptionSelected,
                ]}>
                  {option.description}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  const TimezoneSelector = () => (
    <View style={styles.optionSection}>
      <Text style={styles.optionTitle}>Timezone</Text>
      <View style={styles.timezoneContainer}>
        {timezones.map((timezone, index) => (
          <Animated.View
            key={timezone.id}
            style={[
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 + (index * 3)],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.timezoneOption,
                selectedTimezone === timezone.id && styles.timezoneOptionSelected,
              ]}
              onPress={() => setSelectedTimezone(timezone.id)}
              activeOpacity={0.8}
            >
              <View style={styles.timezoneLeft}>
                <MaterialIcons 
                  name="schedule" 
                  size={18} 
                  color={selectedTimezone === timezone.id ? "#8b5a3c" : "#8b7355"} 
                />
                <Text style={[
                  styles.timezoneLabel,
                  selectedTimezone === timezone.id && styles.timezoneLabelSelected,
                ]}>
                  {timezone.label}
                </Text>
              </View>
              {selectedTimezone === timezone.id && (
                <MaterialIcons name="check-circle" size={20} color="#8b5a3c" />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  // Floating elements animation
  const floatY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0', '#f1f0ec']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Elements */}
      <View style={styles.backgroundPattern}>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element1,
            {
              opacity: fadeAnim,
              transform: [{ translateY: floatY }],
            },
          ]}
        >
          <MaterialIcons name="person" size={20} color="rgba(139, 90, 60, 0.3)" />
        </Animated.View>
        <Animated.View
          style={[
            styles.floatingElement,
            styles.element2,
            {
              opacity: fadeAnim,
              transform: [{ translateY: floatY }],
            },
          ]}
        >
          <MaterialIcons name="school" size={18} color="rgba(217, 119, 6, 0.3)" />
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
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="person-outline" size={32} color="#8b5a3c" />
            </View>
            <Text style={styles.headerInfoTitle}>Tell us about yourself</Text>
            <Text style={styles.headerInfoSubtitle}>
              This information helps us personalize your learning experience and connect you with the right mentors
            </Text>
          </View>

          {/* Form Sections */}
          <View style={styles.formContainer}>
            <OptionCard
              title="Gender"
              options={genderOptions}
              selectedValue={selectedGender}
              onSelect={setSelectedGender}
              error={errors.gender}
              columns={2}
            />

            <OptionCard
              title="Age Range"
              options={ageRanges}
              selectedValue={selectedAge}
              onSelect={setSelectedAge}
              error={errors.age}
              columns={4}
            />

            <OptionCard
              title="Study Level"
              options={studyLevels}
              selectedValue={selectedStudyLevel}
              onSelect={setSelectedStudyLevel}
              error={errors.studyLevel}
              showDescription={true}
              columns={1}
            />

            <TimezoneSelector />
          </View>

          {/* Save Button */}
          <Animated.View
            style={[
              styles.saveButtonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
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
    top: '20%',
    left: '10%',
  },
  element2: {
    top: '60%',
    right: '15%',
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
  },
  scrollContent: {
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerInfo: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  headerInfoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 8,
    textAlign: "center",
  },
  headerInfoSubtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  optionSection: {
    marginBottom: 32,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  optionsGridSingle: {
    flexDirection: "column",
    gap: 12,
  },
  optionsGridQuad: {
    justifyContent: "space-between",
    gap: 6,
  },
  optionCard: {
    width: (width - 72) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 100,
    justifyContent: "center",
  },
  optionCardFull: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    minHeight: 70,
  },
  optionCardQuarter: {
    width: (width - 88) / 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 80,
  },
  optionCardSelected: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
    transform: [{ scale: 1.02 }],
  },
  optionCardError: {
    borderColor: "#dc2626",
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionIconSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a3728",
    textAlign: "center",
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: "#fff",
  },
  optionLabelSmall: {
    fontSize: 12,
    marginTop: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "center",
  },
  optionDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  timezoneContainer: {
    gap: 8,
  },
  timezoneOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  timezoneOptionSelected: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    borderColor: "#8b5a3c",
  },
  timezoneLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timezoneLabel: {
    fontSize: 14,
    color: "#4a3728",
    marginLeft: 12,
    fontWeight: "500",
  },
  timezoneLabelSelected: {
    color: "#8b5a3c",
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginLeft: 4,
  },
  saveButtonContainer: {
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});