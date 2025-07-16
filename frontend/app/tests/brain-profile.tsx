// frontend/app/tests/brain-profile.tsx - Brain Profile Test Main Page
import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/stores/authStore';
import BrainProfileInstructions from '@/components/tests/BrainProfileInstructions';
import BrainProfileTest from '@/components/tests/BrainProfileTest';
import BrainProfileResults from '@/components/tests/BrainProfileResults';
import { brainProfileQuestions, calculateBrainProfileScores } from '@/data/brainProfileQuestions';
import psychometricService from '@/services/psychometricService';

type ScreenType = 'instructions' | 'test' | 'results' | 'submitting';

export default function BrainProfile() {
  const { user } = useAuthStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('instructions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number[] }>({});
  const [startTime] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  const handleRankingSubmit = (rankings: number[]) => {
    const newAnswers = { ...answers, [brainProfileQuestions[currentQuestionIndex].id]: rankings };
    setAnswers(newAnswers);

    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestionIndex < brainProfileQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300);
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const calculateLocalResults = () => {
    return calculateBrainProfileScores(
      Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [key, value])
      )
    );
  };

  const submitTest = async () => {
  try {
    setSubmitting(true);
    setCurrentScreen('submitting');
    const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
    
    // Submit to backend
    const testResult = await psychometricService.submitBrainProfileResults(answers, timeSpent);
    
    // Calculate local results
    const localResults = calculateBrainProfileScores(
      Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value]))
    );
    setResults(localResults);
    
    setCurrentScreen('results');
  } catch (error: any) {
    Alert.alert('Submission Failed', error.message);
    setCurrentScreen('test');
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
        <ActivityIndicator size="large" color="#7C3AED" />
        <View style={styles.submittingContent}>
          <Text style={styles.submittingTitle}>Analyzing Your Brain Profile</Text>
          <Text style={styles.submittingText}>
            We're calculating your dominant brain quadrants and generating insights about your thinking style...
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
      <BrainProfileInstructions
        onBeginTest={() => setCurrentScreen('test')}
        onBack={handleBack}
      />
    );
  }

  if (currentScreen === 'test') {
    return (
      <BrainProfileTest
        questions={brainProfileQuestions}
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        answers={answers}
        onRankingSubmit={handleRankingSubmit}
        onNavigateToQuestion={navigateToQuestion}
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
      <BrainProfileResults
        results={results}
        onBack={handleBack}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
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
    backgroundColor: '#7C3AED',
  },
});