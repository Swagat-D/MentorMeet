// frontend/components/tests/InterestInventoryTest.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Question } from '@/data/riasecQuestions';

type AnswerStatus = 'unanswered' | 'yes' | 'no' | 'review';

interface Props {
  questions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: { [key: number]: boolean };
  onAnswer: (answer: boolean) => void;
  reviewQuestions: Set<number>;
  onMarkForReview: () => void;
  onNavigateToQuestion: (index: number) => void;
  getQuestionStatus: (questionId: number) => AnswerStatus;
  onSubmit: () => void;
  onBack: () => void;
}

export default function InterestInventoryTest({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  onAnswer,
  reviewQuestions,
  onMarkForReview,
  onNavigateToQuestion,
  getQuestionStatus,
  onSubmit,
  onBack,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const handleAnswer = (answer: boolean) => {
    // Animate question transition
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    onAnswer(answer);
  };

  const getQuestionNavItemStyle = (index: number) => {
    const status = getQuestionStatus(questions[index].id);
    return [
      styles.questionNavItem,
      status === 'yes' && styles.questionNavAnsweredYes,
      status === 'no' && styles.questionNavAnsweredNo,
      status === 'review' && styles.questionNavReview,
      index === currentQuestionIndex && styles.questionNavCurrent,
    ];
  };

  const getQuestionNavTextStyle = (index: number) => {
    const status = getQuestionStatus(questions[index].id);
    return [
      styles.questionNavText,
      status !== 'unanswered' && styles.questionNavTextAnswered,
      index === currentQuestionIndex && styles.questionNavTextCurrent,
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Test Header */}
      <View style={styles.testHeader}>
        <TouchableOpacity onPress={onBack}>
          <MaterialIcons name="close" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        
        <View style={styles.testHeaderContent}>
          <Text style={styles.testTitle}>Interest Inventory</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {answeredCount} of {questions.length} completed ({Math.round(progressPercentage)}%)
            </Text>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Text style={styles.currentQuestionNumber}>{currentQuestionIndex + 1}/{questions.length}</Text>
        </View>
      </View>

      {/* Question Navigation Bar */}
      <ScrollView 
        horizontal 
        style={styles.questionNavBar}
        contentContainerStyle={styles.questionNavContent}
        showsHorizontalScrollIndicator={false}
      >
        {questions.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={getQuestionNavItemStyle(index)}
            onPress={() => onNavigateToQuestion(index)}
          >
            <Text style={getQuestionNavTextStyle(index)}>
              {index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Question Content */}
      <Animated.View style={[styles.questionContainer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberContainer}>
              <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
              {currentQuestionIndex >= 36 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>Activities</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={onMarkForReview}
            >
              <MaterialIcons 
                name={reviewQuestions.has(currentQuestion.id) ? "bookmark" : "bookmark-border"} 
                size={24} 
                color={reviewQuestions.has(currentQuestion.id) ? "#F59E0B" : "#8B7355"} 
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.questionText}>
            {currentQuestionIndex >= 36 ? 'Do you enjoy: ' : ''}{currentQuestion.statement}
            {currentQuestionIndex >= 36 ? '?' : ''}
          </Text>

          {/* Creative Yes/No Options */}
          <View style={styles.answersContainer}>
            <TouchableOpacity
              style={[
                styles.answerOption,
                styles.yesOption,
                answers[currentQuestion.id] === true && styles.selectedYes
              ]}
              onPress={() => handleAnswer(true)}
            >
              <View style={styles.answerIconContainer}>
                <MaterialIcons name="thumb-up" size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.answerText, answers[currentQuestion.id] === true && styles.selectedAnswerText]}>
                Yes, this interests me
              </Text>
              <Text style={[styles.answerSubtext, answers[currentQuestion.id] === true && styles.selectedAnswerSubtext]}>
                I enjoy or would like this
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.answerOption,
                styles.noOption,
                answers[currentQuestion.id] === false && styles.selectedNo
              ]}
              onPress={() => handleAnswer(false)}
            >
              <View style={styles.answerIconContainer}>
                <MaterialIcons name="thumb-down" size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.answerText, answers[currentQuestion.id] === false && styles.selectedAnswerText]}>
                No, this doesn't interest me
              </Text>
              <Text style={[styles.answerSubtext, answers[currentQuestion.id] === false && styles.selectedAnswerSubtext]}>
                I don't enjoy this
              </Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
              onPress={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <MaterialIcons name="arrow-back" size={20} color={currentQuestionIndex === 0 ? "#D1C4B8" : "#8B4513"} />
              <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, currentQuestionIndex === questions.length - 1 && styles.navButtonDisabled]}
              onPress={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              <Text style={[styles.navButtonText, currentQuestionIndex === questions.length - 1 && styles.navButtonTextDisabled]}>
                Next
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color={currentQuestionIndex === questions.length - 1 ? "#D1C4B8" : "#8B4513"} />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          {answeredCount === questions.length && (
            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <LinearGradient colors={['#059669', '#10B981']} style={styles.submitButtonGradient}>
                <Text style={styles.submitButtonText}>Submit Test</Text>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Progress indicator for incomplete test */}
          {answeredCount < questions.length && (
            <View style={styles.progressIndicator}>
              <Text style={styles.progressIndicatorText}>
                {questions.length - answeredCount} questions remaining
              </Text>
              <View style={styles.progressIndicatorBar}>
                <View 
                  style={[
                    styles.progressIndicatorFill, 
                    { width: `${progressPercentage}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },
  
  // Test Header
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
  },
  testHeaderContent: {
    flex: 1,
    marginLeft: 16,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E8DDD1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  currentQuestionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },

  // Question Navigation
  questionNavBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    maxHeight: 60,
  },
  questionNavContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  questionNavItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F3EE',
    borderWidth: 2,
    borderColor: '#E8DDD1',
  },
  questionNavAnsweredYes: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  questionNavAnsweredNo: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  questionNavReview: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  questionNavCurrent: {
    borderColor: '#8B4513',
    borderWidth: 3,
  },
  questionNavText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B7355',
  },
  questionNavTextAnswered: {
    color: '#FFFFFF',
  },
  questionNavTextCurrent: {
    color: '#8B4513',
  },

  // Question Container
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  sectionBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewButton: {
    padding: 8,
  },
  questionText: {
    fontSize: 20,
    color: '#2A2A2A',
    lineHeight: 28,
    marginBottom: 32,
    textAlign: 'center',
  },

  // Answer Options
  answersContainer: {
    gap: 20,
    marginBottom: 32,
  },
  answerOption: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    minHeight: 120,
    justifyContent: 'center',
  },
  yesOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  noOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  selectedYes: {
    backgroundColor: '#10B981',
    transform: [{ scale: 0.98 }],
  },
  selectedNo: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 0.98 }],
  },
  answerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  answerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedAnswerText: {
    color: '#FFFFFF',
  },
  answerSubtext: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  selectedAnswerSubtext: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Navigation
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#D1C4B8',
  },

  // Submit Button
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Progress Indicator
  progressIndicator: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F3EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  progressIndicatorText: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
  },
  progressIndicatorBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E8DDD1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressIndicatorFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 3,
  },
});