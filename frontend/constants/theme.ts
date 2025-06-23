// constants/theme.ts - Warm Theme Constants and Common Styles
import { StyleSheet } from 'react-native';

export const WarmColors = {
  // Background colors
  background: {
    primary: '#fefbf3',
    secondary: '#f8f6f0',
    tertiary: '#f1f0ec',
    quaternary: '#e8e6e1',
  },
  
  // Overlay colors
  overlay: {
    light: 'rgba(251, 243, 219, 0.2)',
    medium: 'rgba(254, 252, 243, 0.1)',
    dark: 'rgba(245, 238, 228, 0.15)',
  },
  
  // Text colors
  text: {
    primary: '#4a3728',
    secondary: '#5d4e37',
    tertiary: '#8b7355',
    quaternary: '#a0916d',
    muted: '#b8a082',
  },
  
  // Brand colors
  brand: {
    primary: '#8b5a3c',
    secondary: '#d97706',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  
  // Interactive colors
  interactive: {
    disabled: '#b8a082',
    border: 'rgba(184, 134, 100, 0.2)',
    borderActive: '#8b5a3c',
    borderError: '#d97706',
  },
  
  // Surface colors
  surface: {
    white: '#ffffff',
    card: 'rgba(255, 255, 255, 0.9)',
    input: 'rgba(255, 255, 255, 0.8)',
    button: 'rgba(255, 255, 255, 0.2)',
  },
};

export const WarmShadows = {
  small: {
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  medium: {
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  large: {
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  button: {
    shadowColor: '#8b5a3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const WarmSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const WarmBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
};

export const WarmFontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  massive: 42,
};

export const WarmCommonStyles = StyleSheet.create({
  // Background gradients
  primaryBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  
  // Card styles
  card: {
    backgroundColor: WarmColors.surface.card,
    borderRadius: WarmBorderRadius.xxl,
    padding: WarmSpacing.xxl,
    borderWidth: 1,
    borderColor: WarmColors.interactive.border,
    ...WarmShadows.large,
  },
  
  // Button styles
  primaryButton: {
    borderRadius: WarmBorderRadius.lg,
    overflow: "hidden",
    ...WarmShadows.button,
  },
  
  primaryButtonGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  
  primaryButtonText: {
    color: WarmColors.surface.white,
    fontSize: WarmFontSizes.lg,
    fontWeight: "600",
  },
  
  // Input styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: WarmColors.interactive.border,
    borderRadius: WarmBorderRadius.lg,
    paddingHorizontal: WarmSpacing.lg,
    height: 56,
    backgroundColor: WarmColors.surface.input,
  },
  
  inputError: {
    borderColor: WarmColors.interactive.borderError,
    backgroundColor: "rgba(217, 119, 6, 0.05)",
  },
  
  input: {
    flex: 1,
    marginLeft: WarmSpacing.md,
    fontSize: WarmFontSizes.md,
    color: WarmColors.text.primary,
  },
  
  inputLabel: {
    fontSize: WarmFontSizes.md,
    fontWeight: "600",
    color: WarmColors.text.secondary,
    marginBottom: WarmSpacing.sm,
  },
  
  // Text styles
  title: {
    fontSize: WarmFontSizes.xxxl,
    fontWeight: "bold",
    color: WarmColors.text.primary,
    textAlign: "center",
  },
  
  subtitle: {
    fontSize: WarmFontSizes.md,
    color: WarmColors.text.tertiary,
    textAlign: "center",
    lineHeight: 24,
  },
  
  // Error styles
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    padding: WarmSpacing.md,
    borderRadius: WarmBorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
  },
  
  errorText: {
    color: WarmColors.brand.warning,
    fontSize: WarmFontSizes.sm,
    marginLeft: WarmSpacing.sm,
    flex: 1,
  },
  
  fieldErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginLeft: 4,
  },
  
  fieldErrorText: {
    color: WarmColors.brand.warning,
    fontSize: WarmFontSizes.xs,
    marginLeft: 4,
  },
  
  // Logo styles
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: WarmSpacing.xxl,
    ...WarmShadows.medium,
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
  
  // Back button styles
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: WarmColors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: WarmColors.interactive.border,
    ...WarmShadows.small,
  },
});

// Gradient configurations
export const WarmGradients = {
  primary: ['#fefbf3', '#f8f6f0', '#f1f0ec'],
  overlay: ['rgba(251, 243, 219, 0.2)', 'rgba(254, 252, 243, 0.1)', 'rgba(245, 238, 228, 0.15)'],
  button: ['#8b5a3c', '#d97706'],
  buttonDisabled: ['#b8a082', '#b8a082'],
  logo: ['#ffffff', '#f8fafc'],
  success: ['#059669', '#047857'],
};

export default {
  WarmColors,
  WarmShadows,
  WarmSpacing,
  WarmBorderRadius,
  WarmFontSizes,
  WarmCommonStyles,
  WarmGradients,
};