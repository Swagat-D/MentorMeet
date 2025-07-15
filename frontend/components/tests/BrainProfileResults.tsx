// frontend/components/tests/BrainProfileResults.tsx - Brain Profile Results Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { brainProfileInfo } from '@/data/brainProfileQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface BrainScores {
  L1: number;
  L2: number;
  R1: number;
  R2: number;
}

interface Props {
  results: BrainScores;
  onBack: () => void;
}

export default function BrainProfileResults({ results, onBack }: Props) {
  const sortedResults = Object.entries(results)
    .sort(([,a], [,b]) => b - a);
    
  const total = Object.values(results).reduce((sum, score) => sum + score, 0);
  const dominantQuadrants = sortedResults.slice(0, 2).map(([quadrant]) => quadrant);

  const getScorePercentage = (score: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const getQuadrantInfo = (quadrant: string) => {
    return brainProfileInfo.find(info => info.quadrant === quadrant);
  };

  const getInterpretation = () => {
    const primary = getQuadrantInfo(dominantQuadrants[0]);
    const secondary = getQuadrantInfo(dominantQuadrants[1]);
    
    if (!primary || !secondary) return '';
    
    return `Your brain profile shows a strong preference for ${primary.name.toLowerCase()} thinking (${getScorePercentage(results[dominantQuadrants[0] as keyof BrainScores])}%) combined with ${secondary.name.toLowerCase()} approaches (${getScorePercentage(results[dominantQuadrants[1] as keyof BrainScores])}%). This unique combination shapes how you process information, make decisions, and interact with the world.`;
  };

  const getLearningRecommendations = () => {
    const recommendations = [];
    
    if (dominantQuadrants.includes('L1')) {
      recommendations.push('Use logical frameworks and step-by-step approaches');
      recommendations.push('Focus on facts and data-driven learning');
    }
    if (dominantQuadrants.includes('L2')) {
      recommendations.push('Create structured study schedules and organized materials');
      recommendations.push('Break complex topics into detailed, sequential steps');
    }
    if (dominantQuadrants.includes('R1')) {
      recommendations.push('Engage in creative problem-solving and brainstorming');
      recommendations.push('Use visual aids, mind maps, and conceptual thinking');
    }
    if (dominantQuadrants.includes('R2')) {
      recommendations.push('Learn through group discussions and collaboration');
      recommendations.push('Seek mentors who provide emotional support and guidance');
    }
    
    return recommendations;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.resultsTitle}>Your Brain Profile</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#2A2A2A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* Dominant Quadrants Display */}
        <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.dominantQuadrantsCard}>
          <MaterialIcons name="psychology" size={isTablet ? 60 : 48} color="#FFFFFF" />
          <Text style={styles.dominantTitle}>Your Dominant Quadrants</Text>
          <View style={styles.dominantQuadrants}>
            {dominantQuadrants.map((quadrant, index) => {
              const info = getQuadrantInfo(quadrant);
              if (!info) return null;
              
              return (
                <View key={quadrant} style={styles.dominantQuadrant}>
                  <View style={[styles.dominantIcon, { backgroundColor: info.color }]}>
                    <Text style={styles.dominantIconText}>{quadrant}</Text>
                  </View>
                  <Text style={styles.dominantName}>{info.name}</Text>
                  <Text style={styles.dominantPercentage}>
                    {getScorePercentage(results[quadrant as keyof BrainScores])}%
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Interpretation */}
        <View style={styles.interpretationCard}>
          <Text style={styles.interpretationTitle}>What This Means</Text>
          <Text style={styles.interpretationText}>{getInterpretation()}</Text>
        </View>

        {/* Detailed Scores */}
        <View style={styles.scoresCard}>
          <Text style={styles.scoresTitle}>Brain Quadrant Scores</Text>
          {sortedResults.map(([quadrant, score], index) => {
            const info = getQuadrantInfo(quadrant);
            if (!info) return null;
            
            const percentage = getScorePercentage(score);
            
            return (
              <View key={quadrant} style={styles.scoreItem}>
                <View style={styles.scoreHeader}>
                  <View style={[styles.scoreLetter, { backgroundColor: info.color }]}>
                    <Text style={styles.scoreLetterText}>{quadrant}</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreName}>{info.name}</Text>
                    <Text style={styles.scoreDesc}>{info.description}</Text>
                  </View>
                  <View style={styles.scoreValue}>
                    <Text style={styles.scoreNumber}>{score}</Text>
                    <Text style={styles.scorePercent}>{percentage}%</Text>
                  </View>
                </View>
                <View style={styles.scoreBar}>
                  <View 
                    style={[
                      styles.scoreBarFill, 
                      { 
                        width: `${percentage}%`,
                        backgroundColor: info.color 
                      }
                    ]} 
                  />
                </View>
                {index < 2 && (
                  <View style={styles.dominantBadge}>
                    <Text style={styles.dominantBadgeText}>Dominant {index + 1}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Learning Style Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>Your Learning Style</Text>
          <Text style={styles.recommendationsDesc}>
            Based on your dominant brain quadrants, here are personalized learning recommendations:
          </Text>
          
          <View style={styles.learningList}>
            {getLearningRecommendations().map((recommendation, index) => (
              <View key={index} style={styles.learningItem}>
                <MaterialIcons name="lightbulb" size={20} color="#7C3AED" />
                <Text style={styles.learningText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Career Alignment */}
        <View style={styles.careerCard}>
          <Text style={styles.careerTitle}>Career Alignment</Text>
          <Text style={styles.careerDesc}>
            Your brain profile suggests you may thrive in careers that match your thinking preferences:
          </Text>
          
          <View style={styles.careerSections}>
            {dominantQuadrants.slice(0, 2).map(quadrant => {
              const info = getQuadrantInfo(quadrant);
              if (!info) return null;
              
              return (
                <View key={quadrant} style={styles.careerSection}>
                  <View style={styles.careerSectionHeader}>
                    <View style={[styles.careerIcon, { backgroundColor: info.color }]}>
                      <Text style={styles.careerIconText}>{quadrant}</Text>
                    </View>
                    <Text style={styles.careerSectionTitle}>{info.name}</Text>
                  </View>
                  <View style={styles.careerList}>
                    {info.careers.slice(0, 3).map((career, idx) => (
                      <View key={idx} style={styles.careerTag}>
                        <Text style={styles.careerTagText}>{career}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Traits Summary */}
        <View style={styles.traitsCard}>
          <Text style={styles.traitsTitle}>Your Key Traits</Text>
          <View style={styles.traitsGrid}>
            {dominantQuadrants.slice(0, 2).map(quadrant => {
              const info = getQuadrantInfo(quadrant);
              if (!info) return null;
              
              return info.traits.slice(0, 3).map((trait, idx) => (
                <View key={`${quadrant}-${idx}`} style={[styles.traitItem, { borderColor: info.color }]}>
                  <Text style={[styles.traitText, { color: info.color }]}>{trait}</Text>
                </View>
              ));
            }).flat()}
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          <View style={styles.nextStepsList}>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="search" size={20} color="#7C3AED" />
              <Text style={styles.nextStepText}>
                Find mentors who complement your thinking style on our platform
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="work" size={20} color="#059669" />
              <Text style={styles.nextStepText}>
                Take the Employability test to understand your job readiness
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="interests" size={20} color="#8B4513" />
              <Text style={styles.nextStepText}>
                Complete the Interest Inventory for career direction insights
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.actionButtonGradient}>
              <MaterialIcons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Find Mentors</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Continue Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.actionButtonGradient}>
              <MaterialIcons name="home" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F0FF',
  },
  
  // Fixed Header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingTop: isTablet ? 20 : 20,
    paddingBottom: isTablet ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
    minHeight: isTablet ? 85 : 75,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  homeButton: {
    padding: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: isTablet ? 32 : 20,
  },

  // Dominant Quadrants Card
  dominantQuadrantsCard: {
    borderRadius: 16,
    padding: isTablet ? 40 : 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  dominantTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },
  dominantQuadrants: {
    flexDirection: 'row',
    gap: isTablet ? 32 : 24,
  },
  dominantQuadrant: {
    alignItems: 'center',
  },
  dominantIcon: {
    width: isTablet ? 64 : 56,
    height: isTablet ? 64 : 56,
    borderRadius: isTablet ? 32 : 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dominantIconText: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dominantName: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  dominantPercentage: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Interpretation Card
  interpretationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  interpretationTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  interpretationText: {
    fontSize: isTablet ? 17 : 16,
    color: '#2A2A2A',
    lineHeight: isTablet ? 26 : 24,
  },

  // Scores Card
  scoresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  scoresTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  scoreItem: {
    marginBottom: 20,
    position: 'relative',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLetter: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scoreLetterText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreName: {
    fontSize: isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  scoreDesc: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
    lineHeight: isTablet ? 18 : 16,
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  scorePercent: {
    fontSize: isTablet ? 14 : 12,
    color: '#8B7355',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E8DDD1',
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: isTablet ? 60 : 52,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dominantBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dominantBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Recommendations Card
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  recommendationsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  recommendationsDesc: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 16,
  },
  learningList: {
    gap: 12,
  },
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: isTablet ? 16 : 12,
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  learningText: {
    fontSize: isTablet ? 15 : 14,
    color: '#2A2A2A',
    marginLeft: 12,
    flex: 1,
    lineHeight: isTablet ? 22 : 20,
  },

  // Career Card
  careerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  careerTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  careerDesc: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 20,
  },
  careerSections: {
    gap: 20,
  },
  careerSection: {
    borderRadius: 12,
    padding: isTablet ? 20 : 16,
    backgroundColor: '#F8F3EE',
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  careerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  careerIcon: {
    width: isTablet ? 36 : 32,
    height: isTablet ? 36 : 32,
    borderRadius: isTablet ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  careerIconText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  careerSectionTitle: {
    fontSize: isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  careerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careerTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  careerTagText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '500',
    color: '#2A2A2A',
  },

  // Traits Card
  traitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  traitsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  traitItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  traitText: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  nextStepsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  nextStepsList: {
    gap: 16,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextStepText: {
    fontSize: isTablet ? 15 : 14,
    color: '#2A2A2A',
    marginLeft: 12,
    flex: 1,
    lineHeight: isTablet ? 22 : 20,
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomPadding: {
    height: 40,
  },
});