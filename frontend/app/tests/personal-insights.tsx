import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function PersonalInsightsInstructions() {
  const [showInstructions, setShowInstructions] = useState(true);

  // Move navigation logic to useEffect to avoid rendering during render
  useEffect(() => {
    if (!showInstructions) {
      // Navigate after the current render cycle completes
      // Use push instead of replace to ensure navigation happens
      router.push('/tests/personal-insights');
    }
  }, [showInstructions]);

  // Only render the instructions when showInstructions is true
  if (!showInstructions) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Insights</Text>
          <Text style={styles.headerSubtitle}>5 questions • 3-5 minutes</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person" size={32} color="#DC2626" />
          </View>
          
          <Text style={styles.title}>Share Your Story</Text>
          <Text style={styles.description}>
            Complete your assessment by sharing personal insights about your interests, strengths, and values.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Answer open-ended questions about yourself</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Select your character strengths and values</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Complete your comprehensive profile</Text>
            </View>
          </View>
        </View>

        {/* What You'll Share */}
        <View style={styles.topicsCard}>
          <Text style={styles.topicsTitle}>What You'll Share</Text>
          <View style={styles.topicsList}>
            <View style={styles.topicItem}>
              <MaterialIcons name="favorite" size={20} color="#DC2626" />
              <Text style={styles.topicText}>What you enjoy doing</Text>
            </View>
            <View style={styles.topicItem}>
              <MaterialIcons name="star" size={20} color="#DC2626" />
              <Text style={styles.topicText}>Your natural strengths</Text>
            </View>
            <View style={styles.topicItem}>
              <MaterialIcons name="build" size={20} color="#DC2626" />
              <Text style={styles.topicText}>Recent projects or achievements</Text>
            </View>
            <View style={styles.topicItem}>
              <MaterialIcons name="psychology" size={20} color="#DC2626" />
              <Text style={styles.topicText}>Character strengths and life values</Text>
            </View>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity 
          style={styles.beginButton} 
          onPress={() => setShowInstructions(false)}
        >
          <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.beginButtonGradient}>
            <Text style={styles.beginButtonText}>Start Assessment</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 100, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b7355',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  stepsList: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#4a3728',
    lineHeight: 22,
  },
  topicsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  topicsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
    textAlign: 'center',
  },
  topicsList: {
    gap: 12,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderRadius: 8,
    gap: 12,
  },
  topicText: {
    fontSize: 15,
    color: '#4a3728',
    fontWeight: '500',
  },
  beginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 24,
  },
  beginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  beginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});