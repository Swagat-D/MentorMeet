import { Types } from 'mongoose';
import PsychometricTest, { 
  IPsychometricTest, 
  IRiasecScores, 
  IBrainScores, 
  IStepsScores,
  IPersonalInsights,
  ITestResult 
} from '../models/PsychometricTest.model';
import User from '../models/User.model.js';

export class PsychometricTestService {
  
  /**
 * Create or get existing test for user with optimization
 */
static async getOrCreateTest(userId: string): Promise<IPsychometricTest> {
  try {
    console.log(`📋 Getting/creating test for user: ${userId}`);
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    const userObjectId = new Types.ObjectId(userId);
    
    // First try to find any existing test (in_progress or completed)
    let test = await PsychometricTest.findOne({
      userId: userObjectId
    }).sort({ createdAt: -1 }); // Get the latest test

    if (!test) {
      console.log('📝 Creating new psychometric test...');
      
      // Create new test with all required fields
      const newTestData = {
        userId: userObjectId,
        status: 'in_progress' as const,
        startedAt: new Date(),
        totalTimeSpent: 0,
        sectionsCompleted: {
          riasec: false,
          brainProfile: false,
          employability: false,
          personalInsights: false,
        },
        progressData: {
          currentQuestionIndex: 0,
          partialResponses: {}
        }
      };

      test = new PsychometricTest(newTestData);
      await test.save();
      
      console.log(`✅ Created new test: ${test.testId}`);
    } else {
      console.log(`📋 Found existing test: ${test.testId} (status: ${test.status})`);
    }

    // Ensure all required fields exist
    if (!test.sectionsCompleted) {
      test.sectionsCompleted = {
        riasec: false,
        brainProfile: false,
        employability: false,
        personalInsights: false,
      };
      await test.save();
    }

    if (!test.progressData) {
      test.progressData = {
        currentQuestionIndex: 0,
        partialResponses: {}
      };
      await test.save();
    }

    return test;
  } catch (error) {
    console.error('❌ Error in getOrCreateTest:', error);
    throw new Error(`Failed to get or create test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

  /**
   * Save RIASEC section results with optimized calculation
   */
  static async saveRiasecResults(
    userId: string, 
    responses: { [questionId: string]: boolean },
    timeSpent: number
  ): Promise<IPsychometricTest> {
    try {
      console.log(`📝 Saving RIASEC results for user: ${userId}`);
      console.log(`📊 Processing ${Object.keys(responses).length} responses`);
      
      // Validation
      const expectedQuestions = 54;
      const actualQuestions = Object.keys(responses).length;
      
      if (actualQuestions !== expectedQuestions) {
        throw new Error(`Invalid responses count. Expected: ${expectedQuestions}, Got: ${actualQuestions}`);
      }

      // Get test with minimal data for update
      const test = await PsychometricTest.findOne({
        userId: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!test) {
        throw new Error('No active test found for user');
      }

      // Calculate scores efficiently
      const scores = this.calculateRiasecScoresOptimized(responses);
      
      // Generate interpretation
      const interpretation = this.generateRiasecInterpretationOptimized(scores);
      const recommendations = this.generateRiasecRecommendationsOptimized(scores);

      // Create test result
      const testResult: ITestResult = {
        sectionId: 'riasec',
        sectionName: 'Interest Inventory (RIASEC)',
        completedAt: new Date(),
        timeSpent,
        responses,
        scores,
        interpretation,
        recommendations
      };

      // Update using atomic operations for better performance
      const updatedTest = await PsychometricTest.findByIdAndUpdate(
        test._id,
        {
          $set: {
            riasecResult: testResult,
            'sectionsCompleted.riasec': true,
            lastActiveSection: 'riasec',
            'progressData.currentQuestionIndex': 0,
            'progressData.partialResponses': {}
          },
          $inc: {
            totalTimeSpent: timeSpent
          }
        },
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!updatedTest) {
        throw new Error('Failed to update test');
      }

      console.log(`✅ RIASEC results saved for test: ${updatedTest.testId}`);
      return updatedTest;

    } catch (error) {
      console.error('❌ Error saving RIASEC results:', error);
      throw error;
    }
  }

  /**
 * Check if user can access a specific test section
 */
  static canAccessSection(testData: any, sectionId: string): boolean {
  if (!testData) return true;
  
  const sectionsCompleted = testData.sectionsCompleted;
  const allSectionsCompleted = Object.values(sectionsCompleted).every(Boolean);
  
  if (sectionsCompleted[sectionId]) {
    return allSectionsCompleted; 
  }
  
  return true; 
}

  /**
   * Save Brain Profile section results
   */
  static async saveBrainProfileResults(
    userId: string,
    responses: { [questionId: string]: number[] },
    timeSpent: number
  ): Promise<IPsychometricTest> {
    try {
      console.log(`🧠 Saving Brain Profile results for user: ${userId}`);
      
      const test = await PsychometricTest.findOne({
        userId: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!test) {
        throw new Error('No active test found for user');
      }

      // Validate responses
      const expectedQuestions = 10;
      const actualQuestions = Object.keys(responses).length;
      
      if (actualQuestions !== expectedQuestions) {
        throw new Error(`Invalid responses count. Expected: ${expectedQuestions}, Got: ${actualQuestions}`);
      }

      // Calculate brain scores
      const scores = this.calculateBrainScoresOptimized(responses);
      const interpretation = this.generateBrainInterpretationOptimized(scores);
      const recommendations = this.generateBrainRecommendationsOptimized(scores);

      const testResult: ITestResult = {
        sectionId: 'brainProfile',
        sectionName: 'Brain Profile Test',
        completedAt: new Date(),
        timeSpent,
        responses,
        scores,
        interpretation,
        recommendations
      };

      const updatedTest = await PsychometricTest.findByIdAndUpdate(
        test._id,
        {
          $set: {
            brainProfileResult: testResult,
            'sectionsCompleted.brainProfile': true,
            lastActiveSection: 'brainProfile'
          },
          $inc: {
            totalTimeSpent: timeSpent
          }
        },
        { new: true, runValidators: true }
      );

      console.log(`✅ Brain Profile results saved for test: ${updatedTest?.testId}`);
      return updatedTest!;

    } catch (error) {
      console.error('❌ Error saving Brain Profile results:', error);
      throw error;
    }
  }

  /**
   * Save Employability (STEPS) section results
   */
  static async saveEmployabilityResults(
    userId: string,
    responses: { [questionId: string]: number },
    timeSpent: number
  ): Promise<IPsychometricTest> {
    try {
      console.log(`💼 Saving Employability results for user: ${userId}`);
      
      const test = await PsychometricTest.findOne({
        userId: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!test) {
        throw new Error('No active test found for user');
      }

      // Validate responses
      const expectedQuestions = 25;
      const actualQuestions = Object.keys(responses).length;
      
      if (actualQuestions !== expectedQuestions) {
        throw new Error(`Invalid responses count. Expected: ${expectedQuestions}, Got: ${actualQuestions}`);
      }

      // Calculate STEPS scores
      const scores = this.calculateStepsScoresOptimized(responses);
      const interpretation = this.generateStepsInterpretationOptimized(scores);
      const recommendations = this.generateStepsRecommendationsOptimized(scores);

      const testResult: ITestResult = {
        sectionId: 'employability',
        sectionName: 'Employability Test (STEPS)',
        completedAt: new Date(),
        timeSpent,
        responses,
        scores,
        interpretation,
        recommendations
      };

      const updatedTest = await PsychometricTest.findByIdAndUpdate(
        test._id,
        {
          $set: {
            employabilityResult: testResult,
            'sectionsCompleted.employability': true,
            lastActiveSection: 'employability'
          },
          $inc: {
            totalTimeSpent: timeSpent
          }
        },
        { new: true, runValidators: true }
      );

      console.log(`✅ Employability results saved for test: ${updatedTest?.testId}`);
      return updatedTest!;

    } catch (error) {
      console.error('❌ Error saving Employability results:', error);
      throw error;
    }
  }

  /**
   * Save Personal Insights section results
   */
  static async savePersonalInsights(
    userId: string,
    insights: IPersonalInsights,
    timeSpent: number
  ): Promise<IPsychometricTest> {
    try {
      console.log(`📝 Saving Personal Insights for user: ${userId}`);
      
      const test = await PsychometricTest.findOne({
        userId: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!test) {
        throw new Error('No active test found for user');
      }

      // Validate insights
      this.validatePersonalInsights(insights);

      const updatedTest = await PsychometricTest.findByIdAndUpdate(
        test._id,
        {
          $set: {
            personalInsightsResult: {
              sectionId: 'personalInsights',
              sectionName: 'Personal Insights',
              completedAt: new Date(),
              responses: insights
            },
            'sectionsCompleted.personalInsights': true,
            lastActiveSection: 'personalInsights'
          },
          $inc: {
            totalTimeSpent: timeSpent
          }
        },
        { new: true, runValidators: true }
      );

      // Check if test is complete and calculate overall results
      if (updatedTest && this.isTestComplete(updatedTest.sectionsCompleted)) {
        await this.finalizeTest(updatedTest._id as Types.ObjectId);
      }

      console.log(`✅ Personal Insights saved for test: ${updatedTest?.testId}`);
      return updatedTest!;

    } catch (error) {
      console.error('❌ Error saving Personal Insights:', error);
      throw error;
    }
  }

  /**
   * Finalize test when all sections are complete
   */
  private static async finalizeTest(testId: Types.ObjectId): Promise<void> {
    try {
      const test = await PsychometricTest.findById(testId);
      if (!test) return;

      const overallResults = test.calculateOverallResults();
      await this.updateUserTestStatus(test.userId.toString());
      
      await PsychometricTest.findByIdAndUpdate(
        testId,
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            overallResults
          }
        }
      );

      console.log(`🎉 Test finalized: ${test.testId}`);
    } catch (error) {
      console.error('❌ Error finalizing test:', error);
    }
  }

  /**
   * Update in user profile 
   */

  private static async updateUserTestStatus(userId: string): Promise<void> {
  try {
    await User.findByIdAndUpdate(userId, { isTestGiven: true });
    console.log('✅ User test status updated to true');
  } catch (error) {
    console.warn('⚠️ Failed to update user test status:', error);
  }
}

  /**
   * Check if test is complete
   */
  private static isTestComplete(sectionsCompleted: any): boolean {
    return Object.values(sectionsCompleted).every(Boolean);
  }

  /**
   * Validate personal insights
   */
  private static validatePersonalInsights(insights: IPersonalInsights): void {
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
  }

  /**
   * Optimized RIASEC score calculation
   */
  private static calculateRiasecScoresOptimized(responses: { [questionId: string]: boolean }): IRiasecScores {
    const scores: IRiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

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
          scores[tag as keyof IRiasecScores]++;
        }
      }
    }

    return scores;
  }

  /**
   * Optimized brain score calculation
   */
  private static calculateBrainScoresOptimized(responses: { [questionId: string]: number[] }): IBrainScores {
    const scores: IBrainScores = { L1: 0, L2: 0, R1: 0, R2: 0 };

    for (const rankings of Object.values(responses)) {
      scores.L1 += rankings[0] || 0;
      scores.L2 += rankings[1] || 0;
      scores.R1 += rankings[2] || 0;
      scores.R2 += rankings[3] || 0;
    }

    return scores;
  }

  /**
   * Optimized STEPS score calculation
   */
  private static calculateStepsScoresOptimized(responses: { [questionId: string]: number }): IStepsScores {
    const scores: IStepsScores = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
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
        const cat = category as keyof IStepsScores;
        scores[cat] += score;
        counts[cat]++;
      }
    }

    // Calculate averages
    for (const key of Object.keys(scores) as Array<keyof IStepsScores>) {
      if (counts[key] > 0) {
        scores[key] = Number((scores[key] / counts[key]).toFixed(2));
      }
    }

    return scores;
  }

  /**
   * Generate RIASEC interpretation efficiently
   */
  private static generateRiasecInterpretationOptimized(scores: IRiasecScores): string {
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const topThree = sortedScores.map(([letter]) => letter).join('');
    
    const descriptions = new Map([
      ['R', 'hands-on and practical work'],
      ['I', 'research, analysis, and intellectual challenges'],
      ['A', 'creative and expressive activities'],
      ['S', 'working with and helping people'],
      ['E', 'leadership and business activities'],
      ['C', 'structured, detail-oriented work']
    ]);

    const topDesc = descriptions.get(sortedScores[0][0]);
    return `Your Holland Code is ${topThree}. You show strongest interest in ${topDesc}.`;
  }

  /**
   * Generate RIASEC recommendations efficiently
   */
  private static generateRiasecRecommendationsOptimized(scores: IRiasecScores): string[] {
    const careerMap = new Map([
      ['R', ['Engineer', 'Technician', 'Mechanic', 'Farmer']],
      ['I', ['Researcher', 'Scientist', 'Analyst', 'Doctor']],
      ['A', ['Artist', 'Designer', 'Writer', 'Musician']],
      ['S', ['Teacher', 'Counselor', 'Social Worker', 'Nurse']],
      ['E', ['Manager', 'Entrepreneur', 'Sales Rep', 'Lawyer']],
      ['C', ['Accountant', 'Administrator', 'Data Analyst', 'Librarian']]
    ]);

    const topThree = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([letter]) => letter);

    const recommendations: string[] = [];
    for (const letter of topThree) {
      const careers = careerMap.get(letter);
      if (careers) recommendations.push(...careers);
    }

    return [...new Set(recommendations)].slice(0, 8);
  }

  /**
   * Generate brain interpretation efficiently
   */
  private static generateBrainInterpretationOptimized(scores: IBrainScores): string {
    const quadrants = new Map([
      ['L1', 'logical and analytical thinking'],
      ['L2', 'structured and systematic approaches'],
      ['R1', 'creative and strategic thinking'],
      ['R2', 'empathetic and collaborative approaches']
    ]);

    const topQuadrant = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];

    const description = quadrants.get(topQuadrant);
    return `Your dominant thinking style emphasizes ${description}.`;
  }

  /**
   * Generate brain recommendations efficiently
   */
  private static generateBrainRecommendationsOptimized(scores: IBrainScores): string[] {
    const recommendations = new Map([
      ['L1', ['Use logical frameworks', 'Focus on data-driven learning']],
      ['L2', ['Create structured schedules', 'Use organized materials']],
      ['R1', ['Engage in creative problem-solving', 'Use visual aids']],
      ['R2', ['Learn through group discussions', 'Seek mentoring']]
    ]);

    const topQuadrant = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];

    return recommendations.get(topQuadrant) || ['General learning strategies'];
  }

  /**
   * Generate STEPS interpretation efficiently
   */
  private static generateStepsInterpretationOptimized(scores: IStepsScores): string {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
    const quotient = Number(((avgScore / 5) * 10).toFixed(1));
    
    let assessment = '';
    if (quotient >= 8) assessment = 'Excellent job readiness!';
    else if (quotient >= 6) assessment = 'Good employability with room for growth.';
    else if (quotient >= 4) assessment = 'Developing employability skills.';
    else assessment = 'Focus needed on key employability areas.';

    return `Your Employability Quotient is ${quotient}/10. ${assessment}`;
  }

  /**
   * Generate STEPS recommendations efficiently
   */
  private static generateStepsRecommendationsOptimized(scores: IStepsScores): string[] {
    const improvements = new Map([
      ['S', 'Develop self-management and time management skills'],
      ['T', 'Enhance teamwork and collaboration abilities'],
      ['E', 'Build leadership and enterprising skills'],
      ['P', 'Strengthen problem-solving and critical thinking'],
      ['Speaking', 'Improve communication and presentation skills']
    ]);

    const weakAreas = Object.entries(scores)
      .filter(([, score]) => score < 3.5)
      .map(([area]) => area);

    if (weakAreas.length === 0) {
      return ['Continue developing all areas to maintain high employability'];
    }

    return weakAreas.map(area => improvements.get(area)).filter(Boolean) as string[];
  }

  /**
   * Get test results efficiently
   */
  static async getTestResults(userId: string, testId?: string): Promise<IPsychometricTest | null> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      
      if (testId) {
        query.testId = testId;
      }

      return await PsychometricTest.findOne(query)
        .sort({ createdAt: -1 })
        .lean()
        .exec();
    } catch (error) {
      console.error('❌ Error getting test results:', error);
      throw error;
    }
  }

  /**
   * Get test history efficiently
   */
  static async getTestHistory(userId: string, limit: number = 10): Promise<IPsychometricTest[]> {
    try {
      return await PsychometricTest.find({ 
        userId: new Types.ObjectId(userId) 
      })
        .select('testId status sectionsCompleted startedAt completedAt totalTimeSpent overallResults.hollandCode overallResults.employabilityQuotient')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      console.error('❌ Error getting test history:', error);
      throw error;
    }
  }

  /**
   * Save progress efficiently (for auto-save)
   */
  static async saveProgress(
    userId: string,
    sectionType: string,
    responses: any,
    currentQuestionIndex?: number
  ): Promise<void> {
    try {
      const updateObj: any = {
        [`progressData.partialResponses.${sectionType}`]: responses,
        lastActiveSection: sectionType
      };

      if (currentQuestionIndex !== undefined) {
        updateObj['progressData.currentQuestionIndex'] = currentQuestionIndex;
      }

      await PsychometricTest.updateOne(
        {
          userId: new Types.ObjectId(userId),
          status: 'in_progress'
        },
        { $set: updateObj }
      );

      console.log(`💾 Progress saved for user: ${userId}, section: ${sectionType}`);
    } catch (error) {
      console.warn('⚠️ Error saving progress:', error);
      // Don't throw - auto-save should be non-blocking
    }
  }

  /**
   * Delete test efficiently
   */
  static async deleteTest(userId: string, testId: string): Promise<boolean> {
    try {
      const result = await PsychometricTest.deleteOne({
        userId: new Types.ObjectId(userId),
        testId,
        status: 'in_progress'
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      throw error;
    }
  }

    static async validateUser(userId: string): Promise<boolean> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return false;
    }
    
    const User = require('../models/User.model').default;
    const user = await User.findById(userId);
    return !!user;
  } catch (error) {
    console.error('❌ Error validating user:', error);
    return false;
  }
}

/**
 * Start a new test session (for retaking)
 */
/**
 * Start a new test session (for retaking) - Reset existing test instead of creating new one
 */
static async startNewTestSession(userId: string): Promise<IPsychometricTest> {
  try {
    console.log(`🔄 Starting new test session for user: ${userId}`);
    
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const userObjectId = new Types.ObjectId(userId);
    
    // Find existing test (completed or in-progress)
    let existingTest = await PsychometricTest.findOne({
      userId: userObjectId,
      $or: [
        { status: 'completed' },
        { status: 'in_progress' }
      ]
    }).sort({ createdAt: -1 });

    if (existingTest) {
      // Reset the existing test instead of creating new one
      console.log(`🔄 Resetting existing test: ${existingTest.testId}`);
      
      const resetData = {
        status: 'in_progress' as const,
        startedAt: new Date(),
        completedAt: undefined,
        totalTimeSpent: 0,
        sectionsCompleted: {
          riasec: false,
          brainProfile: false,
          employability: false,
          personalInsights: false,
        },
        progressData: {
          currentQuestionIndex: 0,
          partialResponses: {}
        },
        // Clear all section results
        riasecResult: undefined,
        brainProfileResult: undefined,
        employabilityResult: undefined,
        personalInsightsResult: undefined,
        overallResults: undefined,
        lastActiveSection: undefined
      };

      await PsychometricTest.findByIdAndUpdate(
        existingTest._id,
        { $set: resetData, $unset: { completedAt: 1, riasecResult: 1, brainProfileResult: 1, employabilityResult: 1, personalInsightsResult: 1, overallResults: 1, lastActiveSection: 1 } },
        { new: true }
      );

      const updatedTest = await PsychometricTest.findById(existingTest._id);
      console.log(`✅ Test reset successfully: ${updatedTest?.testId}`);
      return updatedTest!;
    } else {
      // Create new test only if no existing test found
      const newTestData = {
        userId: userObjectId,
        status: 'in_progress' as const,
        startedAt: new Date(),
        totalTimeSpent: 0,
        sectionsCompleted: {
          riasec: false,
          brainProfile: false,
          employability: false,
          personalInsights: false,
        },
        progressData: {
          currentQuestionIndex: 0,
          partialResponses: {}
        }
      };

      const newTest = new PsychometricTest(newTestData);
      await newTest.save();
      
      console.log(`✅ Created new test: ${newTest.testId}`);
      return newTest;
    }
  } catch (error) {
    console.error('❌ Error starting new test session:', error);
    throw new Error(`Failed to start new test session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get test dashboard data with proper status logic
 */

static async getTestDashboardData(userId: string): Promise<{
  testData: IPsychometricTest;
  completedCount: number;
  allCompleted: boolean;
  sectionStatus: { [key: string]: 'available' | 'completed_locked' | 'completed_available' };
}> {
  try {
    const testData = await this.getOrCreateTest(userId);
    
    const sectionsCompleted = testData.sectionsCompleted || {
      riasec: false,
      brainProfile: false,
      employability: false,
      personalInsights: false,
    };
    
    const completedCount = Object.values(sectionsCompleted).filter(Boolean).length;
    const allCompleted = Object.values(sectionsCompleted).every(Boolean);
    
    const sectionStatus: { [key: string]: "available" | "completed_locked" | "completed_available" } = {};
    
    Object.keys(sectionsCompleted).forEach(sectionId => {
      if (sectionsCompleted[sectionId as keyof typeof sectionsCompleted]) {
        // If section is completed
        sectionStatus[sectionId] = allCompleted ? 'completed_available' : 'completed_locked';
      } else {
        // If section is not completed
        sectionStatus[sectionId] = 'available';
      }
    });

    return {
      testData,
      completedCount,
      allCompleted,
      sectionStatus
    };
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error);
    throw error;
  }
}

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<any> {
    try {
      const [stats] = await PsychometricTest.aggregate([
        {
          $facet: {
            totalTests: [{ $count: "count" }],
            completedTests: [
              { $match: { status: 'completed' } },
              { $count: "count" }
            ],
            avgCompletionTime: [
              { $match: { status: 'completed' } },
              { $group: { _id: null, avgTime: { $avg: '$totalTimeSpent' } } }
            ],
            topHollandCodes: [
              { 
                $match: { 
                  status: 'completed', 
                  'overallResults.hollandCode': { $exists: true } 
                } 
              },
              { 
                $group: { 
                  _id: '$overallResults.hollandCode', 
                  count: { $sum: 1 } 
                } 
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]);

      const totalTests = stats.totalTests[0]?.count || 0;
      const completedTests = stats.completedTests[0]?.count || 0;

      return {
        totalTests,
        completedTests,
        completionRate: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
        avgCompletionTime: Math.round(stats.avgCompletionTime[0]?.avgTime || 0),
        topHollandCodes: stats.topHollandCodes.map((item: any) => ({
          code: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      console.error('❌ Error getting platform stats:', error);
      throw error;
    }
  }
}

export default PsychometricTestService;