// components/ui/Input.tsx - Enhanced Input Component
import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'medium',
  required = false,
  disabled = false,
  containerStyle,
  labelStyle,
  inputStyle,
  showPasswordToggle = false,
  secureTextEntry,
  value,
  onChangeText,
  placeholder,
  ...props
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.minHeight = 40;
        baseStyle.paddingHorizontal = 12;
        break;
      case 'large':
        baseStyle.minHeight = 56;
        baseStyle.paddingHorizontal = 16;
        break;
      default: // medium
        baseStyle.minHeight = 48;
        baseStyle.paddingHorizontal = 14;
        break;
    }

    // Variant styles
    switch (variant) {
      case 'filled':
        baseStyle.backgroundColor = disabled ? '#F3F4F6' : '#F9FAFB';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = 'transparent';
        break;
      case 'outlined':
        baseStyle.backgroundColor = disabled ? '#F9FAFB' : '#FFFFFF';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = disabled ? '#E5E7EB' : isFocused ? '#667eea' : '#E5E7EB';
        break;
      default: // default
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderBottomWidth = 2;
        baseStyle.borderBottomColor = disabled ? '#E5E7EB' : isFocused ? '#667eea' : '#E5E7EB';
        break;
    }

    // Error state
    if (error) {
      if (variant === 'default') {
        baseStyle.borderBottomColor = '#EF4444';
      } else {
        baseStyle.borderColor = '#EF4444';
        baseStyle.backgroundColor = '#FEF2F2';
      }
    }

    // Success state
    if (success && !error) {
      if (variant === 'default') {
        baseStyle.borderBottomColor = '#10B981';
      } else {
        baseStyle.borderColor = '#10B981';
        baseStyle.backgroundColor = '#F0FDF4';
      }
    }

    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: disabled ? '#9CA3AF' : '#374151',
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

    if (leftIcon) {
      baseStyle.marginLeft = 12;
    }

    if (rightIcon || showPasswordToggle) {
      baseStyle.marginRight = 12;
    }

    return baseStyle;
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    };

    if (error) {
      baseStyle.color = '#EF4444';
    } else if (success) {
      baseStyle.color = '#10B981';
    }

    return baseStyle;
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const renderPasswordToggle = () => {
    if (!showPasswordToggle) return null;

    return (
      <TouchableOpacity
        onPress={togglePasswordVisibility}
        style={styles.passwordToggle}
        disabled={disabled}
      >
        {isPasswordVisible ? (
          <Ionicons name='eye-off' size={20} color={disabled ? '#9CA3AF' : '#6B7280'} />
        ) : (
          <Ionicons name='eye' size={20} color={disabled ? '#9CA3AF' : '#6B7280'} />
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = () => {
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <MaterialIcons name='error-outline' size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (success) {
      return (
        <Text style={styles.successText}>{success}</Text>
      );
    }

    if (hint) {
      return (
        <Text style={styles.hintText}>{hint}</Text>
      );
    }

    return null;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}
        
        <TextInput
          ref={ref}
          style={[getInputStyle(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={disabled ? '#D1D5DB' : '#9CA3AF'}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {showPasswordToggle && renderPasswordToggle()}
        {!showPasswordToggle && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {renderMessage()}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  passwordToggle: {
    padding: 4,
    marginLeft: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 6,
    flex: 1,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  required: {
    color: '#EF4444',
  },
});

export default Input;