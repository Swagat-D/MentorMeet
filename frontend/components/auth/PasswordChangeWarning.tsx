// frontend/components/auth/PasswordChangeWarning.tsx - Warning Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PasswordChangeWarningProps {
  provider?: 'email' | 'google';
  onUnlinkPress?: () => void;
}

export const PasswordChangeWarning: React.FC<PasswordChangeWarningProps> = ({ 
  provider, 
  onUnlinkPress 
}) => {
  if (provider === 'email' || !provider) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="info-outline" size={20} color="#f59e0b" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Google Account</Text>
        <Text style={styles.description}>
          You signed in with Google. Password changes are not available for Google accounts.
        </Text>
        {onUnlinkPress && (
          <TouchableOpacity onPress={onUnlinkPress} style={styles.unlinkButton}>
            <Text style={styles.unlinkText}>Switch to Email Sign-in</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 8,
  },
  unlinkButton: {
    alignSelf: 'flex-start',
  },
  unlinkText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});