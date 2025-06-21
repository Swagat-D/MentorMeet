// app/(auth)/login.tsx - Fixed Compact Login Screen
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login } = useAuthStore();
  
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
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      setErrors({ general: "Invalid email or password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Google Login",
      "Google login will be implemented with Google OAuth SDK",
      [{ text: "OK" }]
    );
  };

  const handleBiometricLogin = () => {
    Alert.alert(
      "Biometric Login",
      "Biometric authentication will be implemented",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* App Logo & Title */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>M</Text>
            </View>
            <Text style={styles.appName}>MentorMatch</Text>
            <Text style={styles.welcomeText}>Welcome back!</Text>
          </Animated.View>

          {/* Main Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* General Error */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#FF5A5A" />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                <MaterialIcons name="email" size={20} color={errors.email ? "#FF5A5A" : "#9CA3AF"} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
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
                <Text style={styles.fieldErrorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <MaterialIcons name="lock" size={20} color={errors.password ? "#FF5A5A" : "#9CA3AF"} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
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
                    <Ionicons name="eye-off" size={20} color="#9CA3AF" />
                  ) : (
                    <Ionicons name="eye" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.fieldErrorText}>{errors.password}</Text>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9CA3AF', '#9CA3AF'] : ['#4F46E5', '#7C3AED']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Alternative Login Options */}
            <View style={styles.alternativeSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
              >
                <Text style={styles.googleButtonText}>G</Text>
                <Text style={styles.googleButtonLabel}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Biometric Login */}
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <MaterialIcons name="fingerprint" size={20} color="#4F46E5" />
                <Text style={styles.biometricText}>Use Biometric</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "#F9FAFB",
  },
  inputError: {
    borderColor: "#FF5A5A",
    backgroundColor: "#FEF2F2",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#374151",
  },
  eyeButton: {
    padding: 4,
  },
  fieldErrorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  checkmark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  alternativeSection: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
    marginRight: 12,
  },
  googleButtonLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  biometricText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
    marginLeft: 8,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    color: "#6B7280",
  },
  signUpLink: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "600",
  },
});