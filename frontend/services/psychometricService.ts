// frontend/services/psychometricService.ts - Enhanced Production-Ready Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiEndpoints, ApiService } from './api';

// Types matching backend interfaces exactly
export interface RiasecScores {
  R: number; // Realistic (Doers)
  I: number; // Investigative (Thinkers)
  A: number; // Artistic (Creators)
  S: number; // Social (Helpers)
  E: number; // Enterprising (Persuaders)
  C: number; // Conventional (Organizers)
}

export interface BrainScores {
  L1: number; // Analyst and Realist
  L2: number; // Conservative/Organizer
  R1: number; // Strategist and Imaginative
  R2: number; // Socializer and Empathic
}

export interface StepsScores {
  S: number; // Self Management
  T: number; // Team Work
  E: number; // Enterprising
  P: number; // Problem Solving
  Speaking: number; // Speaking & Listening
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
  lastActiveSection?: string;
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

// Enhanced service class with full backend integration
class EnhancedPsychometricService {
  private timeout = 45000; // Increased to 45 seconds for better reliability
  private retryAttempts = 3;
  private retryDelay = 2000; // Increased base delay

  /**
   * Enhanced network connectivity check
   */
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable;
      
      if (!isConnected) {
        console.warn('⚠️ No internet connectivity detected');
      }
      
      return isConnected ?? false;
    } catch (error) {
      console.warn('⚠️ Failed to check network connectivity:', error);
      return false;
    }
  }

  /**
   * Get auth token with better error handling
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ No auth token found');
      }
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  /**
 * Get test dashboard data (local implementation)
 */
async getTestDashboardData(): Promise<{
  testData: PsychometricTest;
  completedCount: number;
  allCompleted: boolean;
  sectionStatus: { [key: string]: 'available' | 'completed_locked' | 'completed_available' };
}> {
  try {
    console.log('📊 Getting test dashboard data...');
    
    // Get current test data using existing method
    const testData = await this.getOrCreateTest();
    
    const sectionsCompleted = testData.sectionsCompleted || {
      riasec: false,
      brainProfile: false,
      employability: false,
      personalInsights: false,
    };
    
    // Calculate completion stats
    const completedCount = Object.values(sectionsCompleted).filter(Boolean).length;
    const allCompleted = Object.values(sectionsCompleted).every(Boolean);
    
    // Determine section access status
    const sectionStatus: { [key: string]: 'available' | 'completed_locked' | 'completed_available' } = {};
    
    Object.keys(sectionsCompleted).forEach(sectionId => {
      const isCompleted = sectionsCompleted[sectionId as keyof typeof sectionsCompleted];
      
      if (isCompleted) {
        // If section is completed, make it available for retake only if all sections are done
        sectionStatus[sectionId] = allCompleted ? 'completed_available' : 'completed_locked';
      } else {
        // If section is not completed, it's available
        sectionStatus[sectionId] = 'available';
      }
    });

    console.log(`✅ Dashboard data ready: ${completedCount}/4 sections completed`);
    console.log(`📋 Section status:`, sectionStatus);
    
    return {
      testData,
      completedCount,
      allCompleted,
      sectionStatus
    };
  } catch (error) {
    console.error('❌ Error getting test dashboard data:', error);
    
    // Return safe fallback data
    const fallbackTestData: PsychometricTest = {
      testId: 'fallback',
      status: 'in_progress',
      completionPercentage: 0,
      sectionsCompleted: {
        riasec: false,
        brainProfile: false,
        employability: false,
        personalInsights: false,
      },
      startedAt: new Date().toISOString(),
      totalTimeSpent: 0,
    };
    
    return {
      testData: fallbackTestData,
      completedCount: 0,
      allCompleted: false,
      sectionStatus: {
        riasec: 'available',
        brainProfile: 'available',
        employability: 'available',
        personalInsights: 'available',
      }
    };
  }
}

  /**
   * Enhanced request wrapper using the improved ApiService
   */
  private async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    // Check connectivity first
    const isConnected = await this.checkNetworkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    // Check authentication
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    try {
      console.log(`🚀 Making psychometric API request: ${options.method || 'GET'} ${endpoint}`);
      
      // Use the enhanced ApiService for the actual request
      let response;
      const requestOptions = {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        }
      };

      switch (options.method?.toUpperCase()) {
        case 'POST':
          response = await ApiService.post(endpoint, options.body, { headers: requestOptions.headers });
          break;
        case 'PUT':
          response = await ApiService.put(endpoint, options.body);
          break;
        case 'DELETE':
          response = await ApiService.delete(endpoint);
          break;
        default:
          response = await ApiService.get(endpoint);
      }

      console.log(`✅ Psychometric API request successful: ${endpoint}`);
      return response;

    } catch (error: any) {
      console.error(`❌ Psychometric API request failed: ${endpoint}`, error);
      
      // Transform errors for better UX
      if (error.status === 401) {
        await AsyncStorage.removeItem('access_token');
        throw new Error('Session expired. Please log in again.');
      } else if (error.status === 400) {
        throw new Error(error.message || 'Invalid request. Please check your data.');
      } else if (error.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message?.includes('timeout') || error.message?.includes('AbortError')) {
        throw new Error('Request timeout. Please check your connection and try again.');
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

/**
 * Check if user can access a specific test section
 */
async checkSectionAccess(sectionId: 'riasec' | 'brainProfile' | 'employability' | 'personalInsights'): Promise<{
  canAccess: boolean;
  sectionCompleted: boolean;
  allSectionsCompleted: boolean;
  message: string;
}> {
  try {
    console.log(`🔐 Checking access for section: ${sectionId}`);
    
    const endpoint = await this.buildPsychometricUrl(`/section-access/${sectionId}`);
    const response = await this.makeRequest(endpoint, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to check section access');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error checking section access:', error);
    // Return permissive access on error
    return {
      canAccess: true,
      sectionCompleted: false,
      allSectionsCompleted: false,
      message: 'Unable to verify access'
    };
  }
}

/**
 * Get test status with access control information
 */
async getTestStatusWithAccess(): Promise<{
  testData: any;
  sectionAccess: {
    riasec: boolean;
    brainProfile: boolean;
    employability: boolean;
    personalInsights: boolean;
  };
  completedCount: number;
  canRetakeTests: boolean;
}> {
  try {
    const testData = await this.getOrCreateTest();
    
    const sectionsCompleted = testData.sectionsCompleted;
    const completedCount = Object.values(sectionsCompleted).filter(Boolean).length;
    const allCompleted = Object.values(sectionsCompleted).every(Boolean);
    
    const sectionAccess = {
      riasec: !sectionsCompleted.riasec || allCompleted,
      brainProfile: !sectionsCompleted.brainProfile || allCompleted,
      employability: !sectionsCompleted.employability || allCompleted,
      personalInsights: !sectionsCompleted.personalInsights || allCompleted,
    };

    return {
      testData,
      sectionAccess,
      completedCount,
      canRetakeTests: allCompleted
    };
  } catch (error) {
    console.error('❌ Error getting test status with access:', error);
    throw error;
  }
}

/**
 * Reset all tests (start completely over)
 */
async resetAllTests(): Promise<void> {
  try {
    console.log('🔄 Resetting all psychometric tests...');
    
    const testData = await this.getOrCreateTest();
    if (testData.testId) {
      await this.deleteTest(testData.testId);
    }
    
    console.log('✅ All tests reset successfully');
  } catch (error) {
    console.error('❌ Error resetting tests:', error);
    throw error;
  }
}

  /**
   * Build psychometric endpoint URLs dynamically
   */
  private async buildPsychometricUrl(path: string): Promise<string> {
    const endpoints = await ApiEndpoints.getEndpoints();
    return `${endpoints.API_BASE}/psychometric${path}`;
  }

  /**
   * Client-side validation functions
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

  validateBrainProfileResponses(responses: { [questionId: string]: number[] }): {isValid: boolean, validationErrors: string[]} {
    const responseCount = Object.keys(responses).length;
    const validationErrors: string[] = [];
    
    if (responseCount !== 10) {
      validationErrors.push(`Need exactly 10 responses, got ${responseCount}`);
    }
    
    const hasInvalidResponses = Object.values(responses).some(val => 
      !Array.isArray(val) || val.length !== 4 || val.some(v => typeof v !== 'number' || v < 1 || v > 4)
    );
    if (hasInvalidResponses) {
      validationErrors.push('All responses must be arrays of 4 numbers (1-4 rankings)');
    }
    
    return {
      isValid: validationErrors.length === 0,
      validationErrors
    };
  }

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

  validatePersonalInsights(insights: PersonalInsights): {isValid: boolean, validationErrors: string[]} {
    const validationErrors: string[] = [];
    
    if (!insights.whatYouLike || insights.whatYouLike.trim().length < 10) {
      validationErrors.push('What you like must be at least 10 characters');
    }
    if (!insights.whatYouAreGoodAt || insights.whatYouAreGoodAt.trim().length < 10) {
      validationErrors.push('What you are good at must be at least 10 characters');
    }
    if (!insights.recentProjects || insights.recentProjects.trim().length < 10) {
      validationErrors.push('Recent projects must be at least 10 characters');
    }
    if (!Array.isArray(insights.characterStrengths) || insights.characterStrengths.length < 3) {
      validationErrors.push('At least 3 character strengths are required');
    }
    if (!Array.isArray(insights.valuesInLife) || insights.valuesInLife.length < 3) {
      validationErrors.push('At least 3 life values are required');
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
      
      const endpoint = await this.buildPsychometricUrl('/user-test');
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to get test');
      }

      console.log(`📋 Test retrieved: ${response.data.testId} (${response.data.status})`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting psychometric test:', error);
      throw error;
    }
  }

  /**
   * Submit RIASEC section results to backend
   */
  async submitRiasecResults(
    responses: { [questionId: string]: boolean },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('📝 Submitting RIASEC results to backend...');
      console.log(`📊 Submitting ${Object.keys(responses).length} responses, time: ${timeSpent} minutes`);
      
      // Client-side validation first
      const validation = this.validateRiasecResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const endpoint = await this.buildPsychometricUrl('/riasec');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          responses,
          timeSpent: Math.max(1, Math.round(timeSpent)) // Ensure minimum 1 minute
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit RIASEC results');
      }

      console.log('✅ RIASEC results saved to database successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error submitting RIASEC results:', error);
      throw error;
    }
  }

  /**
   * Submit Brain Profile section results to backend
   */
  async submitBrainProfileResults(
    responses: { [questionId: string]: number[] },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('🧠 Submitting Brain Profile results to backend...');
      console.log(`📊 Submitting ${Object.keys(responses).length} ranking responses`);
      
      // Client-side validation
      const validation = this.validateBrainProfileResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const endpoint = await this.buildPsychometricUrl('/brain-profile');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          responses,
          timeSpent: Math.max(1, Math.round(timeSpent))
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Brain Profile results');
      }

      console.log('✅ Brain Profile results saved to database successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Brain Profile results:', error);
      throw error;
    }
  }

  /**
   * Submit Employability section results to backend
   */
  async submitEmployabilityResults(
    responses: { [questionId: string]: number },
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('💼 Submitting Employability results to backend...');
      console.log(`📊 Submitting ${Object.keys(responses).length} STEPS responses`);
      
      // Client-side validation
      const validation = this.validateEmployabilityResponses(responses);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const endpoint = await this.buildPsychometricUrl('/employability');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          responses,
          timeSpent: Math.max(1, Math.round(timeSpent))
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Employability results');
      }

      console.log('✅ Employability results saved to database successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Employability results:', error);
      throw error;
    }
  }

  /**
   * Submit Personal Insights section results to backend
   */
  async submitPersonalInsights(
    insights: PersonalInsights,
    timeSpent: number
  ): Promise<PsychometricTest> {
    try {
      console.log('📝 Submitting Personal Insights to backend...');
      
      // Client-side validation
      const validation = this.validatePersonalInsights(insights);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.validationErrors.join(', ')}`);
      }
      
      const endpoint = await this.buildPsychometricUrl('/personal-insights');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          ...insights,
          timeSpent: Math.max(1, Math.round(timeSpent))
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit Personal Insights');
      }

      console.log('✅ Personal Insights saved to database successfully');
      console.log('🎉 Test completion check:', response.data.isComplete ? 'COMPLETED' : 'IN PROGRESS');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting Personal Insights:', error);
      throw error;
    }
  }

  /**
   * Get test results by ID or latest from backend
   */
  async getTestResults(testId?: string): Promise<PsychometricTest> {
    try {
      console.log(`📊 Getting test results from backend${testId ? ` for ${testId}` : ' (latest)'}...`);
      
      const path = testId ? `/results/${testId}` : '/results';
      const endpoint = await this.buildPsychometricUrl(path);
      const response = await this.makeRequest(endpoint, {
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
   * Get user's test history from backend
   */
  async getTestHistory(limit: number = 10): Promise<{tests: TestHistory[], total: number}> {
    try {
      console.log('📚 Getting test history from backend...');
      
      const endpoint = await this.buildPsychometricUrl(`/history?limit=${limit}`);
      const response = await this.makeRequest(endpoint, {
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
      console.log(`🗑️ Deleting test ${testId} from backend...`);
      
      const endpoint = await this.buildPsychometricUrl(`/test/${testId}`);
      const response = await this.makeRequest(endpoint, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete test');
      }

      console.log('✅ Test deleted from database successfully');
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
      
      const endpoint = await this.buildPsychometricUrl(`/career-recommendations/${hollandCode}`);
      const response = await this.makeRequest(endpoint, {
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
      console.log(`💾 Auto-saving progress for ${sectionType} to backend...`);
      
      const endpoint = await this.buildPsychometricUrl('/save-progress');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          sectionType,
          responses,
          currentQuestionIndex
        }
      });

      if (response.success) {
        console.log('✅ Progress auto-saved to database successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error auto-saving progress (non-blocking):', error);
      // Don't throw error for auto-save failures - it should be non-blocking
    }
  }

  /**
   * Validate section responses on backend
   */
  async validateSection(
    sectionType: 'riasec' | 'brainProfile' | 'employability' | 'personalInsights',
    responses: any
  ): Promise<{isValid: boolean, validationErrors: string[], responseCount: number}> {
    try {
      console.log(`🔍 Validating ${sectionType} section on backend...`);
      
      const endpoint = await this.buildPsychometricUrl('/validate-section');
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: {
          sectionType,
          responses
        }
      });

      if (!response.success) {
        throw new Error(response.message || 'Validation failed');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error validating section on backend:', error);
      // Return local validation result as fallback
      return this.getLocalValidation(sectionType, responses);
    }
  }

  /**
   * Local validation fallback
   */
  private getLocalValidation(sectionType: string, responses: any): {isValid: boolean, validationErrors: string[], responseCount: number} {
    const responseCount = Object.keys(responses).length;
    
    switch (sectionType) {
      case 'riasec':
        const riasecValidation = this.validateRiasecResponses(responses);
        return { ...riasecValidation, responseCount };
      case 'brainProfile':
        const brainValidation = this.validateBrainProfileResponses(responses);
        return { ...brainValidation, responseCount };
      case 'employability':
        const empValidation = this.validateEmployabilityResponses(responses);
        return { ...empValidation, responseCount };
      default:
        return {
          isValid: responseCount > 0,
          validationErrors: responseCount === 0 ? ['No responses provided'] : [],
          responseCount
        };
    }
  }

  /**
   * Calculate local RIASEC scores for immediate feedback
   */
  calculateRiasecScores(responses: { [questionId: string]: boolean }): RiasecScores {
    const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // RIASEC mapping for 54 questions
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
      // Rankings are 1-4, where 1 = most preferred, 4 = least preferred
      // Convert to points: 1st place = 4 points, 2nd = 3 points, etc.
      const points = rankings.map(rank => 5 - rank); // Convert 1,2,3,4 to 4,3,2,1
      
      scores.L1 += points[0] || 0;
      scores.L2 += points[1] || 0;
      scores.R1 += points[2] || 0;
      scores.R2 += points[3] || 0;
    }

    return scores;
  }

  /**
   * Calculate local Employability (STEPS) scores
   */
  calculateEmployabilityScores(responses: { [questionId: string]: number }): StepsScores {
    const scores: StepsScores = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
    const counts = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };

    // STEPS mapping: Questions 1-5 = S, 6-10 = T, 11-15 = E, 16-20 = P, 21-25 = Speaking
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
   * Get Employability Quotient from STEPS scores
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
   * Get RIASEC interpretation data
   */
  getRiasecInterpretation(letter: keyof RiasecScores): {name: string, description: string, color: string} {
    const interpretations = {
      R: { 
        name: 'Realistic (Doers)', 
        description: 'You prefer hands-on work and practical activities. You like to work with tools, machines, and physical materials.',
        color: '#059669'
      },
      I: { 
        name: 'Investigative (Thinkers)', 
        description: 'You enjoy research, analysis, and intellectual challenges. You like to solve complex problems and understand how things work.',
        color: '#7C3AED'
      },
      A: { 
        name: 'Artistic (Creators)', 
        description: 'You are drawn to creative and expressive activities. You value beauty, creativity, and self-expression.',
        color: '#DC2626'
      },
      S: { 
        name: 'Social (Helpers)', 
        description: 'You like working with and helping people. You enjoy teaching, caring for others, and making a positive impact on society.',
        color: '#F59E0B'
      },
      E: { 
        name: 'Enterprising (Persuaders)', 
        description: 'You enjoy leadership and business activities. You like to influence others and achieve goals through organizing and directing.',
        color: '#0EA5E9'
      },
      C: { 
        name: 'Conventional (Organizers)', 
        description: 'You prefer structured, detail-oriented work. You like organization, accuracy, and following established procedures.',
        color: '#8B4513'
      },
    };

    return interpretations[letter];
  }

  /**
   * Check if the psychometric service is healthy
   */
  async checkServiceHealth(): Promise<{healthy: boolean, message: string, details?: any}> {
    try {
      console.log('🔍 Checking psychometric service health...');
      
      const endpoint = await this.buildPsychometricUrl('/test');
      const response = await this.makeRequest(endpoint, {
        method: 'GET',
      });
      
      return {
        healthy: true,
        message: 'Service is operational',
        details: response
      };
    } catch (error: any) {
      console.warn('⚠️ Psychometric service health check failed:', error);
      return {
        healthy: false,
        message: error.message || 'Service unavailable',
        details: error
      };
    }
  }

  /**
   * Initialize the service and verify connectivity
   */
  async initialize(): Promise<{success: boolean, message: string, details?: any}> {
    try {
      console.log('🚀 Initializing psychometric service...');
      
      // Check network connectivity
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        return {
          success: false,
          message: 'No internet connection available'
        };
      }

      // Check authentication
      const token = await this.getAuthToken();
      if (!token) {
        return {
          success: false,
          message: 'Authentication token not found'
        };
      }

      // Check service health
      const health = await this.checkServiceHealth();
      
      return {
        success: health.healthy,
        message: health.message,
        details: health.details
      };
    } catch (error: any) {
      console.error('❌ Failed to initialize psychometric service:', error);
      return {
        success: false,
        message: error.message || 'Initialization failed',
        details: error
      };
    }
  }

  /**
   * Get comprehensive test status for a user
   */
  async getTestStatus(): Promise<{
    hasActiveTest: boolean;
    testData?: PsychometricTest;
    canStartNew: boolean;
    completedSections: string[];
    nextSection?: string;
  }> {
    try {
      const testData = await this.getOrCreateTest();
      
      const completedSections = Object.entries(testData.sectionsCompleted)
        .filter(([_, completed]) => completed)
        .map(([section, _]) => section);
      
      return {
        hasActiveTest: testData.status === 'in_progress',
        testData,
        canStartNew: testData.status !== 'in_progress',
        completedSections,
        nextSection: testData.nextSection
      };
    } catch (error) {
      console.error('❌ Error getting test status:', error);
      return {
        hasActiveTest: false,
        canStartNew: true,
        completedSections: []
      };
    }
  }

  /**
 * Start a new test (resets existing test instead of creating new one)
 */
async startNewTest(): Promise<PsychometricTest> {
  try {
    console.log('🆕 Starting new psychometric test session...');
    
    const endpoint = await this.buildPsychometricUrl('/start-new-session');
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: {}
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to start new test');
    }

    console.log('✅ Test session reset successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error starting new test:', error);
    throw error;
  }
}
}

// Export enhanced singleton instance
export const psychometricService = new EnhancedPsychometricService();
export default psychometricService;