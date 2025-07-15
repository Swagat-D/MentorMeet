// frontend/components/tests/EmployabilityInstructions.tsx - Employability Instructions
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { stepsInfo } from '@/data/employabilityQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface Props {
  onBeginTest: () => void;
  onBack: () => void;
}

export default function EmployabilityInstructions({ onBeginTest, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Responsive Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Employability Test</Text>
          <Text style={styles.headerSubtitle}>STEPS Framework Assessment</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.instructionsContent}>
        {/* Responsive Hero Section */}
        <LinearGradient colors={['#059669', '#10B981']} style={styles.instructionsHero}>
          <MaterialIcons name="work" size={isTablet ? 80 : 60} color="#FFFFFF" />
          <Text style={styles.instructionsTitle}>STEPS Assessment</Text>
          <Text style={styles.instructionsSubtitle}>
            Evaluate your job readiness across key employability dimensions
          </Text>
        </LinearGradient>

        {/* Responsive Instructions Card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>Assessment Guidelines</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="self-improvement" size={24} color="#059669" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Rate Yourself Honestly</Text>
                <Text style={styles.instructionText}>
                  Think about what others say about you and rate yourself on a scale of 1-5 (1 = Poor, 5 = Excellent)
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Use the Hints</Text>
                <Text style={styles.instructionText}>
                  Each question has helpful hints to guide your self-reflection and ensure accurate assessment
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="psychology" size={24} color="#7C3AED" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Think About Feedback</Text>
                <Text style={styles.instructionText}>
                  Consider what colleagues, friends, and family have said about your skills and behaviors
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="trending-up" size={24} color="#DC2626" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Focus on Growth</Text>
                <Text style={styles.instructionText}>
                  Use results to identify strengths and areas for improvement in your professional development
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Responsive Test Details */}
        <View style={styles.testDetails}>
          <Text style={styles.detailsTitle}>Test Overview</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <MaterialIcons name="quiz" size={20} color="#059669" />
              <Text style={styles.detailText}>25 Questions</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="#059669" />
              <Text style={styles.detailText}>8-10 Minutes</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="star" size={20} color="#059669" />
              <Text style={styles.detailText}>1-5 Rating Scale</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="insights" size={20} color="#059669" />
              <Text style={styles.detailText}>Employability Score</Text>
            </View>
          </View>
        </View>

        {/* Rating Scale Guide */}
        <View style={styles.ratingGuide}>
          <Text style={styles.ratingTitle}>Rating Scale Guide</Text>
          <View style={styles.ratingItems}>
            {[
              { score: 5, label: 'Excellent', desc: 'I excel in this area', color: '#10B981' },
              { score: 4, label: 'Good', desc: 'I perform well in this area', color: '#59C875' },
              { score: 3, label: 'Average', desc: 'I have moderate skills in this area', color: '#F59E0B' },
              { score: 2, label: 'Below Average', desc: 'I need improvement in this area', color: '#FB923C' },
              { score: 1, label: 'Poor', desc: 'I struggle significantly in this area', color: '#EF4444' },
            ].map((rating, index) => (
              <View key={index} style={styles.ratingItem}>
                <View style={[styles.ratingScore, { backgroundColor: rating.color }]}>
                  <Text style={styles.ratingScoreText}>{rating.score}</Text>
                </View>
                <View style={styles.ratingContent}>
                  <Text style={styles.ratingLabel}>{rating.label}</Text>
                  <Text style={styles.ratingDesc}>{rating.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Responsive STEPS Framework Info */}
        <View style={styles.stepsInfo}>
          <Text style={styles.stepsTitle}>The STEPS Framework</Text>
          <Text style={styles.stepsDescription}>
            STEPS measures five key dimensions of employability skills essential for career success:
          </Text>
          <View style={styles.stepsCategories}>
            {stepsInfo.map((category, index) => (
              <View key={index} style={styles.stepsCategory}>
                <View style={[styles.stepsCategoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.stepsCategoryLetter}>{category.category}</Text>
                </View>
                <View style={styles.stepsCategoryContent}>
                  <Text style={styles.stepsCategoryName}>{category.name}</Text>
                  <Text style={styles.stepsCategoryDesc}>{category.description}</Text>
                  <Text style={styles.stepsCategoryImportance}>{category.importance}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleSection}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          <View style={styles.sampleCard}>
            <Text style={styles.sampleQuestion}>How good are you in managing your time?</Text>
            <Text style={styles.sampleHint}>
              <Text style={styles.hintLabel}>Hint: </Text>
              Think what others say about your Punctuality, Multi-tasking skills and ability to prioritize tasks when you have multiple things to do
            </Text>
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
                  ]}>{score}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Responsive Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#059669', '#10B981']} style={styles.beginButtonGradient}>
            <Text style={styles.beginButtonText}>Begin Assessment</Text>
            <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  
  // Responsive Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: isTablet ? 20 : 20,
    paddingBottom: isTablet ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    minHeight: isTablet ? 85 : 75,
  },
  backButton: {
    padding: isTablet ? 12 : 8,
    marginRight: isTablet ? 16 : 12,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
  },
  
  scrollView: {
    flex: 1,
  },
  instructionsContent: {
    padding: isTablet ? 32 : 20,
  },
  
  // Responsive Hero Section
  instructionsHero: {
    alignItems: 'center',
    padding: isTablet ? 40 : 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: isTablet ? 32 : isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#E8DDD1',
    textAlign: 'center',
  },
  
  // Instructions Card
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 28 : 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  cardTitle: {
    fontSize: isTablet ? 24 : 22,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
  },
  instructionsList: {
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    width: isTablet ? 52 : 48,
    height: isTablet ? 52 : 48,
    borderRadius: isTablet ? 26 : 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
  },
  
  // Test Details
  testDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  detailsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: isTablet ? (width - 120) / 2 : (width - 80) / 2,
  },
  detailText: {
    fontSize: isTablet ? 16 : 14,
    color: '#2A2A2A',
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Rating Guide
  ratingGuide: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  ratingTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  ratingItems: {
    gap: 12,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    width: isTablet ? 36 : 32,
    height: isTablet ? 36 : 32,
    borderRadius: isTablet ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingScoreText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratingContent: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  ratingDesc: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    marginTop: 2,
  },
  
  // STEPS Info
  stepsInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  stepsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  stepsDescription: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 20,
  },
  stepsCategories: {
    gap: 16,
  },
  stepsCategory: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepsCategoryIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepsCategoryLetter: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepsCategoryContent: {
    flex: 1,
  },
  stepsCategoryName: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  stepsCategoryDesc: {
    fontSize: isTablet ? 15 : 13,
    color: '#8B7355',
    marginBottom: 6,
    lineHeight: isTablet ? 20 : 18,
  },
  stepsCategoryImportance: {
    fontSize: isTablet ? 13 : 11,
    color: '#059669',
    fontStyle: 'italic',
    lineHeight: isTablet ? 18 : 16,
  },
  
  // Sample Section
  sampleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  sampleTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  sampleCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sampleQuestion: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  sampleHint: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    lineHeight: isTablet ? 20 : 18,
    marginBottom: 16,
  },
  hintLabel: {
    fontWeight: 'bold',
    color: '#059669',
  },
  sampleRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sampleRatingButton: {
    flex: 1,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1FAE5',
    alignItems: 'center',
  },
  sampleRatingSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  sampleRatingText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#8B7355',
  },
  sampleRatingTextSelected: {
    color: '#FFFFFF',
  },
  
  // Begin Button
  beginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  beginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  beginButtonText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});