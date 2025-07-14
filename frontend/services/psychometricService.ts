// frontend/services/psychometricService.ts - Frontend Psychometric Test Service
import {apiRequest} from './api';

// Types matching backend interfaces
export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface BrainScores {
  L1: number;
  L2: number;
  R1: number;
  R2: number;
}

export interface StepsScores {
  S: number;
  T: number;
  E: number;
  P: number;
  Speaking: number;
}

export interface PersonalInsights {
  whatYouLike: string;
  whatYouAreGoodAt: string;
  recentProjects: string;
  characterStrengths: string[];
  valuesInLife: string[];
}

export interface TestResult {
  sectionId: string;
  sectionName: string;
  completedAt: string;
  timeSpent: number;
  responses: any;
  scores: RiasecScores | BrainScores | StepsScores;
  interpretation: string;
  recommendations: string[];
}

export interface AssessmentResults {
  hollandCode: string;
  dominantBrainQuadrants: string[];
  employabilityQuotient: number;
  overallInterpretation: string;
  careerRecommendations: string[];
  learningStyleRecommendations: string[];
  skillDevelopmentAreas: string[];
}

export interface PsychometricTest {
  testId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  completionPercentage: number;
  sectionsCompleted: {
    riasec: boolean;
    brainProfile: boolean;
    employability: boolean;
    personalInsights: boolean;
  };
  nextSection?: string;
  startedAt: string;
  completedAt?: string;
  totalTimeSpent: number;
  riasecResult?: TestResult;
  brainProfileResult?: TestResult;
  employabilityResult?: TestResult;
  personalInsightsResult?: {
    sectionId: string;
    sectionName: string;
    completedAt: string;
    responses: PersonalInsights;
  };
  overallResults?: AssessmentResults;
  isComplete?: boolean;
}

export interface TestHistory {
  testId: string;
  status: string;
  completionPercentage: number;
  startedAt: string;
  completedAt?: string;
  totalTimeSpent: number;
  hollandCode?: string;
  employabilityQuotient?: number;
}

export interface CareerRecommendations {
  hollandCode: string;
  careers: string[];
  industries: string[];
  totalRecommendations: number;
}

class PsychometricService {
  private baseUrl = '/api/v1/psychometric';

  /**
   * Get or create a new psychometric test
   */
  async getOrCreateTest(): Promise<PsychometricTest> {
    try {
      console.log('🧠 Getting/creating psychometric test...');
      
      const response = await apiRequest(`${this.baseUrl}/test`, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get test');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error getting psychometric test:', error);
      throw error;
    }
  }

  /**
   * Submit RIASEC section results
   */
  async submitRiasecResults(
    responses: { [questionId: string]: boolean },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('📝 Submitting RIASEC results...');
      
      const response = await apiRequest(`${this.baseUrl}/riasec`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit RIASEC results');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting RIASEC results:', error);
      throw error;
    }
  }

  /**
   * Submit Brain Profile section results
   */
  async submitBrainProfileResults(
    responses: { [questionId: string]: number[] },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('🧠 Submitting Brain Profile results...');
      
      const response = await apiRequest(`${this.baseUrl}/brain-profile`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Brain Profile results');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Brain Profile results:', error);
      throw error;
    }
  }

  /**
   * Submit Employability section results
   */
  async submitEmployabilityResults(
    responses: { [questionId: string]: number },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('💼 Submitting Employability results...');
      
      const response = await apiRequest(`${this.baseUrl}/employability`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Employability results');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Employability results:', error);
      throw error;
    }
  }

  /**
   * Submit Personal Insights section results
   */
  async submitPersonalInsights(
    insights: PersonalInsights,
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('📝 Submitting Personal Insights...');
      
      const response = await apiRequest(`${this.baseUrl}/personal-insights`, {
        method: 'POST',
        body: {
          ...insights,
          timeSpent
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Personal Insights');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Personal Insights:', error);
      throw error;
    }
  }

  /**
   * Get test results by ID or latest
   */
  async getTestResults(testId?: string): Promise<PsychometricTest> {
    try {
      console.log(`📊 Getting test results${testId ? ` for ${testId}` : ' (latest)'}...`);
      
      const url = testId 
        ? `${this.baseUrl}/results/${testId}`
        : `${this.baseUrl}/results`;
      
      const response = await apiRequest(url, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get test results');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error getting test results:', error);
      throw error;
    }
  }

  /**
   * Get user's test history
   */
  async getTestHistory(limit: number = 10): Promise<{tests: TestHistory[], total: number}> {
    try {
      console.log('📚 Getting test history...');
      
      const response = await apiRequest(`${this.baseUrl}/history?limit=${limit}`, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get test history');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error getting test history:', error);
      throw error;
    }
  }

  /**
   * Delete a test (restart functionality)
   */
  async deleteTest(testId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting test ${testId}...`);
      
      const response = await apiRequest(`${this.baseUrl}/test/${testId}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete test');
      }
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      throw error;
    }
  }

  /**
   * Validate section responses before submission
   */
  async validateSection(
    sectionType: 'riasec' | 'brainProfile' | 'employability' | 'personalInsights',
    responses: any
  ): Promise<{isValid: boolean, validationErrors: string[], responseCount: number}> {
    try {
      console.log(`✅ Validating ${sectionType} section...`);
      
      const response = await apiRequest(`${this.baseUrl}/validate-section`, {
        method: 'POST',
        body: {
          sectionType,
          responses
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to validate section');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error validating section:', error);
      throw error;
    }
  }

  /**
   * Get career recommendations for Holland Code
   */
  async getCareerRecommendations(hollandCode: string): Promise<CareerRecommendations> {
    try {
      console.log(`💼 Getting career recommendations for ${hollandCode}...`);
      
      const response = await apiRequest(`${this.baseUrl}/career-recommendations/${hollandCode}`, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get career recommendations');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error getting career recommendations:', error);
      throw error;
    }
  }

  /**
   * Save progress for auto-save functionality
   */
  async saveProgress(
    sectionType: 'riasec' | 'brainProfile' | 'employability' | 'personalInsights',
    responses: any,
    currentQuestionIndex?: number
  ): Promise<void> {
    try {
      console.log(`💾 Auto-saving progress for ${sectionType}...`);
      
      const response = await apiRequest(`${this.baseUrl}/save-progress`, {
        method: 'POST',
        body: {
          sectionType,
          responses,
          currentQuestionIndex
        }
      });

      if (!response.success) {
        console.warn('⚠️ Failed to auto-save progress:', response.message);
        // Don't throw error for auto-save failures
      }
    } catch (error) {
      console.warn('⚠️ Error auto-saving progress:', error);
      // Don't throw error for auto-save failures
    }
  }

  /**
   * Calculate local RIASEC scores (for immediate feedback)
   */
  calculateRiasecScores(responses: { [questionId: string]: boolean }): RiasecScores {
    const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Question mapping based on your document
    const questionTagMapping: { [questionId: string]: keyof RiasecScores } = {
      '1': 'I', '2': 'C', '3': 'A', '4': 'A', '5': 'C', '6': 'E', '7': 'A', '8': 'E',
      '9': 'A', '10': 'E', '11': 'R', '12': 'E', '13': 'I', '14': 'S', '15': 'R',
      '16': 'C', '17': 'C', '18': 'R', '19': 'C', '20': 'I', '21': 'I', '22': 'E',
      '23': 'S', '24': 'I', '25': 'S', '26': 'R', '27': 'S', '28': 'S', '29': 'R',
      '30': 'A', '31': 'R', '32': 'C', '33': 'E', '34': 'S', '35': 'I', '36': 'A',
      '37': 'C', '38': 'S', '39': 'A', '40': 'E', '41': 'S', '42': 'I', '43': 'R',
      '44': 'C', '45': 'R', '46': 'E', '47': 'S', '48': 'E', '49': 'A', '50': 'C',
      '51': 'I', '52': 'I', '53': 'A', '54': 'R'
    };

    Object.entries(responses).forEach(([questionId, answer]) => {
      if (answer === true) { // Only count "Yes" answers
        const tag = questionTagMapping[questionId];
        if (tag) {
          scores[tag]++;
        }
      }
    });

    return scores;
  }

  /**
   * Get Holland Code from RIASEC scores
   */
  getHollandCode(scores: RiasecScores): string {
    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([letter]) => letter)
      .join('');
  }

  /**
   * Get RIASEC interpretation
   */
  getRiasecInterpretation(letter: keyof RiasecScores): {name: string, description: string, color: string} {
    const interpretations = {
      R: { 
        name: 'Realistic (Doers)', 
        description: 'You prefer hands-on work and practical activities',
        color: '#059669'
      },
      I: { 
        name: 'Investigative (Thinkers)', 
        description: 'You enjoy research, analysis, and intellectual challenges',
        color: '#7C3AED'
      },
      A: { 
        name: 'Artistic (Creators)', 
        description: 'You are drawn to creative and expressive activities',
        color: '#DC2626'
      },
      S: { 
        name: 'Social (Helpers)', 
        description: 'You like working with and helping people',
        color: '#F59E0B'
      },
      E: { 
        name: 'Enterprising (Persuaders)', 
        description: 'You enjoy leadership and business activities',
        color: '#0EA5E9'
      },
      C: { 
        name: 'Conventional (Organizers)', 
        description: 'You prefer structured, detail-oriented work',
        color: '#8B4513'
      },
    };

    return interpretations[letter];
  }
}

// Export singleton instance
export const psychometricService = new PsychometricService();
export default psychometricService;