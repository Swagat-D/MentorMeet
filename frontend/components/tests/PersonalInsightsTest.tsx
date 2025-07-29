// frontend/components/tests/PersonalInsightsTest.tsx - Professional Test Component
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
  'Teamwork', 'Adaptability', 'Initiative', 'Integrity', 'Perseverance',
  'Critical thinking', 'Organization', 'Patience', 'Innovation', 'Reliability',
  'Curiosity', 'Analytical thinking', 'Emotional intelligence', 'Motivation', 'Resilience'
];

const valuesOptions = [
  'Family', 'Success', 'Learning', 'Freedom', 'Security',
  'Adventure', 'Helping others', 'Recognition', 'Creativity', 'Balance',
  'Independence', 'Stability', 'Growth', 'Achievement', 'Relationships',
  'Justice', 'Health', 'Happiness', 'Peace', 'Excellence'
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
      title: 'List your top 3 character strengths',
      type: 'multiselect' as const,
      options: characterStrengthOptions,
      maxSelections: 3,
    },
    {
      id: 'valuesInLife',
      title: 'List top 3 things you value in your life',
      type: 'multiselect' as const,
      options: valuesOptions,
      maxSelections: 3,
    },
  ];

  const currentQuestionData = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  const handleTextChange = (value: string) => {
    setInsights(prev => ({
      ...prev,
      [currentQuestionData.id]: value
    }));
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

  const renderTextQuestion = () => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionTitle}>{currentQuestionData.title}</Text>
      
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
        <Text style={styles.questionTitle}>{currentQuestionData.title}</Text>
        
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
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check-circle" size={20} color="#DC2626" style={styles.checkIcon} />
                  )}
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
      <LinearGradient colors={['#fefbf3', '#f8f6f0']} style={styles.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#4a3728" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Personal Insights</Text>
          <Text style={styles.headerSubtitle}>Question {currentQuestion + 1} of {questions.length}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{currentQuestion + 1} of {questions.length}</Text>
          <Text style={styles.progressPercent}>{Math.round(progressPercentage)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.questionCard}>
          {currentQuestionData.type === 'text' ? renderTextQuestion() : renderMultiSelectQuestion()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
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
            color={currentQuestion === 0 ? "#D1C4B8" : "#8B4513"} 
          />
          <Text style={[
            styles.navButtonText,
            currentQuestion === 0 && styles.navButtonTextDisabled
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 100, 0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8b7355',
    marginTop: 2,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 134, 100, 0.1)',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#8b7355',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a3728',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 100, 0.1)',
    shadowColor: '#8b7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionContainer: {
    gap: 20,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a3728',
    lineHeight: 28,
    textAlign: 'center',
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: (width - 108) / 2,
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
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
  checkIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(184, 134, 100, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 90, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 60, 0.3)',
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
});