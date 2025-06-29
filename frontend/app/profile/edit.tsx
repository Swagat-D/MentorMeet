// app/profile/edit.tsx - Enhanced Edit Profile Screen with All User Fields
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Options from your user model
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

// Common timezones
const timezones = [
  { id: 'UTC-12:00', label: '(UTC-12:00) International Date Line West' },
  { id: 'UTC-11:00', label: '(UTC-11:00) Coordinated Universal Time-11' },
  { id: 'UTC-10:00', label: '(UTC-10:00) Hawaii' },
  { id: 'UTC-09:00', label: '(UTC-09:00) Alaska' },
  { id: 'UTC-08:00', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { id: 'UTC-07:00', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { id: 'UTC-06:00', label: '(UTC-06:00) Central Time (US & Canada)' },
  { id: 'UTC-05:00', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { id: 'UTC-04:00', label: '(UTC-04:00) Atlantic Time (Canada)' },
  { id: 'UTC-03:00', label: '(UTC-03:00) Brasilia, Argentina' },
  { id: 'UTC-02:00', label: '(UTC-02:00) Mid-Atlantic' },
  { id: 'UTC-01:00', label: '(UTC-01:00) Cape Verde Islands' },
  { id: 'UTC+00:00', label: '(UTC+00:00) London, Dublin, Edinburgh' },
  { id: 'UTC+01:00', label: '(UTC+01:00) Berlin, Madrid, Paris' },
  { id: 'UTC+02:00', label: '(UTC+02:00) Cairo, Helsinki, Athens' },
  { id: 'UTC+03:00', label: '(UTC+03:00) Moscow, Kuwait, Riyadh' },
  { id: 'UTC+04:00', label: '(UTC+04:00) Abu Dhabi, Muscat' },
  { id: 'UTC+05:00', label: '(UTC+05:00) Islamabad, Karachi' },
  { id: 'UTC+05:30', label: '(UTC+05:30) Mumbai, New Delhi, Kolkata' },
  { id: 'UTC+06:00', label: '(UTC+06:00) Dhaka, Colombo' },
  { id: 'UTC+07:00', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { id: 'UTC+08:00', label: '(UTC+08:00) Beijing, Perth, Singapore' },
  { id: 'UTC+09:00', label: '(UTC+09:00) Tokyo, Seoul, Osaka' },
  { id: 'UTC+10:00', label: '(UTC+10:00) Eastern Australia, Guam' },
  { id: 'UTC+11:00', label: '(UTC+11:00) Magadan, Solomon Islands' },
  { id: 'UTC+12:00', label: '(UTC+12:00) Auckland, Wellington' },
];

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Form state - Basic Info
  const [name, setName] = useState(user?.name || '');
  const [selectedGender, setSelectedGender] = useState(user?.gender || '');
  const [selectedAge, setSelectedAge] = useState(user?.ageRange || '');
  const [selectedStudyLevel, setSelectedStudyLevel] = useState(user?.studyLevel || '');
  
  // Form state - Contact Info
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || 'UTC+05:30');
  
  // Form state - Additional Info
  const [bio, setBio] = useState(user?.bio || '');
  
  const [errors, setErrors] = useState<{
    name?: string;
    gender?: string;
    age?: string;
    studyLevel?: string;
    phone?: string;
    location?: string;
    bio?: string;
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

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Phone validation (optional but if provided, must be valid)
    if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Bio validation (optional but if provided, check length)
    if (bio && bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
      isValid = false;
    }

    // Location validation (optional but if provided, check length)
    if (location && location.length > 100) {
      newErrors.location = "Location cannot exceed 100 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendPhoneVerification = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter a phone number first");
      return;
    }

    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowPhoneVerification(true);
      Alert.alert(
        "Verification Code Sent",
        `A 6-digit verification code has been sent to ${phone}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send verification code. Please try again.");
    }
  };

  const handleVerifyPhone = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit verification code");
      return;
    }

    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowPhoneVerification(false);
      setVerificationCode('');
      Alert.alert(
        "Phone Verified",
        "Your phone number has been successfully verified!",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "Invalid verification code. Please try again.");
    }
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
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        timezone: selectedTimezone,
        bio: bio.trim() || undefined,
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
    showDescription = false,
    required = false
  }: any) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>
        {title} {required && <Text style={styles.required}>*</Text>}
      </Text>
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

  const TextInputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    error, 
    required = false, 
    multiline = false,
    maxLength,
    keyboardType = 'default',
    rightIcon,
    onRightIconPress
  }: any) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={[
        styles.inputContainer,
        multiline && styles.inputContainerMultiline,
        error && styles.inputContainerError
      ]}>
        <MaterialIcons name={icon} size={20} color={error ? "#dc2626" : "#8b7355"} />
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (error) {
              setErrors(prev => ({ ...prev, [label.toLowerCase().replace(' ', '')]: undefined }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#a0916d"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.rightIconButton} onPress={onRightIconPress}>
            <MaterialIcons name={rightIcon} size={20} color="#8b5a3c" />
          </TouchableOpacity>
        )}
      </View>
      {maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength} characters
        </Text>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  const TimezoneModal = () => (
    <Modal
      visible={showTimezoneModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Timezone</Text>
          <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
            <Text style={styles.modalDone}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {timezones.map((timezone) => (
            <TouchableOpacity
              key={timezone.id}
              style={[
                styles.timezoneOption,
                selectedTimezone === timezone.id && styles.timezoneOptionSelected
              ]}
              onPress={() => {
                setSelectedTimezone(timezone.id);
                setShowTimezoneModal(false);
              }}
            >
              <Text style={[
                styles.timezoneLabel,
                selectedTimezone === timezone.id && styles.timezoneLabelSelected
              ]}>
                {timezone.label}
              </Text>
              {selectedTimezone === timezone.id && (
                <MaterialIcons name="check" size={20} color="#8b5a3c" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const PhoneVerificationModal = () => (
    <Modal
      visible={showPhoneVerification}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.verificationOverlay}>
        <View style={styles.verificationModal}>
          <Text style={styles.verificationTitle}>Verify Phone Number</Text>
          <Text style={styles.verificationSubtitle}>
            Enter the 6-digit code sent to {phone}
          </Text>
          
          <TextInput
            style={styles.verificationInput}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
          
          <View style={styles.verificationButtons}>
            <TouchableOpacity 
              style={styles.verificationCancelButton}
              onPress={() => {
                setShowPhoneVerification(false);
                setVerificationCode('');
              }}
            >
              <Text style={styles.verificationCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.verificationConfirmButton}
              onPress={handleVerifyPhone}
            >
              <Text style={styles.verificationConfirmText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getSelectedTimezoneLabel = () => {
    const timezone = timezones.find(tz => tz.id === selectedTimezone);
    return timezone ? timezone.label : 'Select timezone';
  };

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
            {/* Basic Information Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInputField
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                icon="person"
                error={errors.name}
                required={true}
              />

              <OptionSelector
                title="Gender"
                options={genderOptions}
                selectedValue={selectedGender}
                onSelect={setSelectedGender}
                error={errors.gender}
              />

              <OptionSelector
                title="Age Range"
                options={ageRanges}
                selectedValue={selectedAge}
                onSelect={setSelectedAge}
                error={errors.age}
              />

              <OptionSelector
                title="Study Level"
                options={studyLevels}
                selectedValue={selectedStudyLevel}
                onSelect={setSelectedStudyLevel}
                error={errors.studyLevel}
                showDescription={true}
              />
            </View>

            {/* Contact Information Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <TextInputField
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 123-4567"
                icon="phone"
                error={errors.phone}
                keyboardType="phone-pad"
                rightIcon="verified"
                onRightIconPress={handleSendPhoneVerification}
              />

              <TextInputField
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                icon="location-on"
                error={errors.location}
                maxLength={100}
              />

              {/* Timezone Selector */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Timezone</Text>
                <TouchableOpacity 
                  style={styles.timezoneSelector}
                  onPress={() => setShowTimezoneModal(true)}
                >
                  <MaterialIcons name="schedule" size={20} color="#8b7355" />
                  <Text style={styles.timezoneSelectorText}>
                    {getSelectedTimezoneLabel()}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#8b7355" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Additional Information Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              
              <TextInputField
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us a bit about yourself, your interests, and learning goals..."
                icon="description"
                error={errors.bio}
                multiline={true}
                maxLength={500}
              />
            </View>

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
                    <Text style={styles.saveButtonText}>Saving Changes...</Text>
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

      {/* Modals */}
      <TimezoneModal />
      <PhoneVerificationModal />
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
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.2)",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a3728",
    marginBottom: 8,
  },
  required: {
    color: "#dc2626",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    minHeight: 50,
  },
  inputContainerMultiline: {
    alignItems: "flex-start",
    paddingVertical: 16,
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
  textInputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  rightIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  characterCount: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "right",
    marginTop: 4,
  },
  selectorContainer: {
    marginBottom: 20,
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
  timezoneSelector: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  timezoneSelectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4a3728",
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fefbf3",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.2)",
  },
  modalCancel: {
    fontSize: 16,
    color: "#8b7355",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  modalDone: {
    fontSize: 16,
    color: "#8b5a3c",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timezoneOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
  },
  timezoneOptionSelected: {
    backgroundColor: "rgba(139, 90, 60, 0.1)",
  },
  timezoneLabel: {
    fontSize: 14,
    color: "#4a3728",
    flex: 1,
  },
  timezoneLabelSelected: {
    fontWeight: "600",
    color: "#8b5a3c",
  },
  // Phone Verification Modal
  verificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  verificationModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    textAlign: "center",
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    marginBottom: 24,
  },
  verificationInput: {
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 4,
  },
  verificationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  verificationCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.3)",
    alignItems: "center",
  },
  verificationCancelText: {
    color: "#8b7355",
    fontSize: 16,
    fontWeight: "500",
  },
  verificationConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "#8b5a3c",
    alignItems: "center",
  },
  verificationConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});