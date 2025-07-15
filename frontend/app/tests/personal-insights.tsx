// frontend/app/tests/personal-insights.tsx - Personal Insights Test Main Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface PersonalInsights {
  whatYouLike: string;
  whatYouAreGoodAt: string;
  recentProjects: string;
  characterStrengths: string[];
  valuesInLife: string[];
}

const characterStrengthOptions = [
  'Honesty', 'Creativity', 'Perseverance', 'Kindness', 'Leadership',
  'Teamwork', 'Curiosity', 'Bravery', 'Self-Regulation', 'Social Intelligence',
  'Gratitude', 'Hope', 'Humor', 'Love of Learning', 'Prudence',
  'Fairness', 'Forgiveness', 'Humility', 'Zest', 'Appreciation of Beauty'
];

const valueOptions = [
  'Family', 'Career Success', 'Health', 'Financial Security', 'Friendship',
  'Adventure', 'Learning', 'Helping Others', 'Independence', 'Creativity',
  'Spirituality', 'Recognition', 'Peace', 'Achievement', 'Love',
  'Fun', 'Stability', 'Freedom', 'Excellence', 'Authenticity'
];

export default function PersonalInsights() {
  const [insights, setInsights] = useState<PersonalInsights>({
    whatYouLike: '',
    whatYouAreGoodAt: '',
    recentProjects: '',
    characterStrengths: [],
    valuesInLife: [],
  });
  
  const [currentSection, setCurrentSection] = useState(0);
  const [startTime] = useState<Date>(new Date());

  const sections = [
    { title: 'What You Like', key: 'whatYouLike' as keyof PersonalInsights },
    { title: 'What You\'re Good At', key: 'whatYouAreGoodAt' as keyof PersonalInsights },
    { title: 'Recent Projects', key: 'recentProjects' as keyof PersonalInsights },
    { title: 'Character Strengths', key: 'characterStrengths' as keyof PersonalInsights },
    { title: 'Values in Life', key: 'valuesInLife' as keyof PersonalInsights },
  ];

  const handleTextChange = (key: keyof PersonalInsights, value: string) => {
    setInsights(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayToggle = (key: 'characterStrengths' | 'valuesInLife', value: string) => {
    setInsights(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const canProceed = () => {
    switch (currentSection) {
      case 0: return insights.whatYouLike.trim().length >= 10;
      case 1: return insights.whatYouAreGoodAt.trim().length >= 10;
      case 2: return insights.recentProjects.trim().length >= 10;
      case 3: return insights.characterStrengths.length >= 3;
      case 4: return insights.valuesInLife.length >= 3;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const timeSpent = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      
      console.log('📝 Submitting Personal Insights:', insights);
      
      // Here you would submit to backend
      // await psychometricService.submitPersonalInsights(insights, timeSpent);
      
      // Navigate to results or back to main test page
      router.push('/psychometric-test');
      
    } catch (error) {
      console.error('❌ Error submitting Personal Insights:', error);
    }
  };

  const renderTextInput = (key: keyof PersonalInsights, placeholder: string, hint: string) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputTitle}>{sections[currentSection].title}</Text>
      <Text style={styles.inputHint}>{hint}</Text>
      <TextInput
        style={styles.textInput}
        value={insights[key] as string}
        onChangeText={(value) => handleTextChange(key, value)}
        placeholder={placeholder}
        placeholderTextColor="#8B7355"
        multiline
        numberOfLines={6}
        maxLength={500}
        textAlignVertical="top"
      />
      <Text style={styles.characterCount}>
        {(insights[key] as string).length}/500 characters
        {(insights[key] as string).length < 10 && (
          <Text style={styles.minimumText}> (minimum 10 characters)</Text>
        )}
      </Text>
    </View>
  );

  const renderMultiSelect = (
    key: 'characterStrengths' | 'valuesInLife',
    options: string[],
    title: string,
    description: string
  ) => (
    <View style={styles.multiSelectSection}>
      <Text style={styles.multiSelectTitle}>{title}</Text>
      <Text style={styles.multiSelectDescription}>{description}</Text>
      <Text style={styles.selectionCount}>
        Selected: {insights[key].length} (minimum 3 required)
      </Text>
      
      <View style={styles.optionsGrid}>
        {options.map((option, index) => {
          const isSelected = insights[key].includes(option);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                isSelected && styles.optionItemSelected
              ]}
              onPress={() => handleArrayToggle(key, option)}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {option}
              </Text>
              {isSelected && (
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderTextInput(
          'whatYouLike',
          'Describe what you enjoy doing in your free time...',
          'Think about your hobbies, interests, activities you find engaging, subjects you love to learn about, or things that make you excited.'
        );
      case 1:
        return renderTextInput(
          'whatYouAreGoodAt',
          'Describe your strengths and skills...',
          'Consider your natural talents, skills you\'ve developed, areas where others often seek your help, or things people compliment you on.'
        );
      case 2:
        return renderTextInput(
          'recentProjects',
          'Describe recent projects or initiatives you\'ve undertaken...',
          'Include school projects, work assignments, personal initiatives, volunteer work, or any significant activities you\'ve been involved in recently.'
        );
      case 3:
        return renderMultiSelect(
          'characterStrengths',
          characterStrengthOptions,
          'Select Your Top Character Strengths',
          'Choose at least 3 character strengths that best describe you. Think about what others would say are your strongest personality traits.'
        );
      case 4:
        return renderMultiSelect(
          'valuesInLife',
          valueOptions,
          'Select Your Top Life Values',
          'Choose at least 3 values that are most important to you in life. Consider what drives your decisions and what you prioritize.'
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Insights</Text>
          <Text style={styles.headerSubtitle}>Section D - More About Yourself</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            Section {currentSection + 1} of {sections.length}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(((currentSection + 1) / sections.length) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentSection + 1) / sections.length) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.progressDots}>
          {sections.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentSection && styles.progressDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {renderCurrentSection()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentSection === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentSection === 0}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={20} 
              color={currentSection === 0 ? "#D1C4B8" : "#DC2626"} 
            />
            <Text style={[
              styles.navButtonText, 
              currentSection === 0 && styles.navButtonTextDisabled
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          {currentSection < sections.length - 1 ? (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={[
                styles.nextButtonText,
                !canProceed() && styles.nextButtonTextDisabled
              ]}>
                Next Section
              </Text>
              <MaterialIcons 
                name="arrow-forward" 
                size={20} 
                color={!canProceed() ? "#D1C4B8" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, !canProceed() && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canProceed()}
            >
              <LinearGradient 
                colors={canProceed() ? ['#DC2626', '#EF4444'] : ['#D1C4B8', '#D1C4B8']} 
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Complete Assessment</Text>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  
  // Fixed Header
  header: {
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
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
  },
  
  // Progress Section
  progressSection: {
    backgroundColor: '#FFFFFF',
    padding: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  progressPercentage: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8DDD1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: isTablet ? 12 : 10,
    height: isTablet ? 12 : 10,
    borderRadius: isTablet ? 6 : 5,
    backgroundColor: '#E8DDD1',
  },
  progressDotActive: {
    backgroundColor: '#DC2626',
  },
  
  // Content
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? 32 : 20,
  },
  
  // Text Input Section
  inputSection: {
    marginBottom: 24,
  },
  inputTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  inputHint: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 24 : 20,
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    fontSize: isTablet ? 17 : 16,
    color: '#2A2A2A',
    borderWidth: 2,
    borderColor: '#FECACA',
    minHeight: isTablet ? 160 : 140,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    marginTop: 8,
    textAlign: 'right',
  },
  minimumText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  
  // Multi Select Section
  multiSelectSection: {
    marginBottom: 24,
  },
  multiSelectTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  multiSelectDescription: {
    fontSize: isTablet ? 16 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 24 : 20,
    marginBottom: 16,
  },
  selectionCount: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FECACA',
    gap: 8,
  },
  optionItemSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  optionText: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  
  // Navigation
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: isTablet ? 32 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD1',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 24 : 20,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
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
    backgroundColor: '#DC2626',
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
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 14,
    paddingHorizontal: isTablet ? 32 : 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});