// frontend/components/tests/BrainProfileResults.tsx - Professional Results
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
import { PieChart } from 'react-native-chart-kit';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const chartWidth = width - 48;

interface BrainScores {
  L1: number;
  L2: number;
  R1: number;
  R2: number;
}

interface Props {
  results: BrainScores;
  onBack: () => void;
}

const brainQuadrantInfo: { [key: string]: { name: string; description: string; suggestions: string[] } } = {
  'L1': {
    name: 'Analyst & Realist',
    description: 'Logical, analytical, and fact-based thinking',
    suggestions: [
      'Use structured problem-solving approaches',
      'Focus on data-driven decision making'
    ]
  },
  'L2': {
    name: 'Conservative & Organizer',
    description: 'Sequential, organized, and detailed thinking',
    suggestions: [
      'Create detailed plans and schedules',
      'Follow systematic procedures'
    ]
  },
  'R1': {
    name: 'Strategist & Imaginative',
    description: 'Creative, conceptual, and big-picture thinking',
    suggestions: [
      'Engage in brainstorming and creative activities',
      'Focus on innovation and strategic planning'
    ]
  },
  'R2': {
    name: 'Socializer & Empathic',
    description: 'Interpersonal, emotional, and collaborative thinking',
    suggestions: [
      'Work in team-oriented environments',
      'Focus on relationship building and communication'
    ]
  }
};

export default function BrainProfileResults({ results, onBack }: Props) {
  const total = Object.values(results).reduce((sum, score) => sum + score, 0);
  
  const pieData = [
    { name: 'L1', population: results.L1, color: '#8B4513', legendFontColor: '#4a3728', legendFontSize: 14 },
    { name: 'L2', population: results.L2, color: '#059669', legendFontColor: '#4a3728', legendFontSize: 14 },
    { name: 'R1', population: results.R1, color: '#F59E0B', legendFontColor: '#4a3728', legendFontSize: 14 },
    { name: 'R2', population: results.R2, color: '#DC2626', legendFontColor: '#4a3728', legendFontSize: 14 },
  ];

  const dominantQuadrant = Object.entries(results).reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  const quadrantInfo = brainQuadrantInfo[dominantQuadrant[0]];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Brain Profile Results</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#4a3728" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Dominant Quadrant */}
        <View style={styles.resultCard}>
          <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.dominantHeader}>
            <MaterialIcons name="memory" size={32} color="#FFFFFF" />
            <Text style={styles.dominantTitle}>Dominant Quadrant</Text>
            <Text style={styles.dominantQuadrant}>{dominantQuadrant[0]} - {quadrantInfo.name}</Text>
          </LinearGradient>
        </View>

        {/* Pie Chart */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Brain Quadrant Distribution</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              width={chartWidth}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(139, 90, 60, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>

        {/* Quadrant Description */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Your Thinking Style</Text>
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{quadrantInfo.description}</Text>
          </View>
        </View>

        {/* Learning Suggestions */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Learning Suggestions</Text>
          <View style={styles.suggestionsList}>
            {quadrantInfo.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <View style={styles.suggestionBullet} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Continue Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
              <MaterialIcons name="home" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 100, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  homeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    overflow: 'hidden',
  },
  dominantHeader: {
    alignItems: 'center',
    padding: 32,
  },
  dominantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  dominantQuadrant: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    padding: 20,
    paddingBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4a3728',
    lineHeight: 24,
    textAlign: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  suggestionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
    marginTop: 8,
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#4a3728',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});