// app/support/contact.tsx - Contact Support Page
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

const issueCategories = [
  { id: 'technical', label: 'Technical Issue', icon: 'bug-report', color: '#dc2626' },
  { id: 'account', label: 'Account Problem', icon: 'account-circle', color: '#8b5a3c' },
  { id: 'billing', label: 'Billing & Payments', icon: 'payment', color: '#059669' },
  { id: 'mentor', label: 'Mentor Related', icon: 'person', color: '#d97706' },
  { id: 'session', label: 'Session Issues', icon: 'video-call', color: '#7c3aed' },
  { id: 'other', label: 'Other', icon: 'help-outline', color: '#6b7280' },
];

const priorityLevels = [
  { id: 'low', label: 'Low', description: 'General questions', color: '#059669' },
  { id: 'medium', label: 'Medium', description: 'Issues affecting experience', color: '#d97706' },
  { id: 'high', label: 'High', description: 'Urgent issues', color: '#dc2626' },
];

export default function ContactSupportScreen() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  
  const [errors, setErrors] = useState<{
    category?: string;
    subject?: string;
    description?: string;
    email?: string;
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

    if (!selectedCategory) {
      newErrors.category = "Please select an issue category";
      isValid = false;
    }

    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
      isValid = false;
    } else if (subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 20) {
      newErrors.description = "Please provide more details (at least 20 characters)";
      isValid = false;
    }

    if (!contactEmail.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to submit support ticket
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate ticket ID
      const ticketId = 'MM-' + Math.random().toString(36).substr(2, 8).toUpperCase();
      
      Alert.alert(
        "Support Ticket Submitted",
        `Your support ticket has been submitted successfully!\n\nTicket ID: ${ticketId}\n\nOur support team will respond within 24 hours. You'll receive updates via email.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit support ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const CategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>
        Issue Category <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.categoryGrid}>
        {issueCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.categoryCardSelected,
              errors.category && styles.categoryCardError,
            ]}
            onPress={() => {
              setSelectedCategory(category.id);
              if (errors.category) {
                setErrors(prev => ({ ...prev, category: undefined }));
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[
              styles.categoryIcon,
              { backgroundColor: category.color + '15' },
              selectedCategory === category.id && { backgroundColor: category.color }
            ]}>
              <MaterialIcons 
                name={category.icon as any} 
                size={20} 
                color={selectedCategory === category.id ? '#fff' : category.color} 
              />
            </View>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === category.id && styles.categoryLabelSelected,
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color="#dc2626" />
          <Text style={styles.errorText}>{errors.category}</Text>
        </View>
      )}
    </View>
  );

  const PrioritySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Priority Level</Text>
      <View style={styles.priorityOptions}>
        {priorityLevels.map((priority) => (
          <TouchableOpacity
            key={priority.id}
            style={[
              styles.priorityOption,
              selectedPriority === priority.id && styles.priorityOptionSelected,
            ]}
            onPress={() => setSelectedPriority(priority.id)}
            activeOpacity={0.8}
          >
            <View style={styles.priorityRadio}>
              {selectedPriority === priority.id && (
                <View style={[styles.priorityRadioInner, { backgroundColor: priority.color }]} />
              )}
            </View>
            <View style={styles.priorityContent}>
              <Text style={[
                styles.priorityLabel,
                selectedPriority === priority.id && { color: priority.color, fontWeight: '600' }
              ]}>
                {priority.label}
              </Text>
              <Text style={styles.priorityDescription}>{priority.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
    keyboardType = 'default'
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
              const fieldName = label.toLowerCase().replace(' ', '');
              setErrors(prev => ({ ...prev, [fieldName]: undefined }));
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#a0916d"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 6 : 1}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
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
        <Text style={styles.headerTitle}>Contact Support</Text>
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
            {/* Info Header */}
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="support-agent" size={24} color="#8b5a3c" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Get Help from Our Team</Text>
                <Text style={styles.infoSubtitle}>
                  Describe your issue and we'll get back to you within 24 hours
                </Text>
              </View>
            </View>

            {/* Category Selection */}
            <CategorySelector />

            {/* Priority Selection */}
            <PrioritySelector />

            {/* Contact Email */}
            <TextInputField
              label="Contact Email"
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="your.email@example.com"
              icon="email"
              error={errors.email}
              required={true}
              keyboardType="email-address"
            />

            {/* Subject */}
            <TextInputField
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              icon="subject"
              error={errors.subject}
              required={true}
              maxLength={100}
            />

            {/* Description */}
            <TextInputField
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide detailed information about your issue, including any error messages, steps to reproduce, or relevant context..."
              icon="description"
              error={errors.description}
              required={true}
              multiline={true}
              maxLength={1000}
            />

            {/* Support Tips */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <MaterialIcons name="lightbulb" size={16} color="#d97706" />
                <Text style={styles.tipsTitle}>Tips for Better Support</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Include specific error messages if any</Text>
                <Text style={styles.tipItem}>• Mention which device/browser you're using</Text>
                <Text style={styles.tipItem}>• Describe steps to reproduce the issue</Text>
                <Text style={styles.tipItem}>• Attach screenshots if helpful</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#a0916d', '#a0916d'] : ['#8b5a3c', '#d97706']}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submitting Ticket...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Support Ticket</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Alternative Contact Methods */}
            <View style={styles.alternativeContact}>
              <Text style={styles.alternativeTitle}>Need immediate help?</Text>
              <View style={styles.alternativeOptions}>
                <TouchableOpacity style={styles.alternativeOption}>
                  <MaterialIcons name="chat" size={16} color="#8b5a3c" />
                  <Text style={styles.alternativeText}>Live Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.alternativeOption}>
                  <MaterialIcons name="phone" size={16} color="#8b5a3c" />
                  <Text style={styles.alternativeText}>Call Support</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(184, 134, 100, 0.1)",
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#8b7355",
    lineHeight: 20,
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
  required: {
    color: "#dc2626",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    alignItems: "center",
  },
  categoryCardSelected: {
    borderColor: "#8b5a3c",
    backgroundColor: "rgba(139, 90, 60, 0.05)",
  },
  categoryCardError: {
    borderColor: "#dc2626",
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a3728",
    textAlign: "center",
  },
  categoryLabelSelected: {
    color: "#8b5a3c",
  },
  priorityOptions: {
    gap: 8,
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  priorityOptionSelected: {
    borderColor: "#8b5a3c",
    backgroundColor: "rgba(139, 90, 60, 0.05)",
  },
  priorityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  priorityRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityContent: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4a3728",
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 12,
    color: "#8b7355",
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
    minHeight: 120,
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
  tipsContainer: {
    backgroundColor: "rgba(217, 119, 6, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.1)",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d97706",
    marginLeft: 6,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 12,
    color: "#8b7355",
    lineHeight: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  alternativeContact: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(184, 134, 100, 0.1)",
  },
  alternativeTitle: {
    fontSize: 14,
    color: "#8b7355",
    marginBottom: 12,
  },
  alternativeOptions: {
    flexDirection: "row",
    gap: 16,
  },
  alternativeOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  alternativeText: {
    fontSize: 12,
    color: "#8b5a3c",
    fontWeight: "500",
    marginLeft: 4,
  },
});