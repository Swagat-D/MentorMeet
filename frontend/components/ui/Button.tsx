// components/ui/Button.tsx - Enhanced Button Component
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradientColors,
  testID,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8;
        baseStyle.paddingHorizontal = 16;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingVertical = 16;
        baseStyle.paddingHorizontal = 24;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = 20;
        baseStyle.minHeight = 48;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled ? '#9CA3AF' : '#667eea';
        break;
      case 'secondary':
        baseStyle.backgroundColor = disabled ? '#F3F4F6' : '#F9FAFB';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled ? '#D1D5DB' : '#E5E7EB';
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = disabled ? '#D1D5DB' : '#667eea';
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'gradient':
        // Gradient style will be handled by LinearGradient
        break;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
      default: // medium
        baseStyle.fontSize = 16;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
      case 'gradient':
        baseStyle.color = '#FFFFFF';
        break;
      case 'secondary':
        baseStyle.color = disabled ? '#9CA3AF' : '#374151';
        break;
      case 'outline':
      case 'ghost':
        baseStyle.color = disabled ? '#9CA3AF' : '#667eea';
        break;
    }

    return baseStyle;
  };

  const getDefaultGradientColors = (): [string, string, ...string[]] => {
    if (disabled) {
      return ['#9CA3AF', '#9CA3AF'];
    }
    // Ensure at least two colors are always returned
    if (gradientColors && gradientColors.length >= 2) {
      return gradientColors as [string, string, ...string[]];
    }
    return ['#667eea', '#764ba2'];
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient' ? '#FFFFFF' : '#667eea'}
          style={styles.loader}
        />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <View style={styles.iconLeft}>{icon}</View>
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {loading ? 'Loading...' : title}
      </Text>
      {!loading && icon && iconPosition === 'right' && (
        <View style={styles.iconRight}>{icon}</View>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.gradientContainer, style]}
        testID={testID}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getDefaultGradientColors()}
          style={[getButtonStyle(), { backgroundColor: 'transparent' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      testID={testID}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loader: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;