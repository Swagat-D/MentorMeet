// frontend/app/test-results.tsx - Professional Test Results Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import psychometricService from '@/services/psychometricService';
import { PersonalInsights } from '@/services/psychometricService';

const { width } = Dimensions.get('window');
const chartWidth = width - 48;

interface CareerSuggestion {
  category: string;
  suggestions: string[];
}

const careerMappings: { [key: string]: CareerSuggestion } = {
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

export default function TestResults() {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await psychometricService.getTestResults();
      setTestData(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRiasecResults = () => {
    if (!testData?.riasecResult) return null;

    const scores = testData.riasecResult.scores;
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => (b as number) - (a as number));
    const topScore = sortedScores[0];
    const maxScore = Math.max(...Object.values(scores).map(Number));
    
    const careerInfo = careerMappings[topScore[0]];

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Interest Inventory (RIASEC)</Text>
        
        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {sortedScores.map(([letter, score], index) => {
            const percentage = (score as number / maxScore) * 100;
            const colors = ['#8B4513', '#059669', '#7C3AED', '#F59E0B', '#DC2626', '#0EA5E9'];
            
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
                <Text style={styles.barValue}>{String(score)}</Text>
              </View>
            );
          })}
        </View>

        {/* Career Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Career Suggestions</Text>
          <Text style={styles.categoryTitle}>{careerInfo.category}</Text>
          {careerInfo.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBrainProfileResults = () => {
    if (!testData?.brainProfileResult) return null;

    const scores = testData.brainProfileResult.scores;
    const total = Object.values(scores).reduce((sum: number, score) => sum + (score as number), 0);
    
    const pieData = [
      { name: 'L1', population: scores.L1, color: '#8B4513', legendFontColor: '#4a3728', legendFontSize: 12 },
      { name: 'L2', population: scores.L2, color: '#059669', legendFontColor: '#4a3728', legendFontSize: 12 },
      { name: 'R1', population: scores.R1, color: '#7C3AED', legendFontColor: '#4a3728', legendFontSize: 12 },
      { name: 'R2', population: scores.R2, color: '#DC2626', legendFontColor: '#4a3728', legendFontSize: 12 },
    ];

    const dominantQuadrant = Object.entries(scores).reduce((max, current) => 
      (current[1] as number) > (max[1] as number) ? current : max
    );

    const quadrantInfo = brainQuadrantInfo[dominantQuadrant[0]];

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Brain Profile</Text>
        
        {/* Pie Chart */}
        <View style={styles.pieChartContainer}>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(139, 90, 60, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        {/* Dominant Quadrant */}
        <View style={styles.dominantSection}>
          <Text style={styles.dominantTitle}>
            Dominant Quadrant: {dominantQuadrant[0]} - {quadrantInfo.name}
          </Text>
          <Text style={styles.dominantDescription}>{quadrantInfo.description}</Text>
        </View>

        {/* Learning Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Learning Suggestions</Text>
          {quadrantInfo.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderEmployabilityResults = () => {
    if (!testData?.employabilityResult) return null;

    const scores = testData.employabilityResult.scores;
    const avgScore = Object.values(scores).reduce((sum: number, score) => sum + (score as number), 0) / 5;
    const employabilityQuotient = ((avgScore / 5) * 10).toFixed(1);
    
    const maxScore = 5;
    const categories = [
      { key: 'S', name: 'Self Management', color: '#8B4513' },
      { key: 'T', name: 'Team Work', color: '#059669' },
      { key: 'E', name: 'Enterprising', color: '#F59E0B' },
      { key: 'P', name: 'Problem Solving', color: '#7C3AED' },
      { key: 'Speaking', name: 'Speaking & Listening', color: '#DC2626' },
    ];

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Employability Assessment</Text>
        
        {/* Employability Quotient */}
        <View style={styles.quotientContainer}>
          <Text style={styles.quotientLabel}>Employability Quotient</Text>
          <Text style={styles.quotientValue}>{employabilityQuotient}/10</Text>
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          {categories.map((category) => {
            const score = scores[category.key as keyof typeof scores];
            const percentage = (score as number / maxScore) * 100;
            
            return (
              <View key={category.key} style={styles.barRow}>
                <Text style={styles.barLabelLong}>{category.name}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${percentage}%`, 
                        backgroundColor: category.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barValue}>{(score as number).toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPersonalInsightsResults = () => {
  if (!testData?.personalInsightsResult) return null;

  const insights = testData.personalInsightsResult.responses;

  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>Personal Insights</Text>
      <View style={styles.insightsContainer}>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>What You Enjoy:</Text>
          <Text style={styles.insightValue}>{insights.whatYouLike}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Your Strengths:</Text>
          <Text style={styles.insightValue}>{insights.whatYouAreGoodAt}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Recent Projects:</Text>
          <Text style={styles.insightValue}>{insights.recentProjects}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Character Strengths:</Text>
          <Text style={styles.insightValue}>{insights.characterStrengths.join(', ')}</Text>
        </View>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Life Values:</Text>
          <Text style={styles.insightValue}>{insights.valuesInLife.join(', ')}</Text>
        </View>
      </View>
    </View>
  );
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a3c" />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Unable to Load Results</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedSections = testData ? Object.values(testData.sectionsCompleted).filter(Boolean).length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assessment Results</Text>
          <Text style={styles.headerSubtitle}>{completedSections} sections completed</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {testData?.riasecResult && renderRiasecResults()}
        {testData?.brainProfileResult && renderBrainProfileResults()}
        {testData?.employabilityResult && renderEmployabilityResults()}
        {testData?.personalInsightsResult && renderPersonalInsightsResults()}
        
        {completedSections === 0 && (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="assessment" size={64} color="#8b7355" />
            <Text style={styles.noResultsTitle}>No Results Yet</Text>
            <Text style={styles.noResultsText}>
              Complete assessments to view your results here.
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => router.push('/psychometric-test')}
            >
              <Text style={styles.startButtonText}>Start Assessment</Text>
            </TouchableOpacity>
          </View>
        )}
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
  scrollContent: {
    padding: 24,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 20,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#4a3728',
  },
  barLabelLong: {
    width: 120,
    fontSize: 12,
    fontWeight: '600',
    color: '#4a3728',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  barValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#4a3728',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dominantSection: {
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  dominantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 8,
  },
  dominantDescription: {
    fontSize: 14,
    color: '#8b7355',
    lineHeight: 20,
  },
  quotientContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  quotientLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3728',
    marginBottom: 8,
  },
  quotientValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b5a3c',
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3728',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5a3c',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionBullet: {
    fontSize: 16,
    color: '#8b5a3c',
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#4a3728',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8b7355',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  errorText: {
    fontSize: 14,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#8b5a3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  insightsContainer: {
  paddingHorizontal: 20,
  paddingBottom: 20,
  gap: 16,
},
insightItem: {
  backgroundColor: 'rgba(220, 38, 38, 0.05)',
  padding: 16,
  borderRadius: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#DC2626',
},
insightLabel: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#DC2626',
  marginBottom: 8,
},
insightValue: {
  fontSize: 14,
  color: '#4a3728',
  lineHeight: 20,
},
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a3728',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#8b5a3c',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});