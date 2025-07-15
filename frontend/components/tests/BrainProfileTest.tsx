// frontend/components/tests/BrainProfileTest.tsx - Brain Profile Test Component
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
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrainProfileQuestion } from '@/data/brainProfileQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface Props {
  questions: BrainProfileQuestion[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  answers: { [key: number]: number[] };
  onRankingSubmit: (rankings: number[]) => void;
  onNavigateToQuestion: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

interface RankingItem {
  id: string;
  text: string;
  rank: number;
  color: string;
}

export default function BrainProfileTest({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  onRankingSubmit,
  onNavigateToQuestion,
  onSubmit,
  onBack,
}: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  // Initialize ranking items
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);

  const colors = ['#7C3AED', '#059669', '#F59E0B', '#DC2626'];
  const quadrantLabels = ['L1', 'L2', 'R1', 'R2'];

  useEffect(() => {
    // Initialize or restore ranking for current question
    const existingRanking = answers[currentQuestion.id];
    
    const items: RankingItem[] = [
      { id: 'L1', text: currentQuestion.statements.L1, rank: 4, color: colors[0] },
      { id: 'L2', text: currentQuestion.statements.L2, rank: 3, color: colors[1] },
      { id: 'R1', text: currentQuestion.statements.R1, rank: 2, color: colors[2] },
      { id: 'R2', text: currentQuestion.statements.R2, rank: 1, color: colors[3] },
    ];

    if (existingRanking) {
      // Restore previous ranking
      items.forEach((item, index) => {
        item.rank = existingRanking[quadrantLabels.indexOf(item.id)];
      });
      items.sort((a, b) => b.rank - a.rank);
    }

    setRankingItems(items);
  }, [currentQuestion, answers]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...rankingItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    
    // Update ranks (4 = Most like me, 1 = Least like me)
    newItems.forEach((item, index) => {
      item.rank = 4 - index;
    });
    
    setRankingItems(newItems);
  };

  const handleSubmitRanking = () => {
    // Convert ranking to array format expected by backend [L1, L2, R1, R2]
    const rankings = [0, 0, 0, 0];
    rankingItems.forEach(item => {
      const quadrantIndex = quadrantLabels.indexOf(item.id);
      rankings[quadrantIndex] = item.rank;
    });

    onRankingSubmit(rankings);
  };

  const canSubmit = () => {
    const ranks = rankingItems.map(item => item.rank);
    return ranks.includes(4) && ranks.includes(3) && ranks.includes(2) && ranks.includes(1);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Responsive Fixed Header */}
        <View style={styles.testHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="close" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          
          <View style={styles.testHeaderContent}>
            <Text style={styles.testTitle}>Brain Profile Test</Text>
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

        {/* Question Navigation */}
        <ScrollView 
          horizontal 
          style={styles.questionNavBar}
          contentContainerStyle={styles.questionNavContent}
          showsHorizontalScrollIndicator={false}
        >
          {questions.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.questionNavItem,
                answers[questions[index].id] && styles.questionNavAnswered,
                index === currentQuestionIndex && styles.questionNavCurrent,
              ]}
              onPress={() => onNavigateToQuestion(index)}
            >
              <Text style={[
                styles.questionNavText,
                answers[questions[index].id] && styles.questionNavTextAnswered,
                index === currentQuestionIndex && styles.questionNavTextCurrent,
              ]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Question Content */}
        <ScrollView style={styles.questionContainer} contentContainerStyle={styles.questionContent}>
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>Set {currentQuestion.setNumber}</Text>
              <View style={styles.instructionBadge}>
                <Text style={styles.instructionBadgeText}>Drag to Rank</Text>
              </View>
            </View>

            <Text style={styles.questionTitle}>
              Rank these statements from "Most like me" to "Least like me"
            </Text>

            <View style={styles.rankingLabels}>
              <Text style={styles.rankingLabel}>Most like me (4)</Text>
              <Text style={styles.rankingLabel}>Least like me (1)</Text>
            </View>

            {/* Ranking Items */}
            <View style={styles.rankingContainer}>
              {rankingItems.map((item, index) => (
                <View key={item.id} style={styles.rankingItemContainer}>
                  <TouchableOpacity
                    style={[styles.rankingItem, { borderLeftColor: item.color }]}
                    onLongPress={() => {
                      // Handle drag start
                    }}
                  >
                    <View style={[styles.rankNumber, { backgroundColor: item.color }]}>
                      <Text style={styles.rankNumberText}>{item.rank}</Text>
                    </View>
                    <Text style={styles.rankingText}>{item.text}</Text>
                    <View style={styles.dragHandle}>
                      <MaterialIcons name="drag-handle" size={24} color="#8B7355" />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Move Up/Down Buttons */}
                  <View style={styles.moveButtons}>
                    <TouchableOpacity
                      style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                      onPress={() => index > 0 && moveItem(index, index - 1)}
                      disabled={index === 0}
                    >
                      <MaterialIcons name="keyboard-arrow-up" size={20} color={index === 0 ? "#D1C4B8" : "#7C3AED"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.moveButton, index === rankingItems.length - 1 && styles.moveButtonDisabled]}
                      onPress={() => index < rankingItems.length - 1 && moveItem(index, index + 1)}
                      disabled={index === rankingItems.length - 1}
                    >
                      <MaterialIcons name="keyboard-arrow-down" size={20} color={index === rankingItems.length - 1 ? "#D1C4B8" : "#7C3AED"} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                onPress={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <MaterialIcons name="arrow-back" size={20} color={currentQuestionIndex === 0 ? "#D1C4B8" : "#7C3AED"} />
                <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              {currentQuestionIndex < questions.length - 1 ? (
                <TouchableOpacity
                  style={[styles.nextButton, !canSubmit() && styles.nextButtonDisabled]}
                  onPress={handleSubmitRanking}
                  disabled={!canSubmit()}
                >
                  <Text style={[styles.nextButtonText, !canSubmit() && styles.nextButtonTextDisabled]}>
                    Next Question
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color={!canSubmit() ? "#D1C4B8" : "#FFFFFF"} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.nextButton, !canSubmit() && styles.nextButtonDisabled]}
                  onPress={handleSubmitRanking}
                  disabled={!canSubmit()}
                >
                  <Text style={[styles.nextButtonText, !canSubmit() && styles.nextButtonTextDisabled]}>
                    Complete Ranking
                  </Text>
                  <MaterialIcons name="check" size={20} color={!canSubmit() ? "#D1C4B8" : "#FFFFFF"} />
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Test Button */}
            {answeredCount === questions.length && (
              <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>Submit Test</Text>
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Progress indicator */}
            {answeredCount < questions.length && (
              <View style={styles.progressIndicator}>
                <Text style={styles.progressIndicatorText}>
                  {questions.length - answeredCount} question sets remaining
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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
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
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  currentQuestionNumber: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#7C3AED',
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
    backgroundColor: '#F3F0FF',
    borderWidth: 2,
    borderColor: '#E8DDD1',
  },
  questionNavAnswered: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  questionNavCurrent: {
    borderColor: '#9333EA',
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
    color: '#7C3AED',
  },

  // Question Container
  questionContainer: {
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
  questionNumber: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  instructionBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  instructionBadgeText: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionTitle: {
    fontSize: isTablet ? 22 : 18,
    color: '#2A2A2A',
    lineHeight: isTablet ? 30 : 26,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  rankingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  rankingLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    fontWeight: '600',
  },

  // Ranking Items
  rankingContainer: {
    gap: 12,
    marginBottom: 32,
  },
  rankingItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 20 : 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rankNumber: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankNumberText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankingText: {
    flex: 1,
    fontSize: isTablet ? 16 : 14,
    color: '#2A2A2A',
    lineHeight: isTablet ? 22 : 20,
  },
  dragHandle: {
    padding: 8,
  },
  moveButtons: {
    marginLeft: 12,
    gap: 4,
  },
  moveButton: {
    width: isTablet ? 36 : 32,
    height: isTablet ? 36 : 32,
    borderRadius: isTablet ? 18 : 16,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  moveButtonDisabled: {
    opacity: 0.3,
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
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#D1C4B8',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 24 : 20,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  nextButtonDisabled: {
    backgroundColor: '#D1C4B8',
  },
  nextButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#8B7355',
  },

  // Submit Button
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
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
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginTop: 12,
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
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
});