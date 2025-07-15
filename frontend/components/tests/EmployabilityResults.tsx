// frontend/components/tests/EmployabilityResults.tsx - Employability Results Component
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
import { stepsInfo } from '@/data/employabilityQuestions';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const isSmallScreen = width < 375;

interface EmployabilityScores {
  S: number;
  T: number;
  E: number;
  P: number;
  Speaking: number;
}

interface Props {
  results: {
    scores: EmployabilityScores;
    employabilityQuotient: number;
  };
  onBack: () => void;
}

export default function EmployabilityResults({ results, onBack }: Props) {
  const { scores, employabilityQuotient } = results;
  
  const sortedScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a);

  const getScoreLevel = (score: number) => {
    if (score >= 4.5) return { level: 'Excellent', color: '#10B981' };
    if (score >= 3.5) return { level: 'Good', color: '#59C875' };
    if (score >= 2.5) return { level: 'Average', color: '#F59E0B' };
    if (score >= 1.5) return { level: 'Below Average', color: '#FB923C' };
    return { level: 'Needs Improvement', color: '#EF4444' };
  };

  const getQuotientLevel = (quotient: number) => {
    if (quotient >= 8) return { level: 'Excellent', desc: 'Outstanding job readiness!', color: '#10B981' };
    if (quotient >= 6) return { level: 'Good', desc: 'Strong employability with room for growth', color: '#59C875' };
    if (quotient >= 4) return { level: 'Moderate', desc: 'Developing employability skills', color: '#F59E0B' };
    return { level: 'Needs Focus', desc: 'Significant improvement needed', color: '#EF4444' };
  };

  const getCategoryInfo = (category: string) => {
    return stepsInfo.find(info => info.category === category);
  };

  const getWeakAreas = () => {
    return Object.entries(scores)
      .filter(([, score]) => score < 3.5)
      .map(([category]) => getCategoryInfo(category))
      .filter(Boolean);
  };

  const getStrongAreas = () => {
    return Object.entries(scores)
      .filter(([, score]) => score >= 4)
      .map(([category]) => getCategoryInfo(category))
      .filter(Boolean);
  };

  const quotientInfo = getQuotientLevel(employabilityQuotient);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.resultsHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="close" size={24} color="#2A2A2A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.resultsTitle}>Employability Results</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.homeButton}>
          <MaterialIcons name="home" size={24} color="#2A2A2A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* Employability Quotient Display */}
        <LinearGradient colors={['#059669', '#10B981']} style={styles.quotientCard}>
          <MaterialIcons name="work" size={isTablet ? 60 : 48} color="#FFFFFF" />
          <Text style={styles.quotientTitle}>Your Employability Quotient</Text>
          <View style={styles.quotientDisplay}>
            <Text style={styles.quotientNumber}>{employabilityQuotient}</Text>
            <Text style={styles.quotientOutOf}>/10</Text>
          </View>
          <View style={[styles.quotientBadge, { backgroundColor: quotientInfo.color }]}>
            <Text style={styles.quotientLevel}>{quotientInfo.level}</Text>
          </View>
          <Text style={styles.quotientDescription}>{quotientInfo.desc}</Text>
        </LinearGradient>

        {/* Overall Assessment */}
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Overall Assessment</Text>
          <Text style={styles.assessmentText}>
            Your employability quotient of {employabilityQuotient}/10 indicates {quotientInfo.level.toLowerCase()} job readiness. 
            This assessment measures your current capabilities across the STEPS framework - key skills that employers value.
          </Text>
          
          {employabilityQuotient >= 7 ? (
            <View style={styles.positiveNote}>
              <MaterialIcons name="thumb-up" size={20} color="#10B981" />
              <Text style={styles.positiveText}>
                You demonstrate strong employability skills that make you an attractive candidate to employers.
              </Text>
            </View>
          ) : (
            <View style={styles.improvementNote}>
              <MaterialIcons name="trending-up" size={20} color="#F59E0B" />
              <Text style={styles.improvementText}>
                Focus on developing the areas highlighted below to enhance your job prospects.
              </Text>
            </View>
          )}
        </View>

        {/* Detailed STEPS Scores */}
        <View style={styles.scoresCard}>
          <Text style={styles.scoresTitle}>STEPS Skills Breakdown</Text>
          <Text style={styles.scoresSubtitle}>Your performance across the five key employability dimensions</Text>
          
          {sortedScores.map(([category, score], index) => {
            const categoryInfo = getCategoryInfo(category);
            const scoreInfo = getScoreLevel(score);
            
            if (!categoryInfo) return null;
            
            return (
              <View key={category} style={styles.scoreItem}>
                <View style={styles.scoreHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                    <Text style={styles.categoryIconText}>{category}</Text>
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={styles.categoryName}>{categoryInfo.name}</Text>
                    <Text style={styles.categoryDesc}>{categoryInfo.description}</Text>
                  </View>
                  <View style={styles.scoreValue}>
                    <Text style={styles.scoreNumber}>{score.toFixed(1)}</Text>
                    <Text style={[styles.scoreLevel, { color: scoreInfo.color }]}>
                      {scoreInfo.level}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.scoreBar}>
                  <View 
                    style={[
                      styles.scoreBarFill, 
                      { 
                        width: `${(score / 5) * 100}%`,
                        backgroundColor: scoreInfo.color 
                      }
                    ]} 
                  />
                </View>
                
                {index === 0 && (
                  <View style={styles.strengthBadge}>
                    <Text style={styles.strengthBadgeText}>Top Strength</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Strengths */}
        {getStrongAreas().length > 0 && (
          <View style={styles.strengthsCard}>
            <Text style={styles.strengthsTitle}>Your Key Strengths</Text>
            <Text style={styles.strengthsDesc}>
              These are your strongest employability skills that give you a competitive advantage:
            </Text>
            
            <View style={styles.strengthsList}>
              {getStrongAreas().map((area, index) =>
                area ? (
                  <View key={index} style={styles.strengthItem}>
                    <View style={[styles.strengthIcon, { backgroundColor: area.color }]}>
                      <MaterialIcons name="star" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.strengthContent}>
                      <Text style={styles.strengthName}>{area.name}</Text>
                      <Text style={styles.strengthImportance}>{area.importance}</Text>
                    </View>
                  </View>
                ) : null
              )}
            </View>
          </View>
        )}

        {/* Areas for Improvement */}
        {getWeakAreas().length > 0 && (
          <View style={styles.improvementCard}>
            <Text style={styles.improvementTitle}>Areas for Development</Text>
            <Text style={styles.improvementDesc}>
              Focus on these areas to significantly boost your employability:
            </Text>
            
            <View style={styles.improvementList}>
              {getWeakAreas().map((area, index) =>
                area ? (
                  <View key={index} style={styles.improvementItem}>
                    <View style={styles.improvementIcon}>
                      <MaterialIcons name="trending-up" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.improvementContent}>
                      <Text style={styles.improvementName}>{area.name}</Text>
                      <Text style={styles.improvementImportance}>{area.importance}</Text>
                      <View style={styles.skillsList}>
                        {area.skills.slice(0, 3).map((skill, idx) => (
                          <View key={idx} style={styles.skillTag}>
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null
              )}
            </View>
          </View>
        )}

        {/* Action Plan */}
        <View style={styles.actionPlanCard}>
          <Text style={styles.actionPlanTitle}>Your Development Action Plan</Text>
          <View style={styles.actionSteps}>
            <View style={styles.actionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Focus on Weak Areas</Text>
                <Text style={styles.stepDesc}>
                  Prioritize developing skills where you scored below 3.5, starting with the most important ones for your target career.
                </Text>
              </View>
            </View>
            
            <View style={styles.actionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Leverage Your Strengths</Text>
                <Text style={styles.stepDesc}>
                  Highlight your strong areas (4+ scores) in job applications and interviews to stand out from other candidates.
                </Text>
              </View>
            </View>
            
            <View style={styles.actionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Seek Practical Experience</Text>
                <Text style={styles.stepDesc}>
                  Find internships, projects, or volunteer opportunities that allow you to practice and demonstrate these skills.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Continue Your Journey</Text>
          <View style={styles.nextStepsList}>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="search" size={20} color="#059669" />
              <Text style={styles.nextStepText}>
                Find mentors who can help you develop weak areas on our platform
              </Text>
            </View>
            <View style={styles.nextStepItem}>
              <MaterialIcons name="psychology" size={20} color="#7C3AED" />
              <Text style={styles.nextStepText}>
                Take the Brain Profile test to understand your learning style
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
            <LinearGradient colors={['#059669', '#10B981']} style={styles.actionButtonGradient}>
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
    backgroundColor: '#F0FDF4',
    paddingTop: 0,
  },
  
  // Fixed Header
  resultsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: isTablet ? 32 : 20,
  paddingTop: isTablet ? 20 : 45, 
  paddingBottom: isTablet ? 20 : 16,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#BBF7D0',
  minHeight: isTablet ? 85 : 95,
  elevation: 2,
  shadowColor: '#059669',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
},
backButton: {
  padding: 8,
  borderRadius: 20,
  backgroundColor: '#F0FDF4',
  borderWidth: 1,
  borderColor: '#BBF7D0',
},
headerContent: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
resultsTitle: {
  fontSize: isTablet ? 24 : 18,
  fontWeight: 'bold',
  color: '#2A2A2A',
  textAlign: 'center',
},
homeButton: {
  padding: 8,
  borderRadius: 20,
  backgroundColor: '#F0FDF4',
  borderWidth: 1,
  borderColor: '#BBF7D0',
},
  resultsContainer: {
    flex: 1,
    padding: isTablet ? 32 : 16,
    paddingTop: isTablet ? 32 : 20,
  },

  // Employability Quotient Card
  quotientCard: {
    borderRadius: 16,
    padding: isTablet ? 40 : 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  quotientTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 20,
  },
  quotientDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  quotientNumber: {
    fontSize: isTablet ? 72 : 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quotientOutOf: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  quotientBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  quotientLevel: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quotientDescription: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  // Assessment Card
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  assessmentTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  assessmentText: {
    fontSize: isTablet ? 16 : 14,
    color: '#2A2A2A',
    lineHeight: isTablet ? 24 : 20,
    marginBottom: 16,
  },
  positiveNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: isTablet ? 16 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  positiveText: {
    fontSize: isTablet ? 15 : 14,
    color: '#065F46',
    marginLeft: 12,
    flex: 1,
    lineHeight: isTablet ? 22 : 20,
  },
  improvementNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: isTablet ? 16 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  improvementText: {
    fontSize: isTablet ? 15 : 14,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: isTablet ? 22 : 20,
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
    marginBottom: 8,
  },
  scoresSubtitle: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    marginBottom: 20,
  },
  scoreItem: {
    marginBottom: 24,
    position: 'relative',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: isTablet ? 13 : 12,
    color: '#8B7355',
    lineHeight: isTablet ? 18 : 16,
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  scoreLevel: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E8DDD1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthBadge: {
    position: 'absolute',
    top: -8,
    right: 0,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  strengthBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Strengths Card
  strengthsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  strengthsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  strengthsDesc: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 20,
  },
  strengthsList: {
    gap: 16,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  strengthIcon: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  strengthContent: {
    flex: 1,
  },
  strengthName: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  strengthImportance: {
    fontSize: isTablet ? 14 : 13,
    color: '#059669',
    lineHeight: isTablet ? 20 : 18,
  },

  // Improvement Card
  improvementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  improvementTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  improvementDesc: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
    marginBottom: 20,
  },
  improvementList: {
    gap: 16,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: isTablet ? 16 : 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  improvementIcon: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  improvementContent: {
    flex: 1,
  },
  improvementName: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  improvementImportance: {
    fontSize: isTablet ? 14 : 13,
    color: '#F59E0B',
    lineHeight: isTablet ? 20 : 18,
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  skillText: {
    fontSize: isTablet ? 12 : 11,
    fontWeight: '500',
    color: '#92400E',
  },

  // Action Plan Card
  actionPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isTablet ? 24 : 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DDD1',
  },
  actionPlanTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
  },
  actionSteps: {
    gap: 20,
  },
  actionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: isTablet ? 36 : 32,
    height: isTablet ? 36 : 32,
    borderRadius: isTablet ? 18 : 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: isTablet ? 17 : 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: isTablet ? 15 : 14,
    color: '#8B7355',
    lineHeight: isTablet ? 22 : 20,
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