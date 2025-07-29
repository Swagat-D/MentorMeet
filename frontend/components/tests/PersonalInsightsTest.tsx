// frontend/components/tests/PersonalInsightsTest.tsx - Updated to match Interest Inventory theme
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface PersonalInsights {
  whatYouLike: string;
  whatYouAreGoodAt: string;
  recentProjects: string;
  characterStrengths: string[];
  valuesInLife: string[];
}

interface Props {
  onSubmit: (insights: PersonalInsights) => void;
  onBack: () => void;
}

const characterStrengthOptions = [
  'Leadership', 'Creativity', 'Empathy', 'Communication', 'Problem-solving',
  'Teamwork', 'Adaptability', 'Integrity', 'Perseverance', 'Critical thinking',
  'Innovation', 'Resilience'
];


const valuesOptions = [
  'Family', 'Success', 'Learning', 'Freedom', 'Security',
  'Adventure', 'Helping others', 'Creativity', 'Independence', 'Achievement',
  'Health', 'Happiness'
];


export default function PersonalInsightsTest({ onSubmit, onBack }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [insights, setInsights] = useState<PersonalInsights>({
    whatYouLike: '',
    whatYouAreGoodAt: '',
    recentProjects: '',
    characterStrengths: [],
    valuesInLife: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const questions = [
    {
      id: 'whatYouLike',
      title: 'What do you like / enjoy doing?',
      placeholder: 'Describe activities, hobbies, or tasks that you find enjoyable...',
      type: 'text' as const,
      minLength: 10,
    },
    {
      id: 'whatYouAreGoodAt',
      title: 'What are you good at?',
      placeholder: 'Describe your skills, talents, and natural abilities...',
      type: 'text' as const,
      minLength: 10,
    },
    {
      id: 'recentProjects',
      title: 'Mention any projects or initiatives that you have taken in recent past',
      placeholder: 'Describe projects, achievements, or initiatives you have led or participated in...',
      type: 'text' as const,
      minLength: 10,
    },
    {
      id: 'characterStrengths',
      title: 'Select your top 3 character strengths',
      type: 'multiselect' as const,
      options: characterStrengthOptions,
      maxSelections: 3,
    },
    {
      id: 'valuesInLife',
      title: 'Select top 3 things you value in your life',
      type: 'multiselect' as const,
      options: valuesOptions,
      maxSelections: 3,
    },
  ];

  const currentQuestionData = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const handleTextChange = (value: string) => {
    setInsights(prev => ({
      ...prev,
      [currentQuestionData.id]: value
    }));

    // Animate on change
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleMultiSelectToggle = (option: string) => {
    const fieldName = currentQuestionData.id as 'characterStrengths' | 'valuesInLife';
    const currentSelections = insights[fieldName];
    const maxSelections = currentQuestionData.maxSelections || 3;

    if (currentSelections.includes(option)) {
      // Remove option
      setInsights(prev => ({
        ...prev,
        [fieldName]: currentSelections.filter(item => item !== option)
      }));
    } else if (currentSelections.length < maxSelections) {
      // Add option
      setInsights(prev => ({
        ...prev,
        [fieldName]: [...currentSelections, option]
      }));
    } else {
      Alert.alert('Selection Limit', `You can only select up to ${maxSelections} options.`);
    }

    // Animate selection
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const canProceed = () => {
    if (currentQuestionData.type === 'text') {
      const value = insights[currentQuestionData.id as keyof PersonalInsights] as string;
      return value.trim().length >= (currentQuestionData.minLength || 10);
    } else if (currentQuestionData.type === 'multiselect') {
      const selections = insights[currentQuestionData.id as 'characterStrengths' | 'valuesInLife'];
      return selections.length === (currentQuestionData.maxSelections || 3);
    }
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) {
      if (currentQuestionData.type === 'text') {
        Alert.alert('Incomplete Answer', `Please provide at least ${currentQuestionData.minLength} characters.`);
      } else {
        Alert.alert('Incomplete Selection', `Please select exactly ${currentQuestionData.maxSelections} options.`);
      }
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation
    const errors = [];
    
    if (insights.whatYouLike.trim().length < 10) errors.push('What you like');
    if (insights.whatYouAreGoodAt.trim().length < 10) errors.push('What you are good at');
    if (insights.recentProjects.trim().length < 10) errors.push('Recent projects');
    if (insights.characterStrengths.length !== 3) errors.push('Character strengths');
    if (insights.valuesInLife.length !== 3) errors.push('Life values');

    if (errors.length > 0) {
      Alert.alert('Incomplete Assessment', `Please complete: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(insights);
    } catch (error) {
      setIsSubmitting(false);
    }
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
              const isAnswered = currentQuestionData.type === 'text' 
                ? (insights[questions[index].id as keyof PersonalInsights] as string).length >= 10
                : (insights[questions[index].id as 'characterStrengths' | 'valuesInLife']).length === 3;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.gridQuestionItem,
                    isAnswered && styles.gridAnswered,
                    index === currentQuestion && styles.gridCurrent,
                  ]}
                  onPress={() => {
                    setCurrentQuestion(index);
                    setShowQuestionGrid(false);
                  }}
                >
                  <Text style={[
                    styles.gridQuestionText,
                    isAnswered && styles.gridQuestionTextAnswered,
                    index === currentQuestion && styles.gridQuestionTextCurrent,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.gridLegend}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#DC2626', borderWidth: 2, borderColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Current</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );

  const renderTextQuestion = () => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{currentQuestionData.title}</Text>
      
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={currentQuestionData.placeholder}
          placeholderTextColor="#8b7355"
          value={insights[currentQuestionData.id as keyof PersonalInsights] as string}
          onChangeText={handleTextChange}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {(insights[currentQuestionData.id as keyof PersonalInsights] as string).length} / 500 characters
        </Text>
      </View>

      <View style={styles.requirementNote}>
        <MaterialIcons name="info" size={16} color="#8b7355" />
        <Text style={styles.requirementText}>
          Minimum {currentQuestionData.minLength} characters required
        </Text>
      </View>
    </View>
  );

  const renderMultiSelectQuestion = () => {
    const fieldName = currentQuestionData.id as 'characterStrengths' | 'valuesInLife';
    const currentSelections = insights[fieldName];
    const options = currentQuestionData.options || [];

    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestionData.title}</Text>
        
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            Select exactly {currentQuestionData.maxSelections} options ({currentSelections.length}/{currentQuestionData.maxSelections} selected)
          </Text>
        </View>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsGrid}>
            {options.map((option, index) => {
              const isSelected = currentSelections.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected
                  ]}
                  onPress={() => handleMultiSelectToggle(option)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isSelected ? ['#DC2626', '#EF4444'] : ['#FEF2F2', '#FECACA']}
                    style={styles.optionGradient}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Matching Interest Inventory style */}
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Personal Insights</Text>
            <Text style={styles.headerSubtitle}>Question {currentQuestion + 1} of {questions.length}</Text>
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
            <Text style={styles.progressText}>{currentQuestion + 1} completed</Text>
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
          <Animated.View style={[styles.questionCard, { transform: [{ translateX: slideAnim }] }]}>
            {/* Question Header */}
            <View style={styles.questionHeader}>
              <View style={styles.questionNumberBadge}>
                <Text style={styles.questionNumberText}>Q{currentQuestion + 1}</Text>
              </View>
              
              <View style={styles.questionTypeBadge}>
                <MaterialIcons 
                  name={currentQuestionData.type === 'text' ? 'edit' : 'check-box'} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.questionTypeText}>
                  {currentQuestionData.type === 'text' ? 'Text' : 'Selection'}
                </Text>
              </View>
            </View>

            {/* Question Content */}
            {currentQuestionData.type === 'text' ? renderTextQuestion() : renderMultiSelectQuestion()}

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              {currentQuestionData.type === 'text' 
                ? 'Complete your answer and tap "Next" to continue'
                : 'Select your options and tap "Next" to continue'
              }
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation - Matching Interest Inventory style */}
        <View style={styles.bottomNavigation}>
          <View style={styles.navigationRow}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.previousButton,
                currentQuestion === 0 && styles.navButtonDisabled
              ]}
              onPress={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={20} 
                color={currentQuestion === 0 ? "#D1C4B8" : "#DC2626"} 
              />
              <Text style={[
                styles.navButtonText,
                currentQuestion === 0 && styles.navButtonTextDisabled
              ]}>
                Previous
              </Text>
            </TouchableOpacity>

            {/* Next/Submit Button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!canProceed() || isSubmitting}
            >
              <LinearGradient 
                colors={canProceed() ? ['#DC2626', '#EF4444'] : ['#D1C4B8', '#D1C4B8']} 
                style={styles.nextButtonGradient}
              >
                {isSubmitting ? (
                  <Text style={styles.nextButtonText}>Submitting...</Text>
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
                    </Text>
                    <MaterialIcons 
                      name={currentQuestion === questions.length - 1 ? "check" : "arrow-forward"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Progress Info */}
          <View style={styles.bottomProgressInfo}>
            <Text style={styles.bottomProgressText}>
              {questions.length - currentQuestion - 1} questions remaining
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
    backgroundColor: '#FEF2F2',
  },

  // Header - Matching Interest Inventory
  header: {
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
    paddingBottom: 120,
  },

  // Question Card - Matching Interest Inventory
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
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  questionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Question Content
  questionContainer: {
    gap: 20,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#2A2A2A',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 32,
  },

  // Text Input
  textInputContainer: {
    gap: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4a3728',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: '#8b7355',
    textAlign: 'right',
  },
  requirementNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderRadius: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#8b7355',
  },

  // Multi-select
  selectionInfo: {
    padding: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  optionsContainer: {
    maxHeight: 400,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: (width - 108) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  optionGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
    minHeight: 48,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a3728',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Instruction
  instructionText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },

  // Bottom Navigation - Matching Interest Inventory
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
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
    color: '#DC2626',
    marginLeft: 6,
  },
  navButtonTextDisabled: {
    color: '#D1C4B8',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  nextButtonText: {
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

  // Question Grid - Matching Interest Inventory
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
    backgroundColor: '#FEF2F2',
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
    width: (width - 84) / 5,
    height: (width - 84) / 5,
    borderRadius: ((width - 84) / 5) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    position: 'relative',
  },
  gridAnswered: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  gridCurrent: {
    borderWidth: 3,
    borderColor: '#EF4444',
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
   color: '#DC2626',
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