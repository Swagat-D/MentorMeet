// frontend/app/tests/personal-insights.tsx - Personal Insights Test Main Page
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import PersonalInsightsInstructions from '@/components/tests/PersonalInsightsInstructions';
import PersonalInsightsTest from '@/components/tests/PersonalInsightsTest';
import PersonalInsightsResults from '@/components/tests/PersonalInsightsResults';
import psychometricService, { PersonalInsights, PsychometricTest } from '@/services/psychometricService';


type ScreenType = 'instructions' | 'test' | 'results' | 'submitting' | 'loading';

export default function PersonalInsightsMain() {
  const { user } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('loading');
  const [startTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [insights, setInsights] = useState<PersonalInsights | null>(null);
  const [testData, setTestData] = useState<PsychometricTest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      setError(null);
      console.log('📋 Loading personal insights test data...');
      
      const test = await psychometricService.getOrCreateTest();
      setTestData(test);
      
      console.log('📊 Test data loaded:', {
        testId: test.testId,
        status: test.status,
        personalInsightsCompleted: test.sectionsCompleted.personalInsights
      });
      
      // Check if Personal Insights section is already completed
      if (test.sectionsCompleted.personalInsights && test.personalInsightsResult) {
        console.log('✅ Personal Insights already completed, showing results');
        setInsights(test.personalInsightsResult.responses);
        setCurrentScreen('results');
        return;
      }
      
      // Check access permissions (same logic as dashboard)
      const allCompleted = Object.values(test.sectionsCompleted).every(Boolean);
      const isCompleted = test.sectionsCompleted.personalInsights;
      
      if (isCompleted && !allCompleted) {
        // Test is completed but user can't retake until all sections are done
        Alert.alert(
          'Test Already Completed',
          'Complete the remaining tests first, then you can retake all assessments.',
          [
            { text: 'Got it', onPress: () => router.back() }
          ]
        );
        return;
      }
      
      setCurrentScreen('instructions');
      
    } catch (error: any) {
      console.error('❌ Error loading test data:', error);
      setError(error.message || 'Failed to load test. Please try again.');
      setCurrentScreen('instructions');
    }
  };

  const handleSubmit = async (personalInsights: PersonalInsights) => {
    try {
      setSubmitting(true);
      setCurrentScreen('submitting');
      const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      
      console.log('📝 Starting Personal Insights submission process...');
      console.log(`⏱️ Time spent: ${timeSpent} minutes`);
      
      // Submit to backend
      const testResult = await psychometricService.submitPersonalInsights(personalInsights, timeSpent);
      
      // Store insights for results display
      setInsights(personalInsights);
      setTestData(testResult);
      
      setCurrentScreen('results');
      console.log('✅ Personal Insights test completed successfully');
      
    } catch (error: any) {
      console.error('❌ Error in Personal Insights submission:', error);
      Alert.alert('Submission Failed', error.message);
      setCurrentScreen('test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'test') {
      Alert.alert(
        'Exit Test',
        'Are you sure you want to exit? Your progress will be lost.',
        [
          { text: 'Continue Test', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const retryLoad = () => {
    setCurrentScreen('loading');
    setError(null);
    loadTestData();
  };

  const renderLoading = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading your test...</Text>
      </View>
    </SafeAreaView>
  );

  const renderError = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderSubmittingScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.submittingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <View style={styles.submittingContent}>
          <Text style={styles.submittingTitle}>Saving Your Personal Insights</Text>
          <Text style={styles.submittingText}>
            We're processing your responses and completing your comprehensive assessment profile...
          </Text>
          <View style={styles.progressDots}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[styles.dot, { opacity: 0.3 + (index * 0.3) }]} />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );

  // Render appropriate screen
  if (error && currentScreen !== 'test') {
    return renderError();
  }

  if (currentScreen === 'loading') {
    return renderLoading();
  }

  if (currentScreen === 'instructions') {
    return (
      <PersonalInsightsInstructions
        onBeginTest={() => setCurrentScreen('test')}
        onBack={handleBack}
        testData={testData}
      />
    );
  }

  if (currentScreen === 'test') {
    return (
      <PersonalInsightsTest
        onSubmit={handleSubmit}
        onBack={handleBack}
      />
    );
  }

  if (currentScreen === 'submitting') {
    return renderSubmittingScreen();
  }

  if (currentScreen === 'results' && insights) {
    return (
      <PersonalInsightsResults
        insights={insights}
        testData={testData}
        onBack={handleBack}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  submittingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  submittingContent: {
    alignItems: 'center',
    marginTop: 32,
  },
  submittingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  submittingText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
});