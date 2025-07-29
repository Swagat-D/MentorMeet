// frontend/components/tests/InterestInventoryResults.tsx - Professional Results
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
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

interface Props {
  results: RiasecScores;
  testData: any;
  onBack: () => void;
}

const careerMappings: { [key: string]: { category: string; suggestions: string[] } } = {
  'R': {
    category: 'Realistic ("Doers" / Hunters)',
    suggestions: [
      'Engineering (Mechanical, Civil, Electrical, etc.)',
      'Skilled Trades (Carpentry, Plumbing, Electrician, Automotive Technician, etc.)'
    ]
  },
  'I': {
    category: 'Investigative ("Thinkers" / Shamans)',
    suggestions: [
      'Scientific Research (Biology, Physics, Chemistry, Environmental Science)',
      'IT & Data Analysis (Data Scientist, Medical Research Analyst, Software Developer)'
    ]
  },
  'A': {
    category: 'Artistic ("Creators" / Artisans)',
    suggestions: [
      'Design (Graphic Design, Fashion Design, Interior Design)',
      'Performing Arts (Music, Dance, Theater, Film Production)'
    ]
  },
  'S': {
    category: 'Social ("Helpers" / Healers)',
    suggestions: [
      'Teaching & Education (Teacher, Lecturer, Academic Advisor)',
      'Healthcare (Nursing, Counseling, Social Work, Therapy)'
    ]
  },
  'E': {
    category: 'Enterprising ("Persuaders" / Leaders)',
    suggestions: [
      'Business Management & Entrepreneurship (Startup Founder, Manager, Sales Executive)',
      'Marketing & Public Relations (Marketing Specialist, PR Manager, Event Planner)'
    ]
  },
  'C': {
    category: 'Conventional ("Organizers" / Lore Keepers)',
    suggestions: [
      'Accounting & Auditing (Accountant, Auditor, Bookkeeper)',
      'Administration (Office Manager, Executive Assistant, Data Entry Specialist)'
    ]
  }
};

export default function InterestInventoryResults({ results, testData, onBack }: Props) {
  const sortedResults = Object.entries(results).sort(([,a], [,b]) => b - a);
  const hollandCode = sortedResults.slice(0, 3).map(([letter]) => letter).join('');
  const maxScore = Math.max(...Object.values(results));
  const topCategory = sortedResults[0][0];
  const careerInfo = careerMappings[topCategory];

  const colors = ['#8B4513', '#059669', '#7C3AED', '#F59E0B', '#DC2626', '#0EA5E9'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Interest Inventory Results</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#4a3728" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Holland Code */}
        <View style={styles.resultCard}>
          <LinearGradient colors={['#8b5a3c', '#a0916d']} style={styles.hollandCodeHeader}>
            <MaterialIcons name="psychology" size={32} color="#FFFFFF" />
            <Text style={styles.hollandCodeTitle}>Your Holland Code</Text>
            <Text style={styles.hollandCode}>{hollandCode}</Text>
          </LinearGradient>
        </View>

        {/* Bar Chart */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Interest Scores</Text>
          <View style={styles.chartContainer}>
            {sortedResults.map(([letter, score], index) => {
              const percentage = (score / maxScore) * 100;
              return (
                <View key={letter} style={styles.barRow}>
                  <Text style={styles.barLabel}>{letter}</Text>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.barFill, 
                        { 
                          width: `${percentage}%`, 
                          backgroundColor: colors[index] 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.barValue}>{score}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Career Suggestions */}
        <View style={styles.resultCard}>
          <Text style={styles.sectionTitle}>Career Suggestions</Text>
          <Text style={styles.categoryTitle}>{careerInfo.category}</Text>
          <View style={styles.suggestionsList}>
            {careerInfo.suggestions.map((suggestion, index) => (
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
            <LinearGradient colors={['#8b5a3c', '#a0916d']} style={styles.actionButtonGradient}>
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
  hollandCodeHeader: {
    alignItems: 'center',
    padding: 32,
  },
  hollandCodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  hollandCode: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    padding: 20,
    paddingBottom: 16,
  },
  chartContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 14,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 14,
  },
  barValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5a3c',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
    backgroundColor: '#8b5a3c',
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