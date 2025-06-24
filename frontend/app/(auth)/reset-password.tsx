// app/(auth)/reset-password.tsx - Warm Theme Reset Password Screen
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
  Alert,
  Animated,
  Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

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
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase and number";
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

    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success - in real app, call password reset API with token
      setIsSuccess(true);
      
      // Success animation
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();

      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 3000);

    } catch (error) {
      setErrors({ 
        general: "Failed to reset password. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.successContainer,
              {
                opacity: successAnim,
                transform: [{
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
              },
            ]}
          >
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.successIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="check-circle" size={60} color="#059669" />
              </LinearGradient>
            </View>
            
            <Text style={styles.successTitle}>Password Reset Successfully!</Text>
            <Text style={styles.successMessage}>
              Your password has been updated successfully. You can now sign in with your new password.
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/(auth)/login")}
            >
              <LinearGradient
                colors={['#8b5a3c', '#d97706']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>Sign In Now</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: logoScaleAnim }],
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
                <MaterialIcons name="lock-reset" size={40} color="#5d4e37" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from previously used passwords
            </Text>
            {email && (
              <Text style={styles.emailText}>
                Resetting password for: {email}
              </Text>
            )}
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
                <MaterialIcons name="error-outline" size={16} color="#d97706" />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={14} color="#059669" />
                <Text style={styles.requirementText}>At least 8 characters long</Text>
              </View>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={14} color="#059669" />
                <Text style={styles.requirementText}>Contains uppercase and lowercase letters</Text>
              </View>
              <View style={styles.requirementItem}>
                <MaterialIcons name="check-circle" size={14} color="#059669" />
                <Text style={styles.requirementText}>Contains at least one number</Text>
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <MaterialIcons name="lock" size={20} color={errors.password ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your new password"
                  placeholderTextColor="#b8a082"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoFocus={true}
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
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
                <MaterialIcons name="lock" size={20} color={errors.confirmPassword ? "#d97706" : "#a0916d"} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your new password"
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

            {/* Reset Password Button */}
            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#b8a082', '#b8a082'] : ['#8b5a3c', '#d97706']}
                style={styles.resetButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                    <Text style={styles.resetButtonText}>Updating Password...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="check" size={20} color="#fff" />
                    <Text style={styles.resetButtonText}>Update Password</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginContainer}
              onPress={() => router.replace("/(auth)/login")}
            >
              <MaterialIcons name="arrow-back" size={20} color="#8b5a3c" />
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityContainer}>
              <MaterialIcons name="security" size={16} color="#d97706" />
              <Text style={styles.securityText}>
                🔒 This link will expire in 1 hour for security purposes
              </Text>
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
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  emailText: {
    fontSize: 14,
    color: "#5d4e37",
    textAlign: "center",
    fontWeight: "500",
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
  requirementsContainer: {
    backgroundColor: "rgba(139, 115, 85, 0.08)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.15)",
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5d4e37",
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#8b7355",
    marginLeft: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5d4e37",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  inputError: {
    borderColor: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.05)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#4a3728",
  },
  eyeButton: {
    padding: 4,
  },
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 4,
  },
  fieldErrorText: {
    color: "#d97706",
    fontSize: 12,
    marginLeft: 4,
  },
  resetButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  backToLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: "#8b5a3c",
    fontWeight: "600",
    marginLeft: 8,
  },
  securityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.08)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
  },
  securityText: {
    fontSize: 12,
    color: "#d97706",
    textAlign: "center",
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  // Success screen styles
  successContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#8b7355",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(184, 134, 100, 0.1)",
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  successIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a3728",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
});