// utils/constants/index.ts - Enhanced App Constants

// Colors
export const Colors = {
  // Primary palette
  primary: {
    50: '#F0F7FF',
    100: '#E0EFFF',
    200: '#B9DCFF',
    300: '#7CC4FF',
    400: '#36A9FF',
    500: '#667eea', // Main primary
    600: '#5A6FD8',
    700: '#4C5BC0',
    800: '#3E4A9B',
    900: '#364176',
  },
  
  // Secondary palette
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#764ba2', // Main secondary
    600: '#6D4297',
    700: '#5B3485',
    800: '#4A2A6F',
    900: '#3C235A',
  },
  
  // Accent colors
  accent: {
    mint: '#4ECDC4',
    coral: '#FF6B6B',
    sunshine: '#FFD93D',
    lavender: '#A8E6CF',
    peach: '#FFB6C1',
  },
  
  // Semantic colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  
  // Neutral colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#1F2937',
    paper: '#F9FAFB',
    elevated: '#FFFFFF',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Gradients
  gradients: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#FF6B6B', '#4ECDC4'],
    sunset: ['#f093fb', '#f5576c'],
    ocean: ['#4facfe', '#00f2fe'],
    forest: ['#667eea', '#764ba2', '#f093fb'],
    cosmic: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
  },
};

// Typography
export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    // Add custom fonts here when available
    // regular: 'Inter-Regular',
    // medium: 'Inter-Medium',
    // semiBold: 'Inter-SemiBold',
    // bold: 'Inter-Bold',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
};

// Border radius
export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
};

// Layout
export const Layout = {
  // Screen dimensions (will be set dynamically)
  window: {
    width: 0,
    height: 0,
  },
  
  // Container sizes
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Header heights
  header: {
    default: 56,
    large: 64,
  },
  
  // Tab bar height
  tabBar: {
    height: 60,
  },
  
  // Safe area insets (will be set dynamically)
  safeArea: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

// Subjects/Categories
export const Subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Engineering',
  'English Literature',
  'Creative Writing',
  'History',
  'Geography',
  'Economics',
  'Business Studies',
  'Accounting',
  'Psychology',
  'Philosophy',
  'Art & Design',
  'Music',
  'Photography',
  'Foreign Languages',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Mandarin',
  'Physical Education',
  'Health & Nutrition',
  'Environmental Science',
  'Political Science',
  'Sociology',
  'Anthropology',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Digital Marketing',
  'Public Speaking',
  'Leadership',
  'Project Management',
  'Entrepreneurship',
];

// Learning Goals
export const LearningGoals = [
  'Academic Excellence',
  'Career Development',
  'Skill Enhancement',
  'Personal Growth',
  'Test Preparation',
  'College Admission',
  'Job Interview Prep',
  'Industry Certification',
  'Creative Projects',
  'Research & Development',
  'Language Fluency',
  'Technical Mastery',
  'Leadership Skills',
  'Communication Skills',
  'Problem Solving',
  'Critical Thinking',
  'Time Management',
  'Stress Management',
  'Networking',
  'Portfolio Building',
];

// App Configuration
export const AppConfig = {
  // App information
  name: 'MentorMatch',
  version: '1.0.0',
  description: 'Connecting minds, shaping futures',
  
  // API configuration
  api: {
    baseUrl: __DEV__ 
      ? 'http://localhost:3000/api' 
      : 'https://api.mentormatch.com',
    timeout: 10000,
    retryAttempts: 3,
  },
  
  // Authentication
  auth: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // File upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    allowedDocumentTypes: ['application/pdf', 'application/msword'],
  },
  
  // Session configuration
  session: {
    minDuration: 30, // minutes
    maxDuration: 180, // minutes
    defaultDuration: 60, // minutes
    bufferTime: 15, // minutes
  },
  
  // Pricing
  pricing: {
    currency: 'USD',
    minSessionPrice: 10,
    maxSessionPrice: 500,
    platformFee: 0.1, // 10%
  },
  
  // Social login providers
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
    },
    apple: {
      enabled: true,
    },
    facebook: {
      enabled: true,
      appId: process.env.FACEBOOK_APP_ID,
    },
  },
  
  // Feature flags
  features: {
    darkMode: true,
    biometricAuth: true,
    pushNotifications: true,
    videoCall: true,
    groupSessions: false, // Coming soon
    aiRecommendations: false, // Coming soon
  },
};

// Validation Rules
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character',
  },
  phone: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    message: 'Please enter a valid phone number',
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name should only contain letters and spaces',
  },
};

// Error Messages
export const ErrorMessages = {
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  unauthorized: 'Session expired. Please log in again.',
  forbidden: 'Access denied. You don\'t have permission.',
  notFound: 'Resource not found.',
  validation: 'Please check your input and try again.',
  upload: 'File upload failed. Please try again.',
  payment: 'Payment failed. Please check your payment method.',
  booking: 'Booking failed. Please try again.',
  generic: 'Something went wrong. Please try again.',
};

// Success Messages
export const SuccessMessages = {
  login: 'Welcome back!',
  register: 'Account created successfully!',
  logout: 'Logged out successfully',
  profileUpdate: 'Profile updated successfully',
  passwordReset: 'Password reset email sent',
  passwordChange: 'Password changed successfully',
  booking: 'Session booked successfully!',
  payment: 'Payment processed successfully',
  upload: 'File uploaded successfully',
  emailVerification: 'Email verified successfully',
  phoneVerification: 'Phone number verified successfully',
};

// Onboarding Steps
export const OnboardingSteps = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Welcome to MentorMatch',
    screen: 'welcome',
  },
  {
    id: 2,
    title: 'Choose Role',
    description: 'Are you a mentor or mentee?',
    screen: 'role-selection',
  },
  {
    id: 3,
    title: 'Interests',
    description: 'What are you interested in?',
    screen: 'interests',
  },
  {
    id: 4,
    title: 'Goals',
    description: 'What are your learning goals?',
    screen: 'goals',
  },
  {
    id: 5,
    title: 'Complete',
    description: 'You\'re all set!',
    screen: 'complete',
  },
];

// Notification Types
export const NotificationTypes = {
  SESSION_REMINDER: 'session_reminder',
  SESSION_CANCELLED: 'session_cancelled',
  NEW_MESSAGE: 'new_message',
  BOOKING_CONFIRMED: 'booking_confirmed',
  PAYMENT_SUCCESS: 'payment_success',
  PROFILE_UPDATE: 'profile_update',
  SYSTEM_UPDATE: 'system_update',
} as const;

// Animation Durations
export const AnimationDurations = {
  fast: 200,
  normal: 300,
  slow: 500,
  splash: 3000,
  onboarding: 800,
} as const;

// Storage Keys
export const StorageKeys = {
  AUTH_TOKEN: '@mentormatch/auth_token',
  REFRESH_TOKEN: '@mentormatch/refresh_token',
  USER_DATA: '@mentormatch/user_data',
  ONBOARDING_COMPLETE: '@mentormatch/onboarding_complete',
  THEME_PREFERENCE: '@mentormatch/theme_preference',
  LANGUAGE_PREFERENCE: '@mentormatch/language_preference',
  BIOMETRIC_ENABLED: '@mentormatch/biometric_enabled',
  PUSH_TOKEN: '@mentormatch/push_token',
} as const;

// Default Values
export const DefaultValues = {
  user: {
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    role: 'mentee' as const,
    interests: [],
    goals: [],
  },
  session: {
    duration: 60,
    price: 50,
    currency: 'USD',
  },
  pagination: {
    page: 1,
    limit: 20,
  },
} as const;