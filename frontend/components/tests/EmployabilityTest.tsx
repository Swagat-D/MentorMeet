// frontend/components/tests/EmployabilityTest.tsx - Improved Component
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Dimensions,
  StatusBar,
  StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmployabilityQuestion } from '@/data/employabilityQuestions';

const { width, height } = Dimensions.get('window');

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
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

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

  // Initialize selected answer when question changes
  useEffect(() => {
    const existingAnswer = answers[currentQuestion.id];
    setSelectedAnswer(existingAnswer !== undefined ? existingAnswer : null);
  }, [currentQuestion, answers]);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const handleAnswerSelect = (score: number) => {
    setSelectedAnswer(score);
    // Animate selection
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSaveAndNext = () => {
    if (selectedAnswer !== null) {
      onAnswer(currentQuestion.id, selectedAnswer);
      
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

  const getScoreColor = (score: number) => {
    const colors = ['#EF4444', '#FB923C', '#F59E0B', '#59C875', '#10B981'];
    return colors[score - 1] || '#D1D5DB';
  };

  const getScoreLabel = (score: number) => {
    const labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return labels[score - 1] || '';
  };

  const renderQuestionPalette = () => (
    <View style={styles.questionGridOverlay}>
      <TouchableOpacity 
        style={styles.gridBackdrop}
        onPress={() => setShowQuestionPalette(false)}
        activeOpacity={1}
      />
      <Animated.View style={styles.questionGridContainer}>
        <View style={styles.gridHeader}>
          <Text style={styles.gridTitle}>Question Navigator</Text>
          <TouchableOpacity
            onPress={() => setShowQuestionPalette(false)}
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
            {questions.map((question, index) => {
              const isAnswered = answers.hasOwnProperty(question.id);
              const categoryColor = categoryColors[question.category];
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gridQuestionItem,
                    { borderColor: categoryColor },
                    isAnswered && { backgroundColor: categoryColor },
                    index === currentQuestionIndex && styles.gridCurrent,
                  ]}
                  onPress={() => {
                    onNavigateToQuestion(index);
                    setShowQuestionPalette(false);
                  }}
                >
                  <Text style={[
                    styles.gridQuestionText,
                    isAnswered && styles.gridQuestionTextAnswered,
                    index === currentQuestionIndex && styles.gridQuestionTextCurrent,
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
          </View>
          
          <View style={styles.gridLegend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Answered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#059669', borderWidth: 2, borderColor: '#10B981' }]} />
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
      {/* Modern Mobile-First Header */}
      <LinearGradient colors={['#059669', '#10B981']} style={styles.testHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.testTitle}>Employability Test</Text>
            <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowQuestionPalette(true)}
            style={styles.questionToggleButton}
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
      <View style={styles.questionContainer}>
        <ScrollView 
          style={styles.questionScrollView} 
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Question Card */}
          <Animated.View style={[styles.questionCard, { transform: [{ translateX: slideAnim }] }]}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberContainer}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>Q{currentQuestionIndex + 1}</Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColors[currentQuestion.category] }]}>
                  <Text style={styles.categoryBadgeText}>{currentQuestion.category}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.hintButton,
                  showHint && styles.hintButtonActive
                ]}
                onPress={() => setShowHint(!showHint)}
              >
                <MaterialIcons 
                  name={showHint ? "help" : "help-outline"} 
                  size={20} 
                  color={showHint ? "#F59E0B" : "#8B7355"} 
                />
                <Text style={[
                  styles.hintButtonText,
                  showHint && styles.hintButtonTextActive
                ]}>
                  {showHint ? 'Hide' : 'Hint'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Question Text */}
            <View style={styles.questionTextContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>

            {/* Modern Hint Section */}
            {showHint && (
              <View style={styles.hintContainer}>
                <View style={styles.hintIcon}>
                  <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
                </View>
                <View style={styles.hintContent}>
                  <Text style={styles.hintTitle}>Hint</Text>
                  <Text style={styles.hintText}>{currentQuestion.hint}</Text>
                </View>
              </View>
            )}

            {/* Improved Rating Scale */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingTitle}>Rate yourself (1 = Poor, 5 = Excellent)</Text>
              <View style={styles.ratingOptions}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.ratingOption,
                      selectedAnswer === score && styles.ratingOptionSelected,
                      { borderColor: getScoreColor(score) }
                    ]}
                    onPress={() => handleAnswerSelect(score)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={selectedAnswer === score ? 
                        [getScoreColor(score), getScoreColor(score)] : 
                        ['#FFFFFF', '#F8FAFC']
                      }
                      style={styles.ratingGradient}
                    >
                      <View style={styles.ratingIconContainer}>
                        <View style={[
                          styles.ratingNumber,
                          { backgroundColor: selectedAnswer === score ? '#FFFFFF' : getScoreColor(score) }
                        ]}>
                          <Text style={[
                            styles.ratingNumberText,
                            { color: selectedAnswer === score ? getScoreColor(score) : '#FFFFFF' }
                          ]}>
                            {score}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.ratingContent}>
                        <Text style={[
                          styles.ratingLabel,
                          { color: selectedAnswer === score ? '#FFFFFF' : '#2A2A2A' }
                        ]}>
                          {getScoreLabel(score)}
                        </Text>
                      </View>

                      {selectedAnswer === score && (
                        <View style={styles.selectedIndicator}>
                          <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Select your rating and tap "Save & Next" to continue
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
                color={currentQuestionIndex === 0 ? "#D1C4B8" : "#059669"} 
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
                  colors={canSaveAndNext() ? ['#059669', '#10B981'] : ['#D1C4B8', '#D1C4B8']} 
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

      {/* Question Grid Overlay - Bottom Modal */}
      {showQuestionPalette && renderQuestionPalette()}
    </SafeAreaView>
  );
}

// Add these improved styles to your EmployabilityTest.tsx StyleSheet:

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  
  // Modern Mobile-First Header
  testHeader: {
    paddingTop: 50,
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
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  questionToggleButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minWidth: 50,
    alignItems: 'center',
  },
  
  // Progress Section
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

  // Main Content
  questionContainer: {
    flex: 1,
  },
  questionScrollView: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 120,
  },

  // Modern Question Card
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
  
  // Question Header
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionNumberBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  hintButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    marginLeft: 4,
  },
  hintButtonTextActive: {
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

  // Modern Hint Section
  hintContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FED7AA',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hintIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  hintContent: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Improved Rating Container - Like Interest Test
  ratingContainer: {
  marginBottom: 24,
},
ratingTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2A2A2A',
  marginBottom: 16, // Reduced from 20
  textAlign: 'center',
},
ratingOptions: {
  gap: 8, // Reduced from 12
},
ratingOption: {
  borderRadius: 12, // Reduced from 16
  overflow: 'hidden',
  borderWidth: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 }, // Reduced shadow
  shadowOpacity: 0.08, // Reduced shadow
  shadowRadius: 4, // Reduced shadow
  elevation: 2, // Reduced elevation
},
ratingOptionSelected: {
  transform: [{ scale: 0.98 }],
  shadowOpacity: 0.15, // Reduced shadow
  shadowRadius: 8, // Reduced shadow
  elevation: 4, // Reduced elevation
},
ratingGradient: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12, // Reduced from 16
  minHeight: 56, // Reduced from 70
  position: 'relative',
},
ratingIconContainer: {
  marginRight: 12, // Reduced from 16
},
ratingNumber: {
  width: 36, // Reduced from 48
  height: 36, // Reduced from 48
  borderRadius: 18, // Reduced accordingly
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 }, // Reduced shadow
  shadowOpacity: 0.08,
  shadowRadius: 2,
  elevation: 1,
},
ratingNumberText: {
  fontSize: 16, // Reduced from 18
  fontWeight: 'bold',
},
ratingContent: {
  flex: 1,
},
ratingLabel: {
  fontSize: 14, // Reduced from 16
  fontWeight: '600',
},
selectedIndicator: {
  position: 'absolute',
  top: 8, // Reduced from 12
  right: 8, // Reduced from 12
},
  // Instruction
  instructionText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
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
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    color: '#059669',
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

  // Question Grid Overlay - Bottom Modal Style
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
    backgroundColor: '#F0FDF4',
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
    width: (width - 84) / 6,
    height: (width - 84) / 6,
    borderRadius: ((width - 84) / 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#E8DDD1',
    position: 'relative',
  },
  gridCurrent: {
    borderWidth: 3,
    borderColor: '#059669',
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
    color: '#059669',
  },
  paletteCategoryText: {
    fontSize: 8,
    color: '#8B7355',
    marginTop: 2,
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