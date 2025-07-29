// frontend/components/tests/BrainProfileInstructions.tsx - Professional Instructions
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

export default function BrainProfileInstructions({ onBeginTest, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Brain Profile</Text>
          <Text style={styles.headerSubtitle}>10 questions • 5-7 minutes</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Main Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="memory" size={32} color="#7C3AED" />
          </View>
          
          <Text style={styles.title}>Thinking Style Assessment</Text>
          <Text style={styles.description}>
            Discover your dominant brain quadrants and how you prefer to process information.
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Rank 4 statements from most like you (4) to least like you (1)</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Drag statements to reorder them</Text>
            </View>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Complete all 10 question sets</Text>
            </View>
          </View>
        </View>

        {/* Brain Quadrants Preview */}
        <View style={styles.quadrantsCard}>
          <Text style={styles.quadrantsTitle}>Four Thinking Styles</Text>
          <View style={styles.quadrantsGrid}>
            <View style={styles.quadrantItem}>
              <View style={[styles.quadrantIcon, { backgroundColor: '#8B4513' }]}>
                <Text style={styles.quadrantLetter}>L1</Text>
              </View>
              <Text style={styles.quadrantName}>Analyst</Text>
            </View>
            <View style={styles.quadrantItem}>
              <View style={[styles.quadrantIcon, { backgroundColor: '#059669' }]}>
                <Text style={styles.quadrantLetter}>L2</Text>
              </View>
              <Text style={styles.quadrantName}>Organizer</Text>
            </View>
            <View style={styles.quadrantItem}>
              <View style={[styles.quadrantIcon, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.quadrantLetter}>R1</Text>
              </View>
              <Text style={styles.quadrantName}>Strategist</Text>
            </View>
            <View style={styles.quadrantItem}>
              <View style={[styles.quadrantIcon, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.quadrantLetter}>R2</Text>
              </View>
              <Text style={styles.quadrantName}>Socializer</Text>
            </View>
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleCard}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          <Text style={styles.sampleInstruction}>Drag to rank from "Most like me" to "Least like me"</Text>
          
          <View style={styles.sampleStatements}>
            {[
              { text: "I am a practical person", rank: "4", color: "#7C3AED" },
              { text: "I am a disciplined person", rank: "3", color: "#059669" },
              { text: "I am a creative person", rank: "2", color: "#F59E0B" },
              { text: "I am a friendly person", rank: "1", color: "#DC2626" },
            ].map((statement, idx) => (
              <View key={idx} style={styles.sampleStatement}>
                <View style={[styles.sampleRank, { backgroundColor: statement.color }]}>
                  <Text style={styles.sampleRankText}>{statement.rank}</Text>
                </View>
                <Text style={styles.sampleStatementText}>{statement.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.beginButtonGradient}>
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
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
    backgroundColor: '#7C3AED',
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
  quadrantsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  quadrantsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 16,
    textAlign: 'center',
  },
  quadrantsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quadrantItem: {
    alignItems: 'center',
    flex: 1,
  },
  quadrantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quadrantLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quadrantName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a3728',
    textAlign: 'center',
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
    marginBottom: 8,
  },
  sampleInstruction: {
    fontSize: 14,
    color: '#8b7355',
    textAlign: 'center',
    marginBottom: 16,
  },
  sampleStatements: {
    gap: 8,
  },
  sampleStatement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 115, 85, 0.05)',
    padding: 12,
    borderRadius: 8,
  },
  sampleRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sampleRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sampleStatementText: {
    flex: 1,
    fontSize: 14,
    color: '#4a3728',
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