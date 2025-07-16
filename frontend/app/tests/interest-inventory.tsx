import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import InterestInventoryInstructions from '@/components/tests/InterestInventoryInstructions';
import InterestInventoryTest from '@/components/tests/InterestInventoryTest';
import InterestInventoryResults from '@/components/tests/InterestInventoryResults';
import { questions } from '@/data/riasecQuestions';
import psychometricService, { RiasecScores, PsychometricTest } from '@/services/psychometricService';
import { ApiService } from '@/services/api';

type ScreenType = 'instructions' | 'test' | 'results' | 'submitting' | 'loading';
type AnswerStatus = 'unanswered' | 'yes' | 'no' | 'review';

interface TestState {
  currentQuestionIndex: number;
  answers: { [key: number]: boolean };
  reviewQuestions: Set<number>;
  timeSpent: number;
}

export default function InterestInventory() {
  const { user } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('loading');
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    reviewQuestions: new Set(),
    timeSpent: 0
  });
  const [startTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RiasecScores | null>(null);
  const [testData, setTestData] = useState<PsychometricTest | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save refs
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoSaveRef = useRef<number>(0);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    loadTestData();
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [currentScreen, testState.answers])
  );

  // Auto-save functionality
  useEffect(() => {
    if (currentScreen === 'test' && Object.keys(testState.answers).length > 0) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
    
    return () => stopAutoSave();
  }, [currentScreen, testState.answers]);

  const startAutoSave = () => {
    if (autoSaveIntervalRef.current) return;
    
    autoSaveIntervalRef.current = setInterval(() => {
      const answeredCount = Object.keys(testState.answers).length;
      // Only auto-save if there are new answers since last save
      if (answeredCount > lastAutoSaveRef.current) {
        autoSaveProgress();
        lastAutoSaveRef.current = answeredCount;
      }
    }, 15000); // Auto-save every 15 seconds
  };

  const stopAutoSave = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
  };

  const autoSaveProgress = async () => {
  try {
    if (Object.keys(testState.answers).length === 0) {
      return; // Nothing to save
    }
    
    console.log(`💾 Auto-saving progress: ${Object.keys(testState.answers).length} answers`);
    
    await psychometricService.saveProgress(
      'riasec',
      testState.answers,
      testState.currentQuestionIndex
    );
    
    console.log('✅ Auto-save completed successfully');
  } catch (error) {
    console.warn('⚠️ Auto-save failed (non-blocking):', error);
    // Don't show error to user for auto-save failures
  }
};

  const loadTestData = async () => {
  try {
    setError(null);
    console.log('📋 Loading psychometric test data...');
    
    // First, run connection diagnostics
    const diagnostics = await ApiService.diagnosePsychometricConnection();
    console.log('🔍 Connection diagnostics:', diagnostics);
    
    if (!diagnostics.success) {
      console.error('❌ Connection diagnostics failed:', diagnostics.details);
      throw new Error(`Connection issue: ${diagnostics.message}`);
    }
    
    // Initialize the psychometric service
    const initResult = await psychometricService.initialize();
    if (!initResult.success) {
      throw new Error(`Service initialization failed: ${initResult.message}`);
    }
    
    // Get or create test
    const test = await psychometricService.getOrCreateTest();
    setTestData(test);
    
    console.log('📊 Test data loaded:', {
      testId: test.testId,
      status: test.status,
      completion: test.completionPercentage,
      riasecCompleted: test.sectionsCompleted.riasec
    });
    
    // Check if RIASEC section is already completed
    if (test.sectionsCompleted.riasec && test.riasecResult) {
      console.log('✅ RIASEC already completed, showing results');
      setResults(test.riasecResult.scores as RiasecScores);
      setCurrentScreen('results');
      return;
    }
    
    // Load saved progress if any
    if (test.progressData?.partialResponses?.riasec) {
      console.log('📥 Loading saved progress...');
      const savedAnswers = test.progressData.partialResponses.riasec as { [key: number]: boolean};
      const savedIndex = test.progressData.currentQuestionIndex || 0;
      
      setTestState(prev => ({
        ...prev,
        answers: savedAnswers,
        currentQuestionIndex: Math.min(savedIndex, questions.length - 1)
      }));
      
      console.log(`📍 Restored progress: ${Object.keys(savedAnswers).length} answers, question ${savedIndex}`);
    }
    
    setCurrentScreen('instructions');
    
  } catch (error: any) {
    console.error('❌ Error loading test data:', error);
    setError(error.message || 'Failed to load test. Please try again.');
    setCurrentScreen('instructions');
  }
};

  const handleAnswer = (answer: boolean) => {
    const currentQuestion = questions[testState.currentQuestionIndex];
    const newAnswers = { ...testState.answers, [currentQuestion.id]: answer };
    
    setTestState(prev => ({
      ...prev,
      answers: newAnswers,
      reviewQuestions: new Set([...prev.reviewQuestions].filter(id => id !== currentQuestion.id))
    }));

    // Auto-advance to next question
    setTimeout(() => {
      if (testState.currentQuestionIndex < questions.length - 1) {
        setTestState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
      }
    }, 200);
  };

  const markForReview = () => {
    const currentQuestion = questions[testState.currentQuestionIndex];
    setTestState(prev => ({
      ...prev,
      reviewQuestions: new Set([...prev.reviewQuestions, currentQuestion.id])
    }));
  };

  const navigateToQuestion = (index: number) => {
    setTestState(prev => ({ ...prev, currentQuestionIndex: index }));
  };

  const getQuestionStatus = (questionId: number): AnswerStatus => {
    if (testState.reviewQuestions.has(questionId)) return 'review';
    if (testState.answers.hasOwnProperty(questionId)) {
      return testState.answers[questionId] ? 'yes' : 'no';
    }
    return 'unanswered';
  };

  const submitTest = async () => {
  try {
    setSubmitting(true);
    setCurrentScreen('submitting');
    setError(null);

    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    
    console.log('📝 Starting RIASEC submission process...');
    console.log(`📊 Submitting ${Object.keys(testState.answers).length} responses`);
    console.log(`⏱️ Time spent: ${timeSpent} minutes`);
    
    // Validate before submission
    const validation = psychometricService.validateRiasecResponses(testState.answers);
    if (!validation.isValid) {
      throw new Error(`Please complete all questions: ${validation.validationErrors.join(', ')}`);
    }

    // Stop auto-save during submission
    stopAutoSave();
    
    // Submit to backend with enhanced error handling
    try {
      const testResult = await psychometricService.submitRiasecResults(testState.answers, timeSpent);
      
      // Calculate local results for immediate display
      const localResults = psychometricService.calculateRiasecScores(testState.answers);
      setResults(localResults);
      setTestData(testResult);
      setCurrentScreen('results');

      console.log('✅ RIASEC test completed successfully');
      console.log('📊 Results:', {
        hollandCode: psychometricService.getHollandCode(localResults),
        scores: localResults,
        testStatus: testResult.status,
        completion: testResult.completionPercentage
      });

    } catch (submitError: any) {
      console.error('❌ Submission to backend failed:', submitError);
      
      // Show user-friendly error messages
      let errorMessage = 'Failed to submit test results.';
      
      if (submitError.message.includes('Session expired') || 
          submitError.message.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please restart the app and log in again.';
      } else if (submitError.message.includes('Network') || 
                 submitError.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (submitError.message.includes('Validation failed')) {
        errorMessage = `Please check your answers: ${submitError.message}`;
      } else if (submitError.message.includes('Server error')) {
        errorMessage = 'Server is temporarily unavailable. Please try again in a few moments.';
      }
      
      throw new Error(errorMessage);
    }

  } catch (error: any) {
    console.error('❌ Error in submission process:', error);
    setError(error.message);
    
    Alert.alert(
      'Submission Failed',
      error.message,
      [
        { 
          text: 'Retry', 
          onPress: () => {
            setError(null);
            submitTest();
          } 
        },
        { 
          text: 'Save & Exit', 
          onPress: () => {
            autoSaveProgress();
            setCurrentScreen('test');
          } 
        }
      ]
    );
  } finally {
    setSubmitting(false);
  }
};


  const handleBack = () => {
  if (currentScreen === 'test' && Object.keys(testState.answers).length > 0) {
    Alert.alert(
      'Exit Test',
      'Your progress will be saved automatically. You can continue later from where you left off.',
      [
        { text: 'Continue Test', style: 'cancel' },
        { 
          text: 'Save & Exit', 
          style: 'default', 
          onPress: async () => {
            await autoSaveProgress();
            router.back();
          }
        },
        { 
          text: 'Exit Without Saving', 
          style: 'destructive', 
          onPress: () => router.back() 
        }
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

  const renderError = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Connection Issue</Text>
      <Text style={styles.errorText}>{error}</Text>
      
      {/* Enhanced error actions */}
      <View style={styles.errorButtons}>
        <TouchableOpacity style={styles.retryButton} onPress={retryLoad}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.diagnosisButton} 
          onPress={async () => {
            try {
              const diagnostics = await ApiService.diagnosePsychometricConnection();
              Alert.alert(
                'Connection Diagnosis', 
                diagnostics.message,
                [{ text: 'OK' }]
              );
            } catch (diagError) {
              Alert.alert('Diagnosis Failed', 'Unable to run diagnostics');
            }
          }}
        >
          <Text style={styles.diagnosisButtonText}>Check Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
);

  const renderLoading = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your test...</Text>
      </View>
    </SafeAreaView>
  );

  const renderSubmitting = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.submittingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <View style={styles.submittingContent}>
          <Text style={styles.submittingTitle}>Analyzing Your Responses</Text>
          <Text style={styles.submittingText}>
            We're calculating your RIASEC profile and generating personalized insights...
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
      <InterestInventoryInstructions
        onBeginTest={() => setCurrentScreen('test')}
        onBack={handleBack}
      />
    );
  }

  if (currentScreen === 'test') {
    return (
      <InterestInventoryTest
        questions={questions}
        currentQuestionIndex={testState.currentQuestionIndex}
        setCurrentQuestionIndex={(index) => setTestState(prev => ({ ...prev, currentQuestionIndex: index }))}
        answers={testState.answers}
        onAnswer={handleAnswer}
        reviewQuestions={testState.reviewQuestions}
        onMarkForReview={markForReview}
        onNavigateToQuestion={navigateToQuestion}
        getQuestionStatus={getQuestionStatus}
        onSubmit={submitTest}
        onBack={handleBack}
      />
    );
  }

  if (currentScreen === 'submitting') {
    return renderSubmitting();
  }

  if (currentScreen === 'results' && results) {
    return (
      <InterestInventoryResults
        results={results}
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
    backgroundColor: '#F8F3EE',
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
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#E8DDD1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#8B4513',
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
    backgroundColor: '#8B4513',
  },
  diagnosisButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  diagnosisButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  errorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
});