// frontend/components/tests/EmployabilityInstructions.tsx - Professional Instructions
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onBeginTest: () => void;
  onBack: () => void;
}

export default function EmployabilityInstructions({ onBeginTest, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Employability Assessment</Text>
          <Text style={styles.headerSubtitle}>25 questions • 8-10 minutes</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Main Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="work" size={32} color="#059669" />
          </View>
          
          <Text style={styles.title}>Job Readiness Assessment</Text>
          <Text style={styles.description}>
            Evaluate your employability skills across the STEPS framework to determine your job readiness.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Rate yourself honestly on each skill</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Use the 1-5 scale (1=Poor, 5=Excellent)</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Consider feedback from others</Text>
            </View>
          </View>
        </View>

        {/* STEPS Framework */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>STEPS Framework</Text>
          <View style={styles.stepsGrid}>
            {[
              { letter: 'S', name: 'Self Management', color: '#8B4513' },
              { letter: 'T', name: 'Team Work', color: '#059669' },
              { letter: 'E', name: 'Enterprising', color: '#F59E0B' },
              { letter: 'P', name: 'Problem Solving', color: '#7C3AED' },
              { letter: 'Sp', name: 'Speaking & Listening', color: '#DC2626' },
            ].map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                  <Text style={styles.stepLetter}>{step.letter}</Text>
                </View>
                <Text style={styles.stepName}>{step.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rating Scale */}
        <View style={styles.scaleCard}>
          <Text style={styles.scaleTitle}>Rating Scale</Text>
          <View style={styles.scaleItems}>
            {[
              { score: 5, label: 'Excellent', color: '#059669' },
              { score: 4, label: 'Good', color: '#10B981' },
              { score: 3, label: 'Average', color: '#F59E0B' },
              { score: 2, label: 'Below Average', color: '#FB923C' },
              { score: 1, label: 'Poor', color: '#EF4444' },
            ].map((item, index) => (
              <View key={index} style={styles.scaleItem}>
                <View style={[styles.scaleNumber, { backgroundColor: item.color }]}>
                  <Text style={styles.scaleNumberText}>{item.score}</Text>
                </View>
                <Text style={styles.scaleLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleCard}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          <Text style={styles.sampleQuestion}>How good are you at managing your time?</Text>
          
          <View style={styles.sampleRating}>
            {[1, 2, 3, 4, 5].map((score) => (
              <TouchableOpacity
                key={score}
                style={[
                  styles.sampleRatingButton,
                  score === 4 && styles.sampleRatingSelected
                ]}
              >
                <Text style={[
                  styles.sampleRatingText,
                  score === 4 && styles.sampleRatingTextSelected
                ]}>
                  {score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#059669', '#10B981']} style={styles.beginButtonGradient}>
            <Text style={styles.beginButtonText}>Start Assessment</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 45,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
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
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
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
    backgroundColor: '#059669',
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
  stepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsGrid: {
    gap: 12,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepLetter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a3728',
  },
  scaleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  scaleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
    textAlign: 'center',
  },
  scaleItems: {
    gap: 8,
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scaleNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scaleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a3728',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#4a3728',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 90, 60, 0.05)',
    borderRadius: 8,
  },
  sampleRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sampleRatingButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
    alignItems: 'center',
  },
  sampleRatingSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  sampleRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  sampleRatingTextSelected: {
    color: '#FFFFFF',
  },
  beginButton: {
    borderRadius: 12,
    overflow: 'hidden',
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