// frontend/components/tests/EmployabilityTest.tsx - Employability Test Component
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmployabilityQuestion } from '@/data/employabilityQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface Props {
  questions: EmployabilityQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: { [key: number]: number };
  onAnswer: (questionId: number, score: number) => void;
  onNavigateToQuestion: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export default function EmployabilityTest({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  onAnswer,
  onNavigateToQuestion,
  onSubmit,
  onBack,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const categoryColors = {
    'S': '#0EA5E9',
    'T': '#059669', 
    'E': '#F59E0B',
    'P': '#7C3AED',
    'Speaking': '#DC2626',
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const handleAnswer = (score: number) => {
    // Animate question transition
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();

    onAnswer(currentQuestion.id, score);
  };

  const getScoreColor = (score: number) => {
    const colors = ['#EF4444', '#FB923C', '#F59E0B', '#59C875', '#10B981'];
    return colors[score - 1] || '#D1D5DB';
  };

  const getScoreLabel = (score: number) => {
    const labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return labels[score - 1] || '';
  };

  const renderQuestionPalette = () => (
    <Modal
      visible={showQuestionPalette}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowQuestionPalette(false)}
    >
      <SafeAreaView style={styles.paletteContainer}>
        <View style={styles.paletteHeader}>
          <Text style={styles.paletteTitle}>Question Navigator</Text>
          <TouchableOpacity
            onPress={() => setShowQuestionPalette(false)}
            style={styles.paletteCloseButton}
          >
            <MaterialIcons name="close" size={24} color="#2A2A2A" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.paletteContent} contentContainerStyle={styles.paletteGrid}>
          {questions.map((question, index) => {
            const isAnswered = answers.hasOwnProperty(question.id);
            const categoryColor = categoryColors[question.category];
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.paletteQuestionItem,
                  { borderColor: categoryColor },
                  isAnswered && { backgroundColor: categoryColor },
                  index === currentQuestionIndex && styles.paletteCurrent,
                ]}
                onPress={() => {
                  onNavigateToQuestion(index);
                  setShowQuestionPalette(false);
                }}
              >
                <Text style={[
                  styles.paletteQuestionText,
                  isAnswered && styles.paletteQuestionTextAnswered,
                  index === currentQuestionIndex && styles.paletteQuestionTextCurrent,
                ]}>
                  {index + 1}
                </Text>
                <Text style={[
                  styles.paletteCategoryText,
                  isAnswered && { color: '#FFFFFF' },
                  index === currentQuestionIndex && { color: categoryColor },
                ]}>
                  {question.category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        <View style={styles.paletteLegend}>
          {Object.entries(categoryColors).map(([category, color]) => (
            <View key={category} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{category}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Responsive Fixed Header */}
      <View style={styles.testHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        
        <View style={styles.testHeaderContent}>
          <Text style={styles.testTitle}>Employability Test</Text>
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
          <TouchableOpacity
            onPress={() => setShowQuestionPalette(true)}
            style={styles.questionToggleButton}
          >
            <Text style={styles.currentQuestionNumber}>{currentQuestionIndex + 1}/{questions.length}</Text>
            <MaterialIcons name="grid-view" size={20} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Question Content */}
      <Animated.View style={[styles.questionContainer, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView style={styles.questionScrollView} contentContainerStyle={styles.questionContent}>
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberContainer}>
                <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColors[currentQuestion.category] }]}>
                  <Text style={styles.categoryBadgeText}>{currentQuestion.category}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.hintButton}
                onPress={() => setShowHint(!showHint)}
              >
                <MaterialIcons 
                  name={showHint ? "help" : "help-outline"} 
                  size={24} 
                  color={showHint ? "#F59E0B" : "#8B7355"} 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Hint Section */}
            {showHint && (
              <View style={styles.hintContainer}>
                <View style={styles.hintHeader}>
                  <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
                  <Text style={styles.hintTitle}>Hint</Text>
                </View>
                <Text style={styles.hintText}>{currentQuestion.hint}</Text>
              </View>
            )}

            {/* Rating Scale */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingTitle}>Rate yourself (1 = Poor, 5 = Excellent)</Text>
              <View style={styles.ratingOptions}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.ratingOption,
                      answers[currentQuestion.id] === score && styles.ratingOptionSelected,
                      { borderColor: getScoreColor(score) }
                    ]}
                    onPress={() => handleAnswer(score)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.ratingNumber,
                      answers[currentQuestion.id] === score && { backgroundColor: getScoreColor(score) }
                    ]}>
                      <Text style={[
                        styles.ratingNumberText,
                        answers[currentQuestion.id] === score && styles.ratingNumberTextSelected
                      ]}>
                        {score}
                      </Text>
                    </View>
                    <Text style={[
                      styles.ratingLabel,
                      answers[currentQuestion.id] === score && { color: getScoreColor(score) }
                    ]}>
                      {getScoreLabel(score)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                onPress={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <MaterialIcons name="arrow-back" size={20} color={currentQuestionIndex === 0 ? "#D1C4B8" : "#059669"} />
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
                <MaterialIcons name="arrow-forward" size={20} color={currentQuestionIndex === questions.length - 1 ? "#D1C4B8" : "#059669"} />
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
        </ScrollView>
      </Animated.View>

      {/* Question Palette Modal */}
      {renderQuestionPalette()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  
  // Responsive Fixed Header
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: isTablet ? 20 : 20,
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
  testHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  testTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  progressContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: isTablet ? 14 : 12,
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
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  questionToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  currentQuestionNumber: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#059669',
  },

  // Question Container
  questionContainer: {
    flex: 1,
  },
  questionScrollView: {
    flex: 1,
  },
  questionContent: {
    padding: isTablet ? 32 : 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 32 : 24,
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
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hintButton: {
    padding: 8,
  },
  questionText: {
    fontSize: isTablet ? 22 : 18,
    color: '#2A2A2A',
    lineHeight: isTablet ? 30 : 26,
    marginBottom: 20,
    fontWeight: '500',
  },

  // Hint Section
  hintContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 8,
  },
  hintText: {
    fontSize: isTablet ? 15 : 14,
    color: '#92400E',
    lineHeight: isTablet ? 22 : 20,
  },

  // Rating Container
  ratingContainer: {
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: isTablet ? 12 : 8,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    padding: isTablet ? 20 : 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    minHeight: isTablet ? 120 : 100,
    justifyContent: 'center',
  },
  ratingOptionSelected: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  ratingNumber: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  ratingNumberText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#64748B',
  },
  ratingNumberTextSelected: {
    color: '#FFFFFF',
  },
  ratingLabel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
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
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 24 : 20,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#059669',
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
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  submitButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Progress Indicator
  progressIndicator: {
    alignItems: 'center',
    padding: isTablet ? 20 : 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  progressIndicatorText: {
    fontSize: isTablet ? 16 : 14,
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
    backgroundColor: '#059669',
    borderRadius: 3,
  },

  // Question Palette Modal
  paletteContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
  },
  paletteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  paletteCloseButton: {
    padding: 8,
  },
  paletteContent: {
    flex: 1,
    padding: 20,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paletteQuestionItem: {
    width: isTablet ? 80 : 70,
    height: isTablet ? 80 : 70,
    borderRadius: isTablet ? 40 : 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8DDD1',
  },
  paletteCurrent: {
    borderWidth: 3,
    borderColor: '#059669',
  },
  paletteQuestionText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#8B7355',
  },
  paletteQuestionTextAnswered: {
    color: '#FFFFFF',
  },
  paletteQuestionTextCurrent: {
    color: '#059669',
  },
  paletteCategoryText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
    color: '#8B7355',
    marginTop: 2,
  },
  paletteLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#8B7355',
    fontWeight: '500',
  },
});