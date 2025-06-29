// app/profile/edit.tsx - Edit Profile Screen
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Options from your onboarding
const genderOptions = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const ageRanges = [
  { id: '13-17', label: '13-17 years' },
  { id: '18-22', label: '18-22 years' },
  { id: '23-27', label: '23-27 years' },
  { id: '28+', label: '28+ years' },
];

const studyLevels = [
  { id: 'high-school', label: 'High School', description: 'Grade 9-12' },
  { id: 'undergraduate', label: 'Undergraduate', description: 'Bachelor\'s Degree' },
  { id: 'graduate', label: 'Graduate', description: 'Master\'s/PhD' },
  { id: 'professional', label: 'Professional', description: 'Working Professional' },
];

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [selectedGender, setSelectedGender] = useState(user?.gender || '');
  const [selectedAge, setSelectedAge] = useState(user?.ageRange || '');
  const [selectedStudyLevel, setSelectedStudyLevel] = useState(user?.studyLevel || '');
  
  const [errors, setErrors] = useState<{
    name?: string;
    gender?: string;
    age?: string;
    studyLevel?: string;
  }>({});

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

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
      await updateProfile({
        name: name.trim(),
        gender: selectedGender,
        ageRange: selectedAge,
        studyLevel: selectedStudyLevel,
      });

      Alert.alert(
        "Success",
        "Your profile has been updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const OptionSelector = ({ 
    title, 
    options, 
    selectedValue, 
    onSelect, 
    error,
    showDescription = false 
  }: any) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option: any) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedValue === option.id && styles.optionCardSelected,
              error && styles.optionCardError,
            ]}
            onPress={() => {
              onSelect(option.id);
              if (error) {
                setErrors(prev => ({ ...prev, [title.toLowerCase().replace(' ', '')]: undefined }));
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.optionLabel,
              selectedValue === option.id && styles.optionLabelSelected,
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Warm Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[
                styles.inputContainer,
                errors.name && styles.inputContainerError
              ]}>
                <MaterialIcons name="person" size={20} color={errors.name ? "#dc2626" : "#8b7355"} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#a0916d"
                  autoCapitalize="words"
                />
              </View>
              {errors.name && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#dc2626" />
                  <Text style={styles.errorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            {/* Gender Selection */}
            <OptionSelector
              title="Gender"
              options={genderOptions}
              selectedValue={selectedGender}
              onSelect={setSelectedGender}
              error={errors.gender}
            />

            {/* Age Range Selection */}
            <OptionSelector
              title="Age Range"
              options={ageRanges}
              selectedValue={selectedAge}
              onSelect={setSelectedAge}
              error={errors.age}
            />

            {/* Study Level Selection */}
            <OptionSelector
              title="Study Level"
              options={studyLevels}
              selectedValue={selectedStudyLevel}
              onSelect={setSelectedStudyLevel}
              error={errors.studyLevel}
              showDescription={true}
            />

            {/* Save Button */}
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
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  headerSpacer: {
    width: 32,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  inputContainerError: {
    borderColor: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.05)",
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4a3728",
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 12,
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
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    alignItems: "center",
  },
  optionCardSelected: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  optionCardError: {
    borderColor: "#dc2626",
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
  optionDescription: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "center",
  },
  optionDescriptionSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginLeft: 4,
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
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
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#8b7355",
    fontSize: 16,
    fontWeight: "500",
  },
});