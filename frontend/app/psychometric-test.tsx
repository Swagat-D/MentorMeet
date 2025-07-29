// frontend/app/psychometric-test.tsx - Professional Test Landing Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import psychometricService from '@/services/psychometricService';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface TestSection {
  id: string;
  title: string;
  duration: string;
  route: string;
  color: string;
  lightColor: string;
  icon: string;
  questions: number;
}

const testSections: TestSection[] = [
  {
    id: 'riasec',
    title: 'Interest Inventory',
    duration: '10-12 min',
    route: '/tests/interest-inventory',
    color: '#8B4513',
    lightColor: '#F8F3EE',
    icon: 'psychology',
    questions: 54
  },
  {
    id: 'brainProfile',
    title: 'Brain Profile',
    duration: '5-7 min',
    route: '/tests/brain-profile',
    color: '#7C3AED',
    lightColor: '#F3F0FF',
    icon: 'memory',
    questions: 10
  },
  {
    id: 'employability',
    title: 'Employability',
    duration: '8-10 min',
    route: '/tests/employability',
    color: '#059669',
    lightColor: '#F0FDF4',
    icon: 'work',
    questions: 25
  },
  {
    id: 'personalInsights',
    title: 'Personal Insights',
    duration: '3-5 min',
    route: '/tests/personal-insights',
    color: '#DC2626',
    lightColor: '#FEF2F2',
    icon: 'person',
    questions: 5
  }
];

export default function PsychometricTest() {
  const { user } = useAuthStore();
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await psychometricService.getTestDashboardData();
      setTestData(dashboardData.testData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTestStatus = (sectionId: string) => {
    if (!testData) return 'available';
    
    const completed = testData.sectionsCompleted[sectionId];
    const allCompleted = Object.values(testData.sectionsCompleted).every(Boolean);
    
    if (completed) {
      return allCompleted ? 'available' : 'completed_locked';
    }
    return 'available';
  };

  const canAccessTest = (sectionId: string) => {
    const status = getTestStatus(sectionId);
    return status === 'available';
  };

  const handleTestPress = (section: TestSection) => {
    const status = getTestStatus(section.id);
    
    if (status === 'completed_locked') {
      Alert.alert(
        'Test Already Completed',
        'Complete the remaining tests first, then you can retake all assessments.',
        [{ text: 'Got it' }]
      );
      return;
    }
    
    if (canAccessTest(section.id)) {
      router.push(section.route as any);
    }
  };

  const handleRetakeAssessment = () => {
    Alert.alert(
      'Retake Assessment',
      'This will start a fresh assessment. Your previous results will be saved but you\'ll create a new test session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Fresh Assessment', 
          style: 'default',
          onPress: async () => {
            try {
              // Reset the test to start fresh
              await psychometricService.startNewTest();
              // Reload the data
              loadTestData();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to start new assessment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderTestCard = (section: TestSection) => {
    const status = getTestStatus(section.id);
    const isCompleted = testData?.sectionsCompleted?.[section.id] || false;
  const isAvailable = status === 'available';
    return (
      <TouchableOpacity
        key={section.id}
        style={[
          styles.testCard,
          { backgroundColor: section.lightColor },
          !isAvailable && styles.testCardDisabled
        ]}
        onPress={() => handleTestPress(section)}
        activeOpacity={isAvailable ? 0.8 : 1}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
            <MaterialIcons name={section.icon as any} size={24} color="#FFFFFF" />
          </View>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, { color: section.color }]}>
          {section.title}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <MaterialIcons name="quiz" size={14} color="#8B7355" />
            <Text style={styles.metaText}>{section.questions} questions</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={14} color="#8B7355" />
            <Text style={styles.metaText}>{section.duration}</Text>
          </View>
        </View>

        {isCompleted ? (
          <View style={styles.completedTestBadge}>
            <MaterialIcons name="check-circle" size={16} color="#059669" />
            <Text style={styles.completedTestText}>Completed</Text>
          </View>
        ) : (
          <View style={[styles.startButton, { backgroundColor: section.color }]}>
            <Text style={styles.startButtonText}>Start Test</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#fefbf3', '#f8f6f0']}
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a3c" />
          <Text style={styles.loadingText}>Loading assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#fefbf3', '#f8f6f0']}
          style={styles.background}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTestData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = testData ? Object.values(testData.sectionsCompleted).filter(Boolean).length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fefbf3', '#f8f6f0']}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Career Assessment</Text>
          <Text style={styles.headerSubtitle}>{completedCount}/4 completed</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Assessment Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(completedCount / 4) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount === 4 
              ? 'All assessments completed! 🎉' 
              : `${4 - completedCount} assessments remaining`
            }
          </Text>
        </View>

        {/* All Tests Completed - Show Options */}
        {completedCount === 4 && (
          <View style={styles.completedCard}>
            <MaterialIcons name="celebration" size={48} color="#059669" />
            <Text style={styles.completedTitle}>Assessment Complete!</Text>
            <Text style={styles.completedText}>
              You've completed all four assessments. View your comprehensive results or retake the assessment.
            </Text>
            
            <View style={styles.completedActions}>
              <TouchableOpacity 
                style={styles.resultsButton}
                onPress={() => router.push('/test-results')}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  style={styles.resultsButtonGradient}
                >
                  <MaterialIcons name="insights" size={20} color="#FFFFFF" />
                  <Text style={styles.resultsButtonText}>View Results</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={handleRetakeAssessment}
              >
                <View style={styles.retakeButtonContent}>
                  <MaterialIcons name="refresh" size={20} color="#8b5a3c" />
                  <Text style={styles.retakeButtonText}>Retake Assessment</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Test Cards - Only show if not all completed */}
        {completedCount < 4 && (
          <View style={styles.testsGrid}>
            {testSections.map(renderTestCard)}
          </View>
        )}

        {/* Partial Progress - Show Results Button */}
        {completedCount > 0 && completedCount < 4 && (
          <TouchableOpacity 
            style={styles.partialResultsButton}
            onPress={() => router.push('/test-results')}
          >
            <View style={styles.partialResultsContent}>
              <MaterialIcons name="insights" size={20} color="#8b5a3c" />
              <Text style={styles.partialResultsText}>View Partial Results ({completedCount}/4)</Text>
            </View>
          </TouchableOpacity>
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
    marginRight: 10,
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
    fontSize: 12,
    color: '#8b7355',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a3728',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5a3c',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8b7355',
  },
  testsGrid: {
    gap: 16,
  },
  testCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testCardDisabled: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardMeta: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#8b7355',
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedTestBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  completedTestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  completedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a3728',
    marginTop: 16,
    marginBottom: 8,
  },
  completedCardText: {
    fontSize: 16,
    color: '#8b7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  completedActions: {
    width: '100%',
    gap: 12,
  },
  resultsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  resultsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retakeButton: {
    borderRadius: 12,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(139, 90, 60, 0.3)',
  },
  retakeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5a3c',
  },
  partialResultsButton: {
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 60, 0.3)',
    marginTop: 24,
  },
  partialResultsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  partialResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5a3c',
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
});