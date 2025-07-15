// frontend/components/tests/InterestInventoryResults.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { RiasecScores, CareerRecommendations } from '../../services/psychometricService';
import psychometricService from '../../services/psychometricService';

interface Props {
  results: RiasecScores;
  testData: any;
  onBack: () => void;
}

export default function InterestInventoryResults({ results, testData, onBack }: Props) {

  console.log('🔍 InterestInventoryResults received:', { results, testData });
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendations | null>(null);
  const [loadingCareers, setLoadingCareers] = useState(true);

  const sortedResults = Object.entries(results)
    .sort(([,a], [,b]) => b - a);
  const hollandCode = sortedResults.slice(0, 3).map(([letter]) => letter).join('');
  const total: number = Object.values(results).reduce((sum: number, score) => sum + (typeof score === 'number' ? score : 0), 0);

  const riasecDescriptions = {
    R: { name: 'Realistic (Doers)', desc: 'You prefer hands-on work and practical activities', color: '#059669' },
    I: { name: 'Investigative (Thinkers)', desc: 'You enjoy research, analysis, and intellectual challenges', color: '#7C3AED' },
    A: { name: 'Artistic (Creators)', desc: 'You are drawn to creative and expressive activities', color: '#DC2626' },
    S: { name: 'Social (Helpers)', desc: 'You like working with and helping people', color: '#F59E0B' },
    E: { name: 'Enterprising (Persuaders)', desc: 'You enjoy leadership and business activities', color: '#0EA5E9' },
    C: { name: 'Conventional (Organizers)', desc: 'You prefer structured, detail-oriented work', color: '#8B4513' },
  };

useEffect(() => {
  const fetchCareerRecommendations = async () => {
    try {
      setLoadingCareers(true);
      const careers = await psychometricService.getCareerRecommendations(hollandCode);
      setCareerRecommendations(careers);
    } catch (error) {
      console.error('Error fetching career recommendations:', error);
      // Show fallback recommendations
      setCareerRecommendations({
        hollandCode,
        careers: ['General Career Exploration', 'Skills Development', 'Professional Networking'],
        industries: ['Technology', 'Healthcare', 'Education'],
        totalRecommendations: 3
      });
    } finally {
      setLoadingCareers(false);
    }
  };

  if (hollandCode) {
    fetchCareerRecommendations();
  }
}, [hollandCode]);

  const getScorePercentage = (score: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const getInterpretation = () => {
    const topThree = sortedResults.slice(0, 3);
    const primaryType = riasecDescriptions[topThree[0][0] as keyof typeof riasecDescriptions];
    
    return `Your strongest interest area is ${primaryType.name.toLowerCase()}, which means ${primaryType.desc.toLowerCase()}. Your Holland Code ${hollandCode} represents a unique combination of interests that can guide your career choices.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={onBack}>
          <MaterialIcons name="close" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <Text style={styles.resultsTitle}>Your RIASEC Results</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')}>
          <MaterialIcons name="home" size={24} color="#2A2A2A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* Holland Code Display */}
        <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.hollandCodeCard}>
          <MaterialIcons name="psychology" size={48} color="#FFFFFF" />
          <Text style={styles.hollandCodeTitle}>Your Holland Code</Text>
          <Text style={styles.hollandCodeText}>{hollandCode}</Text>
          <Text style={styles.hollandCodeDesc}>
            This represents your top 3 career interest areas
          </Text>
        </LinearGradient>

        {/* Interpretation */}
        <View style={styles.interpretationCard}>
          <Text style={styles.interpretationTitle}>What This Means</Text>
          <Text style={styles.interpretationText}>{getInterpretation()}</Text>
        </View>

        {/* Detailed Scores */}
        <View style={styles.scoresCard}>
          <Text style={styles.scoresTitle}>Detailed Interest Scores</Text>
          {sortedResults.map(([letter, score], index) => {
            const info = riasecDescriptions[letter as keyof typeof riasecDescriptions];
            const percentage = getScorePercentage(score as number);
            
            return (
              <View key={letter} style={styles.scoreItem}>
                <View style={styles.scoreHeader}>
                  <View style={[styles.scoreLetter, { backgroundColor: info.color }]}>
                    <Text style={styles.scoreLetterText}>{letter}</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scoreName}>{info.name}</Text>
                    <Text style={styles.scoreDesc}>{info.desc}</Text>
                  </View>
                  <View style={styles.scoreValue}>
                    <Text style={styles.scoreNumber}>{String(score)}</Text>
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
                {index < 3 && (
                  <View style={styles.topThreeBadge}>
                    <Text style={styles.topThreeBadgeText}>Top {index + 1}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Career Recommendations */}
        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>Career Recommendations</Text>
          <Text style={styles.recommendationsDesc}>
            Based on your Holland Code {hollandCode}, here are careers that align with your interests:
          </Text>
          
          {loadingCareers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B4513" />
              <Text style={styles.loadingText}>Loading recommendations...</Text>
            </View>
          ) : careerRecommendations ? (
            <>
              <View style={styles.careersList}>
                {careerRecommendations.careers.map((career: string, index: number) => (
                  <View key={index} style={styles.careerItem}>
                    <MaterialIcons name="work" size={20} color="#8B4513" />
                    <Text style={styles.careerText}>{career}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.industriesSection}>
                <Text style={styles.industriesTitle}>Recommended Industries</Text>
                <View style={styles.industriesList}>
                  {careerRecommendations.industries.map((industry: string, index: number) => (
                    <View key={index} style={styles.industryTag}>
                      <Text style={styles.industryText}>{industry}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>Unable to load career recommendations</Text>
          )}
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          <View style={styles.nextStepsList}>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="search" size={20} color="#8B4513" />
              <Text style={styles.nextStepText}>
                Explore mentors in your interest areas on our platform
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="psychology" size={20} color="#7C3AED" />
              <Text style={styles.nextStepText}>
                Take the Brain Profile test to understand your learning style
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="work" size={20} color="#059669" />
              <Text style={styles.nextStepText}>
                Complete the Employability assessment for job readiness insights
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
            <LinearGradient colors={['#8B4513', '#A0522D']} style={styles.actionButtonGradient}>
              <MaterialIcons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Find Mentors</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/psychometric-test')}
          >
            <LinearGradient colors={['#7C3AED', '#9333EA']} style={styles.actionButtonGradient}>
              <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Continue Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/')}
          >
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
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
    backgroundColor: '#F8F3EE',
  },
  
  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD1',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },

  // Holland Code Card
  hollandCodeCard: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  hollandCodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  hollandCodeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 6,
  },
  hollandCodeDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  // Interpretation Card
  interpretationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  interpretationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  interpretationText: {
    fontSize: 16,
    color: '#2A2A2A',
    lineHeight: 24,
  },

  // Scores Card
  scoresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  scoresTitle: {
    fontSize: 18,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scoreLetterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  scoreDesc: {
    fontSize: 12,
    color: '#8B7355',
    lineHeight: 16,
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  scorePercent: {
    fontSize: 12,
    color: '#8B7355',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E8DDD1',
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 52,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  topThreeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topThreeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Recommendations Card
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  recommendationsDesc: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    paddingVertical: 20,
  },
  careersList: {
    marginBottom: 20,
  },
  careerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F3EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DDD1',
    marginBottom: 8,
  },
  careerText: {
    fontSize: 14,
    color: '#2A2A2A',
    marginLeft: 12,
    fontWeight: '500',
  },
  industriesSection: {
    marginTop: 16,
  },
  industriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  industriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  industryTag: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  industryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Next Steps Card
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  nextStepsTitle: {
    fontSize: 18,
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
    fontSize: 14,
    color: '#2A2A2A',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  bottomPadding: {
    height: 40,
  },
});