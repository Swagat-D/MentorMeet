// app/(auth)/register.tsx - Professional Sign-Up Screen with Warm Theme
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    general?: string;
  }>({});

  const { register } = useAuthStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;

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
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 700,
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
      newErrors.name = "Full name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = "Please agree to terms and conditions";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }

  setIsLoading(true);
  setErrors({});

  try {
    await register({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'mentee',
    });
    
    // Navigate to OTP verification screen instead of onboarding
    router.push({
      pathname: "/(auth)/verify-otp",
      params: { 
        email: email.toLowerCase().trim(),
        purpose: 'email-verification'
      }
    });
  } catch (error: any) {
    setErrors({ 
      general: error.message || "Registration failed. Please try again." 
    });
  } finally {
    setIsLoading(false);
  }
};

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScaleAnim }
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoText}>M</Text>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Join MentorMatch</Text>
            <Text style={styles.welcomeText}>Start your learning journey today</Text>
          </Animated.View>

          {/* Main Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlideAnim }],
              },
            ]}
          >
            {/* General Error */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#d97706" />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputContainer, errors.name ? styles.inputError : null]}>
                <MaterialIcons name="person" size={20} color={errors.name ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#b8a082"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {errors.name && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.name}</Text>
                </View>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                <MaterialIcons name="email" size={20} color={errors.email ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#b8a082"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.email}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <MaterialIcons name="lock" size={20} color={errors.password ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#b8a082"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <Ionicons name="eye-off" size={20} color="#a0916d" />
                  ) : (
                    <Ionicons name="eye" size={20} color="#a0916d" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.password}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
                <MaterialIcons name="lock" size={20} color={errors.confirmPassword ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#b8a082"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <Ionicons name="eye-off" size={20} color="#a0916d" />
                  ) : (
                    <Ionicons name="eye" size={20} color="#a0916d" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.confirmPassword}</Text>
                </View>
              )}
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => {
                  setAgreeToTerms(!agreeToTerms);
                  if (errors.terms) {
                    setErrors(prev => ({ ...prev, terms: undefined }));
                  }
                }}
              >
                <View style={[styles.checkboxBox, agreeToTerms && styles.checkboxChecked]}>
                  {agreeToTerms && <MaterialIcons name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {" "}and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.terms}</Text>
                </View>
              )}
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#b8a082', '#b8a082'] : ['#8b5a3c', '#d97706']}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <Text style={styles.registerButtonText}>Creating Account...</Text>
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Create Account</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up */}
            <GoogleSignInButton
  mode="signup"
  style={{ marginBottom: 20 }}
  onSuccess={(isNewUser) => {
    // Navigation is handled inside the component now
  }}
  onError={(error) => {
    setErrors({ general: error });
  }}
  disabled={isLoading}
/>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
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
  backgroundOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 16,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5d4e37',
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 6,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 15,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
  },
  errorText: {
    color: "#d97706",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5d4e37",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  inputError: {
    borderColor: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.05)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#4a3728",
  },
  eyeButton: {
    padding: 4,
  },
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 4,
  },
  fieldErrorText: {
    color: "#d97706",
    fontSize: 11,
    marginLeft: 4,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsCheckbox: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.4)",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  checkboxChecked: {
    backgroundColor: "#8b5a3c",
    borderColor: "#8b5a3c",
  },
  termsText: {
    fontSize: 14,
    color: "#6b5b47",
    lineHeight: 20,
    flex: 1,
  },
  termsLink: {
    color: "#8b5a3c",
    fontWeight: "600",
  },
  registerButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(184, 134, 100, 0.2)",
  },
  dividerText: {
    fontSize: 13,
    color: "#a0916d",
    marginHorizontal: 16,
    fontWeight: "500",
  },
  googleButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  googleButtonGradient: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.2)",
  },
  googleIconContainer: {
    marginRight: 12,
  },
  googleG: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4285f4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleGText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
  googleButtonText: {
    fontSize: 15,
    color: "#4a3728",
    fontWeight: "600",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 15,
    color: "#8b7355",
  },
  signInLink: {
    fontSize: 15,
    color: "#8b5a3c",
    fontWeight: "600",
  },
});