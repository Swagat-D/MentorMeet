// frontend/components/tests/BrainProfileInstructions.tsx - Brain Profile Instructions
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
import { brainProfileInfo } from '@/data/brainProfileQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface Props {
  onBeginTest: () => void;
  onBack: () => void;
}

export default function BrainProfileInstructions({ onBeginTest, onBack }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Responsive Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Brain Profile Test</Text>
          <Text style={styles.headerSubtitle}>Career Preference Assessment</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.instructionsContent}>
        {/* Responsive Hero Section */}
        <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.instructionsHero}>
          <MaterialIcons name="psychology" size={isTablet ? 80 : 60} color="#FFFFFF" />
          <Text style={styles.instructionsTitle}>Brain Profile Assessment</Text>
          <Text style={styles.instructionsSubtitle}>
            Discover your dominant thinking quadrants and learning style
          </Text>
        </LinearGradient>

        {/* Responsive Instructions Card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>How It Works</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="sort" size={24} color="#7C3AED" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Rank Statements</Text>
                <Text style={styles.instructionText}>
                  For each set, drag to rank the 4 statements from "Most like me" (4 points) to "Least like me" (1 point)
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="psychology" size={24} color="#10B981" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Think About Yourself</Text>
                <Text style={styles.instructionText}>
                  Consider how you naturally behave, think, and approach situations in your daily life
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="swap-vert" size={24} color="#F59E0B" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Drag to Reorder</Text>
                <Text style={styles.instructionText}>
                  Touch and hold any statement to drag it up or down to change its ranking position
                </Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionIcon}>
                <MaterialIcons name="insights" size={24} color="#DC2626" />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>Get Brain Insights</Text>
                <Text style={styles.instructionText}>
                  Discover your dominant brain quadrants and personalized learning recommendations
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
              <MaterialIcons name="quiz" size={20} color="#7C3AED" />
              <Text style={styles.detailText}>10 Question Sets</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="#7C3AED" />
              <Text style={styles.detailText}>5-7 Minutes</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="psychology" size={20} color="#7C3AED" />
              <Text style={styles.detailText}>Brain Quadrants</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="insights" size={20} color="#7C3AED" />
              <Text style={styles.detailText}>Learning Style</Text>
            </View>
          </View>
        </View>

        {/* Responsive Brain Quadrants Info */}
        <View style={styles.brainInfo}>
          <Text style={styles.brainTitle}>The Four Brain Quadrants</Text>
          <Text style={styles.brainDescription}>
            This assessment measures your preferences across four thinking styles based on brain hemisphere research:
          </Text>
          <View style={styles.brainQuadrants}>
            {brainProfileInfo.map((quadrant, index) => (
              <View key={index} style={styles.brainQuadrant}>
                <View style={[styles.brainQuadrantIcon, { backgroundColor: quadrant.color }]}>
                  <Text style={styles.brainQuadrantLetter}>{quadrant.quadrant}</Text>
                </View>
                <View style={styles.brainQuadrantContent}>
                  <Text style={styles.brainQuadrantName}>{quadrant.name}</Text>
                  <Text style={styles.brainQuadrantDesc}>{quadrant.description}</Text>
                  <View style={styles.brainTraits}>
                    {quadrant.traits.slice(0, 3).map((trait, idx) => (
                      <View key={idx} style={[styles.traitTag, { borderColor: quadrant.color }]}>
                        <Text style={[styles.traitText, { color: quadrant.color }]}>{trait}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Sample Question */}
        <View style={styles.sampleSection}>
          <Text style={styles.sampleTitle}>Sample Question</Text>
          <View style={styles.sampleCard}>
            <Text style={styles.sampleSetTitle}>Set 1: Rank from Most like me (4) to Least like me (1)</Text>
            <View style={styles.sampleStatements}>
              {[
                { text: "I am a practical person", rank: "4", color: "#7C3AED" },
                { text: "I am a disciplined person", rank: "3", color: "#059669" },
                { text: "I am a creative person", rank: "2", color: "#F59E0B" },
                { text: "I am a friendly person", rank: "1", color: "#DC2626" },
              ].map((statement, idx) => (
                <View key={idx} style={[styles.sampleStatement, { borderLeftColor: statement.color }]}>
                  <View style={[styles.sampleRank, { backgroundColor: statement.color }]}>
                    <Text style={styles.sampleRankText}>{statement.rank}</Text>
                  </View>
                  <Text style={styles.sampleStatementText}>{statement.text}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sampleNote}>
              Drag statements up or down to change their ranking order
            </Text>
          </View>
        </View>

        {/* Responsive Begin Button */}
        <TouchableOpacity style={styles.beginButton} onPress={onBeginTest}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.beginButtonGradient}>
            <Text style={styles.beginButtonText}>Begin Test</Text>
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
    backgroundColor: '#F3F0FF',
  },
  
  // Responsive Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: isTablet ? 20 : 20, // Fixed header alignment
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
  
  // Responsive Instructions Card
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
    backgroundColor: '#F3F0FF',
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
  
  // Responsive Test Details
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
  
  // Responsive Brain Info
  brainInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  brainTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  brainDescription: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 20,
  },
  brainQuadrants: {
    gap: 16,
  },
  brainQuadrant: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  brainQuadrantIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  brainQuadrantLetter: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brainQuadrantContent: {
    flex: 1,
  },
  brainQuadrantName: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  brainQuadrantDesc: {
    fontSize: isTablet ? 15 : 13,
    color: '#8B7355',
    marginBottom: 8,
    lineHeight: isTablet ? 20 : 18,
  },
  brainTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  traitText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '500',
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
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sampleSetTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 16,
    textAlign: 'center',
  },
  sampleStatements: {
    gap: 12,
    marginBottom: 16,
  },
  sampleStatement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 16 : 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  sampleRank: {
    width: isTablet ? 32 : 28,
    height: isTablet ? 32 : 28,
    borderRadius: isTablet ? 16 : 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sampleRankText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sampleStatementText: {
    fontSize: isTablet ? 16 : 14,
    color: '#2A2A2A',
    flex: 1,
  },
  sampleNote: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Responsive Begin Button
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