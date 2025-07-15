// frontend/components/tests/BrainProfileTest.tsx - Complete Enhanced Drag & Drop
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView,PanGestureHandler,State, } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrainProfileQuestion } from '@/data/brainProfileQuestions';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

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
  quadrant: string;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
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
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const colors = ['#7C3AED', '#059669', '#F59E0B', '#DC2626'];
  const quadrantLabels = ['L1', 'L2', 'R1', 'R2'];
  const itemHeight = 90; // Fixed height for calculations

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  useEffect(() => {
    // Initialize or restore ranking for current question
    const existingRanking = answers[currentQuestion.id];
    
    const items: RankingItem[] = [
      { 
        id: 'L1', 
        text: currentQuestion.statements.L1, 
        rank: 4, 
        color: colors[0],
        quadrant: 'L1 (Analyst)',
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1)
      },
      { 
        id: 'L2', 
        text: currentQuestion.statements.L2, 
        rank: 3, 
        color: colors[1],
        quadrant: 'L2 (Organizer)',
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1)
      },
      { 
        id: 'R1', 
        text: currentQuestion.statements.R1, 
        rank: 2, 
        color: colors[2],
        quadrant: 'R1 (Strategist)',
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1)
      },
      { 
        id: 'R2', 
        text: currentQuestion.statements.R2, 
        rank: 1, 
        color: colors[3],
        quadrant: 'R2 (Socializer)',
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1)
      },
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

  const onGestureEvent = (event: any, itemId: string) => {
    const item = rankingItems.find(i => i.id === itemId);
    if (item && isDragging) {
      item.translateY.setValue(event.nativeEvent.translationY);
    }
  };

  const onHandlerStateChange = (event: any, itemId: string) => {
    const { state, translationY } = event.nativeEvent;
    const item = rankingItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (state === State.BEGAN) {
      setIsDragging(true);
      setDraggedItemId(itemId);
      
      // Animate drag start - scale up and reduce opacity
      Animated.parallel([
        Animated.spring(item.scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }),
        Animated.spring(item.opacity, {
          toValue: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    if (state === State.END || state === State.CANCELLED) {
      setIsDragging(false);
      setDraggedItemId(null);
      
      // Calculate new position based on drag distance
      const currentIndex = rankingItems.findIndex(i => i.id === itemId);
      const moveThreshold = itemHeight / 2;
      let newIndex = currentIndex;
      
      if (translationY > moveThreshold && currentIndex < rankingItems.length - 1) {
        newIndex = currentIndex + 1;
      } else if (translationY < -moveThreshold && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
      
      // Animate back to position
      Animated.parallel([
        Animated.spring(item.translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(item.scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(item.opacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reorder if position changed
      if (newIndex !== currentIndex) {
        reorderItems(itemId, newIndex);
      }
    }
  };

  const reorderItems = (draggedItemId: string, newIndex: number) => {
    const newItems = [...rankingItems];
    const draggedIndex = newItems.findIndex(item => item.id === draggedItemId);
    
    // Remove dragged item from its current position
    const [movedItem] = newItems.splice(draggedIndex, 1);
    // Insert it at the new position
    newItems.splice(newIndex, 0, movedItem);
    
    // Update ranks (4 = Most like me, 1 = Least like me)
    newItems.forEach((item, index) => {
      item.rank = 4 - index;
    });
    
    setRankingItems(newItems);
  };

  const handleSaveAndNext = () => {
    // Convert ranking to array format expected by backend [L1, L2, R1, R2]
    const rankings = [0, 0, 0, 0];
    rankingItems.forEach(item => {
      const quadrantIndex = quadrantLabels.indexOf(item.id);
      rankings[quadrantIndex] = item.rank;
    });

    onRankingSubmit(rankings);

    // Move to next question if not the last one
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    }
  };

  const canSaveAndNext = () => {
    const ranks = rankingItems.map(item => item.rank);
    return ranks.includes(4) && ranks.includes(3) && ranks.includes(2) && ranks.includes(1);
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
            {questions.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.gridQuestionItem,
                  answers[questions[index].id] && styles.gridAnswered,
                  index === currentQuestionIndex && styles.gridCurrent,
                ]}
                onPress={() => {
                  onNavigateToQuestion(index);
                  setShowQuestionGrid(false);
                }}
              >
                <Text style={[
                  styles.gridQuestionText,
                  answers[questions[index].id] && styles.gridQuestionTextAnswered,
                  index === currentQuestionIndex && styles.gridQuestionTextCurrent,
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.gridLegend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#7C3AED' }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#7C3AED', borderWidth: 2, borderColor: '#9333EA' }]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Modern Mobile-First Header */}
        <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.testHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.testTitle}>Brain Profile Test</Text>
              <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowQuestionGrid(true)}
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

        {/* Main Content with ScrollView for responsiveness */}
        <View style={styles.questionContainer}>
          <ScrollView 
            style={styles.questionScrollView} 
            contentContainerStyle={styles.questionContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Card */}
            <View style={styles.questionCard}>
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumberText}>Set {currentQuestion.setNumber}</Text>
                </View>
                
                <View style={styles.instructionBadge}>
                  <MaterialIcons name="open-with" size={16} color="#FFFFFF" />
                  <Text style={styles.instructionBadgeText}>Drag to Rank</Text>
                </View>
              </View>

              {/* Question Title */}
              <View style={styles.questionTextContainer}>
                <Text style={styles.questionText}>
                  Drag to rank from "Most like me" to "Least like me"
                </Text>
                <Text style={styles.questionSubtext}>
                  Hold and drag statements to reorder them
                </Text>
              </View>

              {/* Ranking Labels */}
              <View style={styles.rankingLabels}>
                <View style={styles.rankingLabelItem}>
                  <View style={styles.rankingNumberBadge}>
                    <Text style={styles.rankingNumber}>4</Text>
                  </View>
                  <Text style={styles.rankingLabelText}>Most like me</Text>
                </View>
                <View style={styles.rankingLabelItem}>
                  <View style={[styles.rankingNumberBadge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.rankingNumber}>1</Text>
                  </View>
                  <Text style={styles.rankingLabelText}>Least like me</Text>
                </View>
              </View>

              {/* Enhanced Drag & Drop Container */}
              <View style={styles.rankingContainer}>
                {rankingItems.map((item, index) => (
                  <PanGestureHandler
                    key={item.id}
                    onGestureEvent={(event) => onGestureEvent(event, item.id)}
                    onHandlerStateChange={(event) => onHandlerStateChange(event, item.id)}
                  >
                    <Animated.View style={[
                      styles.rankingItem,
                      { 
                        borderLeftColor: item.color,
                        transform: [
                          { translateY: item.translateY },
                          { scale: item.scale }
                        ],
                        opacity: item.opacity,
                        zIndex: draggedItemId === item.id ? 1000 : 1,
                      },
                      draggedItemId === item.id && styles.rankingItemDragged
                    ]}>
                      <View style={[styles.rankNumber, { backgroundColor: item.color }]}>
                        <Text style={styles.rankNumberText}>{item.rank}</Text>
                      </View>
                      
                      <View style={styles.rankingContent}>
                        <Text style={styles.rankingText}>{item.text}</Text>
                        <Text style={styles.quadrantLabel}>{item.quadrant}</Text>
                      </View>
                      
                      <View style={styles.dragHandle}>
                        <MaterialIcons name="drag-indicator" size={24} color="#8B7355" />
                      </View>
                    </Animated.View>
                  </PanGestureHandler>
                ))}
              </View>

              {/* Instruction Text */}
              <Text style={styles.instructionText}>
                Hold and drag statements to reorder them, then tap "Save & Next"
              </Text>
            </View>
          </ScrollView>
        </View>

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
                color={currentQuestionIndex === 0 ? "#D1C4B8" : "#7C3AED"} 
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
                <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.submitGradient}>
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
                  colors={canSaveAndNext() ? ['#7C3AED', '#9333EA'] : ['#D1C4B8', '#D1C4B8']} 
                  style={styles.saveNextGradient}
                >
                  <Text style={styles.saveNextButtonText}>
                    {currentQuestionIndex === questions.length - 1 ? 'Save Ranking' : 'Save & Next'}
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
              {questions.length - answeredCount} question sets remaining
            </Text>
          </View>
        </View>

        {/* Question Grid Overlay */}
        {showQuestionGrid && renderQuestionGrid()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
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

  // Main Content - Responsive
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

  // Question Card - Responsive
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: isTablet ? 32 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minHeight: isTablet ? 600 : 500,
  },
  
  // Question Header
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumberBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  instructionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Question Text
  questionTextContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  questionText: {
    fontSize: isTablet ? 22 : 18,
    lineHeight: isTablet ? 30 : 26,
    color: '#2A2A2A',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  questionSubtext: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Ranking Labels
  rankingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  rankingLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankingNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankingLabelText: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    fontWeight: '600',
  },

  // Enhanced Ranking Container
  rankingContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 16,
    minHeight: 400,
  },

  // Enhanced Draggable Items with Better Visual Feedback
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 20 : 16,
    marginVertical: 8,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 90,
  },
  rankingItemDragged: {
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    backgroundColor: '#F8F9FA',
    borderColor: '#7C3AED',
    borderWidth: 2,
  },

  // Rank Number with Enhanced Design
  rankNumber: {
    width: isTablet ? 48 : 44,
    height: isTablet ? 48 : 44,
    borderRadius: isTablet ? 24 : 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  rankNumberText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Ranking Content
  rankingContent: {
    flex: 1,
    paddingRight: 12,
  },
  rankingText: {
    fontSize: isTablet ? 17 : 15,
    color: '#2A2A2A',
    lineHeight: isTablet ? 24 : 22,
    marginBottom: 6,
    fontWeight: '500',
  },
  quadrantLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // Enhanced Drag Handle
  dragHandle: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },

  // Instruction Text
  instructionText: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    paddingHorizontal: 16,
    lineHeight: isTablet ? 24 : 20,
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
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
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
    color: '#7C3AED',
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
    backgroundColor: '#F3F0FF',
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
    backgroundColor: '#F3F0FF',
    borderWidth: 2,
    borderColor: '#E8DDD1',
    position: 'relative',
  },
  gridAnswered: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  gridCurrent: {
    borderWidth: 3,
    borderColor: '#9333EA',
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
    color: '#7C3AED',
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