// app/tests/interest-inventory.tsx - Main Interest Inventory Test Component
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import psychometricService, { RiasecScores } from '@/services/psychometricService';
import { useAuthStore } from '@/stores/authStore';
import InterestInventoryInstructions from '@/components/tests/InterestInventoryInstructions';
import InterestInventoryTest from '@/components/tests/InterestInventoryTest';
import InterestInventoryResults from '@/components/tests/InterestInventoryResults';
import { questions } from '@/data/riasecQuestions';

type ScreenType = 'instructions' | 'test' | 'results' | 'submitting';
type AnswerStatus = 'unanswered' | 'yes' | 'no' | 'review';

export default function InterestInventory() {
  const { user } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: boolean }>({});
  const [reviewQuestions, setReviewQuestions] = useState<Set<number>>(new Set());
  const [startTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RiasecScores | null>(null);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0 && currentScreen === 'test') {
        psychometricService.saveProgress('riasec', answers, currentQuestionIndex);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [answers, currentQuestionIndex, currentScreen]);

  const getQuestionStatus = (questionId: number): AnswerStatus => {
    if (reviewQuestions.has(questionId)) return 'review';
    if (answers.hasOwnProperty(questionId)) {
      return answers[questionId] ? 'yes' : 'no';
    }
    return 'unanswered';
  };

  const handleAnswer = (answer: boolean) => {
    const newAnswers = { ...answers, [questions[currentQuestionIndex].id]: answer };
    setAnswers(newAnswers);
    
    // Remove from review if answered
    setReviewQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questions[currentQuestionIndex].id);
      return newSet;
    });

    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 200);
  };

  const markForReview = () => {
    setReviewQuestions(prev => new Set([...prev, questions[currentQuestionIndex].id]));
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const calculateLocalResults = (): RiasecScores => {
    return psychometricService.calculateRiasecScores(answers);
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);
      setCurrentScreen('submitting');

      // Calculate time spent
      const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000); // minutes

      // Validate responses first
      const validation = await psychometricService.validateSection('riasec', answers);
      
      if (!validation.isValid) {
        Alert.alert(
          'Incomplete Test',
          `Please answer all questions before submitting. ${validation.validationErrors.join(', ')}`,
          [{ text: 'OK', onPress: () => setCurrentScreen('test') }]
        );
        return;
      }

      // Submit to backend
      const testResult = await psychometricService.submitRiasecResults(answers, timeSpent);
      
      // Calculate local results for immediate display
      const localResults = calculateLocalResults();
      setResults(localResults);
      setTestData(testResult);
      setCurrentScreen('results');

      console.log('✅ RIASEC test submitted successfully');

    } catch (error: any) {
      console.error('❌ Error submitting test:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit test. Please try again.',
        [
          { text: 'Retry', onPress: () => submitTest() },
          { text: 'Cancel', onPress: () => setCurrentScreen('test') }
        ]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentScreen === 'test' && Object.keys(answers).length > 0) {
      Alert.alert(
        'Exit Test',
        'Your progress will be saved. You can continue later from where you left off.',
        [
          { text: 'Continue Test', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const renderSubmittingScreen = () => (
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
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        answers={answers}
        onAnswer={handleAnswer}
        reviewQuestions={reviewQuestions}
        onMarkForReview={markForReview}
        onNavigateToQuestion={navigateToQuestion}
        getQuestionStatus={getQuestionStatus}
        onSubmit={submitTest}
        onBack={handleBack}
      />
    );
  }

  if (currentScreen === 'submitting') {
    return renderSubmittingScreen();
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
});