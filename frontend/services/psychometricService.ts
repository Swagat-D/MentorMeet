// frontend/services/psychometricService.ts - Production-Ready Frontend Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

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
  progressData?: {
    currentQuestionIndex: number;
    partialResponses: { [key: string]: any };
  };
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
  private baseUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/psychometric`;
  private timeout = 30000; // 30 seconds
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected ?? false;
    } catch (error) {
      console.warn('⚠️ Failed to check network connectivity:', error);
      return false;
    }
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make authenticated request with retry logic and better error handling
   */
  private async makeAuthenticatedRequest(url: string, options: any = {}): Promise<any> {
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        console.log(`🚀 Request attempt ${attempt}/${this.retryAttempts} to: ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Response: ${response.status} ${response.statusText}`);

        // Get response text first for debugging
        const responseText = await response.text();
        
        if (response.status === 401) {
          // Clear invalid token
          await AsyncStorage.removeItem('access_token');
          throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok) {
          let errorMessage = `Server error: ${response.status}`;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            // Use status text if JSON parsing fails
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // Parse JSON response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON');
          throw new Error('Invalid response format from server');
        }

        if (!data.success) {
          throw new Error(data.message || 'Request failed');
        }

        return data;

      } catch (error: any) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          console.warn(`⏰ Request timeout on attempt ${attempt}`);
          if (attempt === this.retryAttempts) {
            throw new Error('Request timeout. Please check your connection and try again.');
          }
        } else if (error.message.includes('Network request failed') || 
                   error.message.includes('fetch')) {
          console.warn(`🌐 Network error on attempt ${attempt}:`, error.message);
          if (attempt === this.retryAttempts) {
            throw new Error('Network connection failed. Please check your internet connection.');
          }
        } else if (error.message.includes('Session expired') || 
                   error.message.includes('Authentication required')) {
          // Don't retry auth errors
          throw error;
        } else {
          console.warn(`❌ Request failed on attempt ${attempt}:`, error.message);
          if (attempt === this.retryAttempts) {
            throw error;
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Client-side validation for RIASEC responses
   */
  validateRiasecResponses(responses: { [questionId: string]: boolean }): {isValid: boolean, validationErrors: string[]} {
    const responseCount = Object.keys(responses).length;
    const validationErrors: string[] = [];
    
    if (responseCount !== 54) {
      validationErrors.push(`Need exactly 54 responses, got ${responseCount}`);
    }
    
    const hasInvalidResponses = Object.values(responses).some(val => typeof val !== 'boolean');
    if (hasInvalidResponses) {
      validationErrors.push('All responses must be true/false');
    }
    
    return {
      isValid: validationErrors.length === 0,
      validationErrors
    };
  }

  /**
   * Client-side validation for Brain Profile responses
   */
  validateBrainProfileResponses(responses: { [questionId: string]: number[] }): {isValid: boolean, validationErrors: string[]} {
    const responseCount = Object.keys(responses).length;
    const validationErrors: string[] = [];
    
    if (responseCount !== 10) {
      validationErrors.push(`Need exactly 10 responses, got ${responseCount}`);
    }
    
    const hasInvalidResponses = Object.values(responses).some(val => 
      !Array.isArray(val) || val.length !== 4 || val.some(v => typeof v !== 'number')
    );
    if (hasInvalidResponses) {
      validationErrors.push('All responses must be arrays of 4 numbers');
    }
    
    return {
      isValid: validationErrors.length === 0,
      validationErrors
    };
  }

  /**
   * Client-side validation for Employability responses
   */
  validateEmployabilityResponses(responses: { [questionId: string]: number }): {isValid: boolean, validationErrors: string[]} {
    const responseCount = Object.keys(responses).length;
    const validationErrors: string[] = [];
    
    if (responseCount !== 25) {
      validationErrors.push(`Need exactly 25 responses, got ${responseCount}`);
    }
    
    const hasInvalidResponses = Object.values(responses).some(val => 
      typeof val !== 'number' || val < 1 || val > 5
    );
    if (hasInvalidResponses) {
      validationErrors.push('All responses must be numbers between 1 and 5');
    }
    
    return {
      isValid: validationErrors.length === 0,
      validationErrors
    };
  }

  /**
   * Get or create a new psychometric test
   */
  async getOrCreateTest(): Promise<PsychometricTest> {
    try {
      console.log('🧠 Getting/creating psychometric test...');
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/user-test`, {
        method: 'GET',
      });

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
      console.log(`📊 Submitting ${Object.keys(responses).length} responses`);
      
      // Client-side validation first
      const validation = this.validateRiasecResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/riasec`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      console.log('✅ RIASEC submission successful');
      return response.data;
    } catch (error: any) {
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
      
      // Client-side validation
      const validation = this.validateBrainProfileResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/brain-profile`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      console.log('✅ Brain Profile submission successful');
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
      
      // Client-side validation
      const validation = this.validateEmployabilityResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/employability`, {
        method: 'POST',
        body: {
          responses,
          timeSpent
        }
      });

      console.log('✅ Employability submission successful');
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
      
      // Client-side validation
      if (!insights.whatYouLike || insights.whatYouLike.length < 10) {
        throw new Error('What you like must be at least 10 characters');
      }
      if (!insights.whatYouAreGoodAt || insights.whatYouAreGoodAt.length < 10) {
        throw new Error('What you are good at must be at least 10 characters');
      }
      if (!insights.recentProjects || insights.recentProjects.length < 10) {
        throw new Error('Recent projects must be at least 10 characters');
      }
      if (!Array.isArray(insights.characterStrengths) || insights.characterStrengths.length < 3) {
        throw new Error('At least 3 character strengths are required');
      }
      if (!Array.isArray(insights.valuesInLife) || insights.valuesInLife.length < 3) {
        throw new Error('At least 3 life values are required');
      }
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/personal-insights`, {
        method: 'POST',
        body: {
          ...insights,
          timeSpent
        }
      });

      console.log('✅ Personal Insights submission successful');
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
      
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'GET',
      });

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
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/history?limit=${limit}`, {
        method: 'GET',
      });

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
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/test/${testId}`, {
        method: 'DELETE',
      });

      console.log('✅ Test deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      throw error;
    }
  }

  /**
   * Get career recommendations for Holland Code
   */
  async getCareerRecommendations(hollandCode: string): Promise<CareerRecommendations> {
    try {
      console.log(`💼 Getting career recommendations for ${hollandCode}...`);
      
      // This endpoint doesn't require auth, but we'll add timeout and retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);
          
          const response = await fetch(`${this.baseUrl}/career-recommendations/${hollandCode}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Failed to get career recommendations: ${response.status}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.message || 'Failed to get career recommendations');
          }

          return data.data;
        } catch (error: any) {
          lastError = error;
          
          if (attempt < this.retryAttempts) {
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            await this.sleep(delay);
          }
        }
      }
      
      throw lastError || new Error('Failed to get career recommendations');
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
      
      // Use shorter timeout for auto-save
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/save-progress`, {
        method: 'POST',
        body: {
          sectionType,
          responses,
          currentQuestionIndex
        }
      });

      console.log('✅ Progress saved successfully');
    } catch (error) {
      console.warn('⚠️ Error auto-saving progress:', error);
      // Don't throw error for auto-save failures - it should be non-blocking
    }
  }

  /**
   * Validate section responses
   */
  async validateSection(
    sectionType: 'riasec' | 'brainProfile' | 'employability' | 'personalInsights',
    responses: any
  ): Promise<{isValid: boolean, validationErrors: string[], responseCount: number}> {
    try {
      console.log(`🔍 Validating ${sectionType} section...`);
      
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/validate-section`, {
        method: 'POST',
        body: {
          sectionType,
          responses
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error validating section:', error);
      // Return local validation result as fallback
      return {
        isValid: false,
        validationErrors: ['Validation service unavailable'],
        responseCount: Object.keys(responses).length
      };
    }
  }

  /**
   * Calculate local RIASEC scores (for immediate feedback)
   */
  calculateRiasecScores(responses: { [questionId: string]: boolean }): RiasecScores {
    const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Optimized mapping for faster lookup
    const mapping = new Map([
      ['1', 'I'], ['2', 'C'], ['3', 'A'], ['4', 'A'], ['5', 'C'], ['6', 'E'], ['7', 'A'], ['8', 'E'],
      ['9', 'A'], ['10', 'E'], ['11', 'R'], ['12', 'E'], ['13', 'I'], ['14', 'S'], ['15', 'R'],
      ['16', 'C'], ['17', 'C'], ['18', 'R'], ['19', 'C'], ['20', 'I'], ['21', 'I'], ['22', 'E'],
      ['23', 'S'], ['24', 'I'], ['25', 'S'], ['26', 'R'], ['27', 'S'], ['28', 'S'], ['29', 'R'],
      ['30', 'A'], ['31', 'R'], ['32', 'C'], ['33', 'E'], ['34', 'S'], ['35', 'I'], ['36', 'A'],
      ['37', 'C'], ['38', 'S'], ['39', 'A'], ['40', 'E'], ['41', 'S'], ['42', 'I'], ['43', 'R'],
      ['44', 'C'], ['45', 'R'], ['46', 'E'], ['47', 'S'], ['48', 'E'], ['49', 'A'], ['50', 'C'],
      ['51', 'I'], ['52', 'I'], ['53', 'A'], ['54', 'R']
    ]);

    for (const [questionId, answer] of Object.entries(responses)) {
      if (answer === true) {
        const tag = mapping.get(questionId);
        if (tag) {
          scores[tag as keyof RiasecScores]++;
        }
      }
    }

    return scores;
  }

  /**
   * Calculate local Brain Profile scores
   */
  calculateBrainProfileScores(responses: { [questionId: string]: number[] }): BrainScores {
    const scores: BrainScores = { L1: 0, L2: 0, R1: 0, R2: 0 };

    for (const rankings of Object.values(responses)) {
      scores.L1 += rankings[0] || 0;
      scores.L2 += rankings[1] || 0;
      scores.R1 += rankings[2] || 0;
      scores.R2 += rankings[3] || 0;
    }

    return scores;
  }

  /**
   * Calculate local Employability scores
   */
  calculateEmployabilityScores(responses: { [questionId: string]: number }): StepsScores {
    const scores: StepsScores = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
    const counts = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };

    // Pre-computed mapping for performance
    const categoryMap = new Map<string, string>([
  ...Array.from({length: 5}, (_, i) => [`${i + 1}`, 'S'] as [string, string]),
  ...Array.from({length: 5}, (_, i) => [`${i + 6}`, 'T'] as [string, string]),
  ...Array.from({length: 5}, (_, i) => [`${i + 11}`, 'E'] as [string, string]),
  ...Array.from({length: 5}, (_, i) => [`${i + 16}`, 'P'] as [string, string]),
  ...Array.from({length: 5}, (_, i) => [`${i + 21}`, 'Speaking'] as [string, string])
]);

    for (const [questionId, score] of Object.entries(responses)) {
      const category = categoryMap.get(questionId);
      if (category && score >= 1 && score <= 5) {
        const cat = category as keyof StepsScores;
        scores[cat] += score;
        counts[cat]++;
      }
    }

    // Calculate averages
    for (const key of Object.keys(scores) as Array<keyof StepsScores>) {
      if (counts[key] > 0) {
        scores[key] = Number((scores[key] / counts[key]).toFixed(2));
      }
    }

    return scores;
  }

  /**
   * Get Employability Quotient
   */
  getEmployabilityQuotient(scores: StepsScores): number {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
    return Number(((avgScore / 5) * 10).toFixed(1));
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

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const psychometricService = new PsychometricService();
export default psychometricService;