// app/profile/edit.tsx - Fixed Edit Profile Screen with Better UX
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);
  
  // Form state - Initialize with user data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
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

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  // Optimized input handler to prevent keyboard issues
  const updateFormData = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Bio validation (optional but if provided, check length)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio cannot exceed 500 characters";
      isValid = false;
    }

    // Location validation (optional but if provided, check length)
    if (formData.location && formData.location.length > 100) {
      newErrors.location = "Location cannot exceed 100 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendPhoneVerification = async () => {
    if (!formData.phone) {
      Alert.alert("Error", "Please enter a phone number first");
      return;
    }

    try {
      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowPhoneVerification(true);
      Alert.alert(
        "Verification Code Sent",
        `A 6-digit verification code has been sent to ${formData.phone}`,
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
      setIsPhoneVerified(true);
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
      // Only send non-empty values
      const updateData: any = {
        name: formData.name.trim(),
      };

      if (formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.location.trim()) updateData.location = formData.location.trim();
      if (formData.bio.trim()) updateData.bio = formData.bio.trim();
      if (formData.avatar) updateData.avatar = formData.avatar;

      await updateProfile(updateData);

      Alert.alert(
        "Profile Updated",
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

  const handleEditPersonalInfo = () => {
    router.push("/profile/personal-info");
  };

  const handleChangeAvatar = () => {
    setShowChangeAvatar(true);
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    updateFormData('avatar', avatarUrl);
    setShowChangeAvatar(false);
  };

  const avatarOptions = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=8b5a3c&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=d97706&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=059669&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=7c3aed&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=dc2626&color=fff&size=200`,
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0891b2&color=fff&size=200`,
  ];

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    icon, 
    error, 
    multiline = false,
    maxLength,
    keyboardType = 'default',
    rightAction,
    rightActionText,
    onRightAction,
    verified = false,
    editable = true
  }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputContainer,
        multiline && styles.inputContainerMultiline,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled
      ]}>
        <View style={styles.inputIconContainer}>
          <MaterialIcons name={icon} size={20} color={error ? "#dc2626" : "#8b7355"} />
        </View>
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a0916d"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable}
          autoCorrect={false}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        />
        {verified && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={16} color="#059669" />
          </View>
        )}
        {rightAction && (
          <TouchableOpacity style={styles.inputRightAction} onPress={onRightAction}>
            <Text style={styles.inputRightActionText}>{rightActionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      {maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
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

  const PhoneVerificationModal = () => (
    <Modal
      visible={showPhoneVerification}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.verificationModal, { transform: [{ scale: fadeAnim }] }]}>
          <View style={styles.modalHeader}>
            <MaterialIcons name="sms" size={24} color="#8b5a3c" />
            <Text style={styles.modalTitle}>Verify Phone Number</Text>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Enter the 6-digit code sent to {formData.phone}
          </Text>
          
          <TextInput
            style={styles.otpInput}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowPhoneVerification(false);
                setVerificationCode('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalConfirmButton}
              onPress={handleVerifyPhone}
            >
              <LinearGradient
                colors={['#8b5a3c', '#d97706']}
                style={styles.modalConfirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalConfirmText}>Verify</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const AvatarModal = () => (
    <Modal
      visible={showChangeAvatar}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.avatarModalContainer}>
        <View style={styles.avatarModalHeader}>
          <Text style={styles.avatarModalTitle}>Choose Avatar</Text>
          <TouchableOpacity onPress={() => setShowChangeAvatar(false)}>
            <MaterialIcons name="close" size={24} color="#4a3728" />
          </TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={styles.avatarGrid}>
          {avatarOptions.map((avatarUrl, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarOption,
                formData.avatar === avatarUrl && styles.avatarOptionSelected
              ]}
              onPress={() => handleSelectAvatar(avatarUrl)}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarOptionImage} />
              {formData.avatar === avatarUrl && (
                <View style={styles.avatarSelectedBadge}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.headerSave, isLoading && styles.headerSaveDisabled]}>
            {isLoading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
            {/* Profile Picture Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} onPress={handleChangeAvatar}>
                <Image
                  source={{ 
                    uri: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=8b5a3c&color=fff&size=200`
                  }}
                  style={styles.avatar}
                />
                <View style={styles.avatarEditBadge}>
                  <MaterialIcons name="camera-alt" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarChangeText}>Tap to change photo</Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <InputField
                label="Full Name"
                value={formData.name}
                onChangeText={(text: string) => updateFormData('name', text)}
                placeholder="Enter your full name"
                icon="person"
                error={errors.name}
              />

              <InputField
                label="Email"
                value={user?.email || ''}
                onChangeText={() => {}}
                placeholder="Email address"
                icon="email"
                editable={false}
                verified={user?.isEmailVerified}
              />
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <InputField
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text: string) => updateFormData('phone', text)}
                placeholder="+1 (555) 123-4567"
                icon="phone"
                error={errors.phone}
                keyboardType="phone-pad"
                rightAction={formData.phone && !isPhoneVerified}
                rightActionText="Verify"
                onRightAction={handleSendPhoneVerification}
                verified={isPhoneVerified}
              />

              <InputField
                label="Location"
                value={formData.location}
                onChangeText={(text: string) => updateFormData('location', text)}
                placeholder="City, Country"
                icon="location-on"
                error={errors.location}
                maxLength={100}
              />
            </View>

            {/* About Me */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Me</Text>
              
              <InputField
                label="Bio"
                value={formData.bio}
                onChangeText={(text: string) => updateFormData('bio', text)}
                placeholder="Tell us about yourself, your interests, and learning goals..."
                icon="description"
                error={errors.bio}
                multiline={true}
                maxLength={500}
              />
            </View>

            {/* Personal Information Card */}
            <View style={styles.personalInfoCard}>
              <View style={styles.personalInfoHeader}>
                <View style={styles.personalInfoIcon}>
                  <MaterialIcons name="person-outline" size={24} color="#8b5a3c" />
                </View>
                <View style={styles.personalInfoText}>
                  <Text style={styles.personalInfoTitle}>Personal Information</Text>
                  <Text style={styles.personalInfoSubtitle}>
                    Age, gender, study level, and learning preferences
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.personalInfoButton} onPress={handleEditPersonalInfo}>
                <Text style={styles.personalInfoButtonText}>Edit Info</Text>
                <MaterialIcons name="chevron-right" size={20} color="#8b5a3c" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <PhoneVerificationModal />
      <AvatarModal />
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
  keyboardView: {
    flex: 1,
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
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#8b5a3c",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarChangeText: {
    fontSize: 14,
    color: "#8b7355",
    fontWeight: "500",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerMultiline: {
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  inputContainerError: {
    borderColor: "#dc2626",
    backgroundColor: "rgba(220, 38, 38, 0.02)",
  },
  inputContainerDisabled: {
    backgroundColor: "#f9f9f9",
    opacity: 0.6,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#4a3728",
    paddingVertical: 0,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  inputRightAction: {
    backgroundColor: "#8b5a3c",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  inputRightActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  characterCount: {
    fontSize: 12,
    color: "#8b7355",
    textAlign: "right",
    marginTop: 4,
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
  personalInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  personalInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  personalInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  personalInfoText: {
    flex: 1,
  },
  personalInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  personalInfoSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 18,
  },
  personalInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(139, 90, 60, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.1)",
  },
  personalInfoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8b5a3c",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  verificationModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginLeft: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    textAlign: "center",
    marginBottom: 24,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.3)",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#8b7355",
    fontSize: 16,
    fontWeight: "500",
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Avatar Modal
  avatarModalContainer: {
    flex: 1,
    backgroundColor: "#fefbf3",
  },
  avatarModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.2)",
  },
  avatarModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-between",
  },
  avatarOption: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  avatarOptionSelected: {
    borderWidth: 3,
    borderColor: "#8b5a3c",
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
  },
  avatarSelectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#8b5a3c",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});