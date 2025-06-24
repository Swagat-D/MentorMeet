// app/(auth)/verify-otp.tsx - Complete OTP Verification Screen with Backend Integration
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
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from "../../stores/authStore";

const { width } = Dimensions.get('window');

type OTPPurpose = 'email-verification' | 'password-reset';

export default function VerifyOTPScreen() {
  const { email, purpose = 'email-verification' } = useLocalSearchParams<{ 
    email: string; 
    purpose?: OTPPurpose;
  }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState<{
    otp?: string;
    general?: string;
  }>({});

  const { verifyEmail, resendOTP } = useAuthStore();

  // Refs for OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const formSlideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Auto-focus first input
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 500);

    // Start timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Pulse animation for OTP inputs
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      clearInterval(interval);
      pulseAnimation.stop();
    };
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    // Only allow numeric input
    if (value && !/^\d$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Clear errors when user starts typing
    if (errors.otp || errors.general) {
      setErrors({});
    }

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOTP.every(digit => digit !== '')) {
      handleVerifyOTP(newOTP);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpToVerify = otp) => {
    const otpString = otpToVerify.join('');
    
    if (otpString.length < 6) {
      setErrors({ otp: "Please enter the complete 6-digit code" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (purpose === 'email-verification') {
        await verifyEmail(email, otpString);
        
        // Navigate to onboarding after successful verification
        router.replace("/(onboarding)/welcome");
      } else if (purpose === 'password-reset') {
        // For password reset, navigate to reset password screen with the OTP
        router.push({
          pathname: "/(auth)/reset-password",
          params: { email, otp: otpString }
        });
      }
    } catch (error: any) {
      setErrors({ general: error.message });
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setTimer(60);
    setCanResend(false);
    setErrors({});

    try {
      await resendOTP(email);
      
      // Reset timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert("Code Sent", "A new verification code has been sent to your email");
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
      
    } catch (error: any) {
      setErrors({ general: error.message });
      setCanResend(true);
      setTimer(0);
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTitle = () => {
    return purpose === 'password-reset' ? 'Verify Reset Code' : 'Verify Your Email';
  };

  const getSubtitle = () => {
    return purpose === 'password-reset' 
      ? "We've sent a 6-digit reset code to" 
      : "We've sent a 6-digit verification code to";
  };

  const getButtonText = () => {
    if (isLoading) {
      return purpose === 'password-reset' ? 'Verifying Reset Code...' : 'Verifying...';
    }
    return purpose === 'password-reset' ? 'Verify Reset Code' : 'Verify Code';
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
        <View style={styles.content}>
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
            <Animated.View 
              style={[
                styles.logoContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons 
                  name={purpose === 'password-reset' ? "lock-reset" : "mark-email-read"} 
                  size={32} 
                  color="#5d4e37" 
                />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              {getSubtitle()}
            </Text>
            <Text style={styles.emailText}>{email}</Text>
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

            {/* OTP Input */}
            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>Enter Verification Code</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { otpRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null,
                      errors.otp ? styles.otpInputError : null
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading}
                  />
                ))}
              </View>
              {errors.otp && (
                <View style={styles.fieldErrorContainer}>
                  <MaterialIcons name="error-outline" size={14} color="#d97706" />
                  <Text style={styles.fieldErrorText}>{errors.otp}</Text>
                </View>
              )}
            </View>

            {/* Timer and Resend */}
            <View style={styles.timerSection}>
              {canResend ? (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={isResending || isLoading}
                >
                  {isResending ? (
                    <>
                      <MaterialIcons name="hourglass-empty" size={16} color="#8b5a3c" />
                      <Text style={styles.resendText}>Sending...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={16} color="#8b5a3c" />
                      <Text style={styles.resendText}>Resend Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.timerContainer}>
                  <MaterialIcons name="schedule" size={16} color="#8b7355" />
                  <Text style={styles.timerText}>
                    Resend code in {formatTimer(timer)}
                  </Text>
                </View>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.verifyButton, (isLoading || otp.some(digit => !digit)) && styles.verifyButtonDisabled]}
              onPress={() => handleVerifyOTP()}
              disabled={isLoading || otp.some(digit => !digit)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading || otp.some(digit => !digit) ? ['#b8a082', '#b8a082'] : ['#8b5a3c', '#d97706']}
                style={styles.verifyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>{getButtonText()}</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="verified" size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>{getButtonText()}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <MaterialIcons name="help-outline" size={16} color="#8b7355" />
              <Text style={styles.helpText}>
                Didn't receive the code? Check your spam folder or try resending.
                {purpose === 'email-verification' 
                  ? ' The code expires in 10 minutes.' 
                  : ' The reset code expires in 15 minutes.'
                }
              </Text>
            </View>

            {/* Back to Login */}
            <View style={styles.backToLoginContainer}>
              <Text style={styles.backToLoginText}>
                {purpose === 'password-reset' ? 'Remember your password? ' : 'Wrong email? '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                disabled={isLoading}
              >
                <Text style={styles.backToLoginLink}>
                  {purpose === 'password-reset' ? 'Sign In' : 'Sign In Again'}
                </Text>
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
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8b7355",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5d4e37",
    textAlign: "center",
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
  otpSection: {
    marginBottom: 24,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5d4e37",
    marginBottom: 16,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "rgba(184, 134, 100, 0.2)",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#4a3728",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  otpInputFilled: {
    borderColor: "#8b5a3c",
    backgroundColor: "rgba(139, 90, 60, 0.05)",
  },
  otpInputError: {
    borderColor: "#d97706",
    backgroundColor: "rgba(217, 119, 6, 0.05)",
  },
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    justifyContent: "center",
  },
  fieldErrorText: {
    color: "#d97706",
    fontSize: 12,
    marginLeft: 4,
  },
  timerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 115, 85, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: "#8b7355",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 90, 60, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 90, 60, 0.2)",
  },
  resendText: {
    color: "#8b5a3c",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  verifyButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#8b5a3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139, 115, 85, 0.08)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 115, 85, 0.15)",
  },
  helpText: {
    color: "#8b7355",
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 16,
    color: "#8b7355",
  },
  backToLoginLink: {
    fontSize: 16,
    color: "#8b5a3c",
    fontWeight: "600",
  },
});