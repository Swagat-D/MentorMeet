// frontend/components/tests/InterestInventoryTest.tsx - Mobile-First Redesign
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Question } from '@/data/riasecQuestions';

const { width, height } = Dimensions.get('window');

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
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  // Initialize selected answer when question changes
  useEffect(() => {
    const existingAnswer = answers[currentQuestion.id];
    setSelectedAnswer(existingAnswer !== undefined ? existingAnswer : null);
  }, [currentQuestion, answers]);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const handleAnswerSelect = (answer: boolean) => {
    setSelectedAnswer(answer);
    // Animate selection
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveAndNext = () => {
    if (selectedAnswer !== null) {
      onAnswer(selectedAnswer);
      
      // Move to next question if not the last one
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }, 300);
      }
    }
  };

  const canSaveAndNext = () => {
    return selectedAnswer !== null;
  };

  const renderQuestionGrid = () => (
    <View style={styles.questionGridOverlay}>
      <TouchableOpacity 
        style={styles.gridBackdrop}
        onPress={() => setShowQuestionGrid(false)}
        activeOpacity={1}
      />
      <Animated.View style={styles.questionGridContainer}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridTitle}>Question Navigator</Text>
          <TouchableOpacity
            onPress={() => setShowQuestionGrid(false)}
            style={styles.gridCloseButton}
          >
            <MaterialIcons name="close" size={24} color="#2A2A2A" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.gridContent} 
          contentContainerStyle={styles.gridScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionsGrid}>
            {questions.map((_, index) => {
              const status = getQuestionStatus(questions[index].id);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gridQuestionItem,
                    status === 'yes' && styles.gridAnsweredYes,
                    status === 'no' && styles.gridAnsweredNo,
                    status === 'review' && styles.gridReview,
                    index === currentQuestionIndex && styles.gridCurrent,
                  ]}
                  onPress={() => {
                    onNavigateToQuestion(index);
                    setShowQuestionGrid(false);
                  }}
                >
                  <Text style={[
                    styles.gridQuestionText,
                    (status === 'yes' || status === 'no' || status === 'review') && styles.gridQuestionTextAnswered,
                    index === currentQuestionIndex && styles.gridQuestionTextCurrent,
                  ]}>
                    {index + 1}
                  </Text>
                  {status === 'review' && (
                    <MaterialIcons name="bookmark" size={12} color="#FFFFFF" style={styles.gridBookmark} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.gridLegend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Yes</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>No</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Review</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8B4513', borderWidth: 2, borderColor: '#A0522D' }]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile-First Header */}
      <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Interest Test</Text>
            <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowQuestionGrid(true)}
            style={styles.gridButton}
          >
            <MaterialIcons name="apps" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{answeredCount} completed</Text>
            <Text style={styles.progressPercent}>{Math.round(progressPercentage)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.questionScrollView} 
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <Animated.View style={[styles.questionCard, { transform: [{ translateX: slideAnim }] }]}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberBadge}>
                <Text style={styles.questionNumberText}>Q{currentQuestionIndex + 1}</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.reviewButton,
                  reviewQuestions.has(currentQuestion.id) && styles.reviewButtonActive
                ]}
                onPress={onMarkForReview}
              >
                <MaterialIcons 
                  name={reviewQuestions.has(currentQuestion.id) ? "bookmark" : "bookmark-border"} 
                  size={20} 
                  color={reviewQuestions.has(currentQuestion.id) ? "#F59E0B" : "#8B7355"} 
                />
                <Text style={[
                  styles.reviewButtonText,
                  reviewQuestions.has(currentQuestion.id) && styles.reviewButtonTextActive
                ]}>
                  {reviewQuestions.has(currentQuestion.id) ? 'Marked' : 'Mark'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>
                {currentQuestionIndex >= 36 ? 'Do you enjoy: ' : ''}
                {currentQuestion.statement}
                {currentQuestionIndex >= 36 ? '?' : ''}
              </Text>
            </View>

            {/* Creative Answer Options */}
            <View style={styles.answersContainer}>
              {/* Yes Option */}
              <TouchableOpacity
                style={[
                  styles.answerCard,
                  styles.yesCard,
                  selectedAnswer === true && styles.selectedCard
                ]}
                onPress={() => handleAnswerSelect(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedAnswer === true ? ['#10B981', '#059669'] : ['#F0FDF4', '#ECFDF5']}
                  style={styles.answerGradient}
                >
                  <View style={styles.answerIconContainer}>
                    <View style={[
                      styles.answerIcon,
                      { backgroundColor: selectedAnswer === true ? '#FFFFFF' : '#10B981' }
                    ]}>
                      <MaterialIcons 
                        name="thumb-up" 
                        size={28} 
                        color={selectedAnswer === true ? '#10B981' : '#FFFFFF'} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.answerContent}>
                    <Text style={[
                      styles.answerTitle,
                      { color: selectedAnswer === true ? '#FFFFFF' : '#065F46' }
                    ]}>
                      YES
                    </Text>
                    <Text style={[
                      styles.answerSubtitle,
                      { color: selectedAnswer === true ? 'rgba(255,255,255,0.9)' : '#059669' }
                    ]}>
                      This interests me
                    </Text>
                  </View>

                  {selectedAnswer === true && (
                    <View style={styles.selectedIndicator}>
                      <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* No Option */}
              <TouchableOpacity
                style={[
                  styles.answerCard,
                  styles.noCard,
                  selectedAnswer === false && styles.selectedCard
                ]}
                onPress={() => handleAnswerSelect(false)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedAnswer === false ? ['#EF4444', '#DC2626'] : ['#FEF2F2', '#FECACA']}
                  style={styles.answerGradient}
                >
                  <View style={styles.answerIconContainer}>
                    <View style={[
                      styles.answerIcon,
                      { backgroundColor: selectedAnswer === false ? '#FFFFFF' : '#EF4444' }
                    ]}>
                      <MaterialIcons 
                        name="thumb-down" 
                        size={28} 
                        color={selectedAnswer === false ? '#EF4444' : '#FFFFFF'} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.answerContent}>
                    <Text style={[
                      styles.answerTitle,
                      { color: selectedAnswer === false ? '#FFFFFF' : '#991B1B' }
                    ]}>
                      NO
                    </Text>
                    <Text style={[
                      styles.answerSubtitle,
                      { color: selectedAnswer === false ? 'rgba(255,255,255,0.9)' : '#DC2626' }
                    ]}>
                      This doesn't interest me
                    </Text>
                  </View>

                  {selectedAnswer === false && (
                    <View style={styles.selectedIndicator}>
                      <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Select your answer and tap "Save & Next" to continue
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation - Fixed */}
        <View style={styles.bottomNavigation}>
          <View style={styles.navigationRow}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.previousButton,
                currentQuestionIndex === 0 && styles.navButtonDisabled
              ]}
              onPress={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={20} 
                color={currentQuestionIndex === 0 ? "#D1C4B8" : "#8B4513"} 
              />
              <Text style={[
                styles.navButtonText,
                currentQuestionIndex === 0 && styles.navButtonTextDisabled
              ]}>
                Previous
              </Text>
            </TouchableOpacity>

            {/* Save & Next / Submit Button */}
            {currentQuestionIndex === questions.length - 1 && answeredCount === questions.length ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
              >
                <LinearGradient colors={['#059669', '#10B981']} style={styles.submitGradient}>
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Test</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.saveNextButton,
                  !canSaveAndNext() && styles.saveNextButtonDisabled
                ]}
                onPress={handleSaveAndNext}
                disabled={!canSaveAndNext()}
              >
                <LinearGradient 
                  colors={canSaveAndNext() ? ['#8B4513', '#A0522D'] : ['#D1C4B8', '#D1C4B8']} 
                  style={styles.saveNextGradient}
                >
                  <Text style={styles.saveNextButtonText}>
                    {currentQuestionIndex === questions.length - 1 ? 'Save Answer' : 'Save & Next'}
                  </Text>
                  {currentQuestionIndex < questions.length - 1 && (
                    <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Info */}
          <View style={styles.bottomProgressInfo}>
            <Text style={styles.bottomProgressText}>
              {questions.length - answeredCount} questions remaining
            </Text>
          </View>
        </View>
      </View>

      {/* Question Grid Overlay */}
      {showQuestionGrid && renderQuestionGrid()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },

  // Mobile-First Header
  header: {
    paddingTop: 50, // More space from status bar
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  gridButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 50,
    alignItems: 'center',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  questionScrollView: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 120, // Space for fixed bottom nav
  },

  // Question Card
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumberBadge: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  reviewButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    marginLeft: 4,
  },
  reviewButtonTextActive: {
    color: '#F59E0B',
  },

  // Question Text
  questionTextContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#2A2A2A',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Creative Answer Options
  answersContainer: {
    gap: 16,
    marginBottom: 24,
  },
  answerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  answerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 80,
    position: 'relative',
  },
  answerIconContainer: {
    marginRight: 16,
  },
  answerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  answerContent: {
    flex: 1,
  },
  yesCard: {
    borderWidth: 0.5,
    borderColor: '#10B981',
  },
  noCard: {
    borderWidth: 0.5,
    borderColor: '#EF4444',
  },
  answerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  answerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Instruction
  instructionText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Bottom Navigation
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  previousButton: {
    flex: 0,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
    marginLeft: 6,
  },
  navButtonTextDisabled: {
    color: '#D1C4B8',
  },
  saveNextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveNextButtonDisabled: {
    opacity: 0.5,
  },
  saveNextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  saveNextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomProgressInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  bottomProgressText: {
    fontSize: 12,
    color: '#8B7355',
  },

  // Question Grid Overlay
  questionGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  gridBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  questionGridContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.6,
    maxHeight: height * 0.8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  gridCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F3EE',
  },
  gridContent: {
    flex: 1,
  },
  gridScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'space-between',
  },
  gridQuestionItem: {
    width: (width - 84) / 6, // 6 items per row with proper gaps
    height: (width - 84) / 6,
    borderRadius: ((width - 84) / 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F3EE',
    borderWidth: 2,
    borderColor: '#E8DDD1',
    position: 'relative',
  },
  gridAnsweredYes: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  gridAnsweredNo: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  gridReview: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  gridCurrent: {
    borderWidth: 3,
    borderColor: '#8B4513',
  },
  gridQuestionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B7355',
  },
  gridQuestionTextAnswered: {
    color: '#FFFFFF',
  },
  gridQuestionTextCurrent: {
    color: '#8B4513',
  },
  gridBookmark: {
    position: 'absolute',
    top: -2,
    right: -2,
  },

  // Legend
  gridLegend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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