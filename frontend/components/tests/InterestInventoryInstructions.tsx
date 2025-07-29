// frontend/components/tests/InterestInventoryInstructions.tsx - Professional Instructions
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Props {
  onBeginTest: () => void;
  onBack: () => void;
}

export default function InterestInventoryInstructions({ onBeginTest, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Interest Inventory</Text>
          <Text style={styles.headerSubtitle}>54 questions • 10-12 minutes</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Main Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="psychology" size={32} color="#8b5a3c" />
          </View>
          
          <Text style={styles.title}>Career Interest Assessment</Text>
          <Text style={styles.description}>
            Discover your career personality type through Holland's RIASEC framework. 
            Answer honestly based on your interests, not your skills.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Read each statement carefully</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Choose YES if it interests you, NO if it doesn't</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Continue through all 54 questions</Text>
            </View>
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleCard}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          <Text style={styles.sampleQuestion}>Build kitchen cabinets</Text>
          
          <View style={styles.sampleAnswers}>
            <View style={styles.sampleAnswer}>
              <MaterialIcons name="thumb-up" size={16} color="#059669" />
              <Text style={styles.sampleText}>YES - This interests me</Text>
            </View>
            <View style={styles.sampleAnswer}>
              <MaterialIcons name="thumb-down" size={16} color="#DC2626" />
              <Text style={styles.sampleText}>NO - This doesn't interest me</Text>
            </View>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#8b5a3c', '#a0916d']} style={styles.beginButtonGradient}>
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
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
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
    backgroundColor: '#8b5a3c',
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
  sampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 12,
  },
  sampleQuestion: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4a3728',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 90, 60, 0.05)',
    borderRadius: 8,
  },
  sampleAnswers: {
    gap: 8,
  },
  sampleAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  sampleText: {
    fontSize: 14,
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