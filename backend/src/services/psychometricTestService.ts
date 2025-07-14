import { Types } from 'mongoose';
import PsychometricTest, { 
  IPsychometricTest, 
  IRiasecScores, 
  IBrainScores, 
  IStepsScores,
  IPersonalInsights,
  ITestResult 
} from '../models/PsychometricTest.model';

export class PsychometricTestService {
  
  /**
   * Create or get existing test for user
   */
  static async getOrCreateTest(userId: string): Promise<IPsychometricTest> {
    try {
      // Check for existing in-progress test
      let test = await PsychometricTest.findOne({
        userId: new Types.ObjectId(userId),
        status: 'in_progress'
      });

      if (!test) {
        // Create new test
        test = new PsychometricTest({
          userId: new Types.ObjectId(userId),
          status: 'in_progress',
          startedAt: new Date(),
          totalTimeSpent: 0,
          sectionsCompleted: {
            riasec: false,
            brainProfile: false,
            employability: false,
            personalInsights: false,
          }
        });

        await test.save();
      }

      return test;
    } catch (error) {
      throw new Error(`Failed to get or create test: ${error}`);
    }
  }

  /**
   * Save RIASEC section results
   */
  static async saveRiasecResults(
    userId: string, 
    responses: { [questionId: string]: boolean },
    timeSpent: number
  ): Promise<IPsychometricTest> {
    try {
      const test = await this.getOrCreateTest(userId);

      // Calculate RIASEC scores
      const scores = this.calculateRiasecScores(responses);
      
      // Generate interpretation and recommendations
      const interpretation = this.generateRiasecInterpretation(scores);
      const recommendations = this.generateRiasecRecommendations(scores);

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

      // Update test
      test.riasecResult = testResult;
      test.sectionsCompleted.riasec = true;
      test.totalTimeSpent += timeSpent;

      await test.save();
      return test;
    } catch (error) {
      throw new Error(`Failed to save RIASEC results: ${error}`);
    }
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
      const test = await this.getOrCreateTest(userId);

      // Calculate brain scores
      const scores = this.calculateBrainScores(responses);
      
      // Generate interpretation and recommendations
      const interpretation = this.generateBrainInterpretation(scores);
      const recommendations = this.generateBrainRecommendations(scores);

      // Create test result
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

      // Update test
      test.brainProfileResult = testResult;
      test.sectionsCompleted.brainProfile = true;
      test.totalTimeSpent += timeSpent;

      await test.save();
      return test;
    } catch (error) {
      throw new Error(`Failed to save brain profile results: ${error}`);
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
      const test = await this.getOrCreateTest(userId);

      // Calculate STEPS scores
      const scores = this.calculateStepsScores(responses);
      
      // Generate interpretation and recommendations
      const interpretation = this.generateStepsInterpretation(scores);
      const recommendations = this.generateStepsRecommendations(scores);

      // Create test result
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

      // Update test
      test.employabilityResult = testResult;
      test.sectionsCompleted.employability = true;
      test.totalTimeSpent += timeSpent;

      await test.save();
      return test;
    } catch (error) {
      throw new Error(`Failed to save employability results: ${error}`);
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
      const test = await this.getOrCreateTest(userId);

      // Update test
      test.personalInsightsResult = {
        sectionId: 'personalInsights',
        sectionName: 'Personal Insights',
        completedAt: new Date(),
        responses: insights
      };
      test.sectionsCompleted.personalInsights = true;
      test.totalTimeSpent += timeSpent;

      await test.save();
      return test;
    } catch (error) {
      throw new Error(`Failed to save personal insights: ${error}`);
    }
  }

  /**
   * Get test results for user
   */
  static async getTestResults(userId: string, testId?: string): Promise<IPsychometricTest | null> {
    try {
      const query: any = { userId: new Types.ObjectId(userId) };
      
      if (testId) {
        query.testId = testId;
      } else {
        // Get latest test
        return await PsychometricTest.findOne(query)
          .sort({ createdAt: -1 })
          .exec();
      }

      return await PsychometricTest.findOne(query).exec();
    } catch (error) {
      throw new Error(`Failed to get test results: ${error}`);
    }
  }

  /**
   * Get user's test history
   */
  static async getTestHistory(userId: string): Promise<IPsychometricTest[]> {
    try {
      return await PsychometricTest.find({ 
        userId: new Types.ObjectId(userId) 
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
    } catch (error) {
      throw new Error(`Failed to get test history: ${error}`);
    }
  }

  /**
   * Calculate RIASEC scores from responses
   */
  private static calculateRiasecScores(responses: { [questionId: string]: boolean }): IRiasecScores {
    const scores: IRiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // RIASEC question mapping (based on your document)
    const questionTagMapping: { [questionId: string]: keyof IRiasecScores } = {
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
   * Calculate Brain Profile scores from responses
   */
  private static calculateBrainScores(responses: { [questionId: string]: number[] }): IBrainScores {
    const scores: IBrainScores = { L1: 0, L2: 0, R1: 0, R2: 0 };

    Object.values(responses).forEach(rankings => {
      // Rankings are 1-4, where 4 is "most like me"
      scores.L2 += rankings[1] || 0; // Second option is L2
      scores.R1 += rankings[2] || 0; // Third option is R1
      scores.R2 += rankings[3] || 0; // Fourth option is R2
    });

    return scores;
  }

  /**
   * Calculate STEPS scores from responses
   */
  private static calculateStepsScores(responses: { [questionId: string]: number }): IStepsScores {
    const scores: IStepsScores = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };
    const counts = { S: 0, T: 0, E: 0, P: 0, Speaking: 0 };

    // STEPS question mapping (based on your document)
    const questionTagMapping: { [questionId: string]: keyof IStepsScores } = {
      '1': 'S', '2': 'S', '3': 'S', '4': 'S', '5': 'S',     // Self Management
      '6': 'T', '7': 'T', '8': 'T', '9': 'T', '10': 'T',    // Team Work
      '11': 'E', '12': 'E', '13': 'E', '14': 'E', '15': 'E', // Enterprising
      '16': 'P', '17': 'P', '18': 'P', '19': 'P', '20': 'P', // Problem Solving
      '21': 'Speaking', '22': 'Speaking', '23': 'Speaking', '24': 'Speaking', '25': 'Speaking' // Speaking & Listening
    };

    Object.entries(responses).forEach(([questionId, score]) => {
      const tag = questionTagMapping[questionId];
      if (tag && score >= 1 && score <= 5) {
        scores[tag] += score;
        counts[tag]++;
      }
    });

    // Calculate averages
    Object.keys(scores).forEach(key => {
      const k = key as keyof IStepsScores;
      if (counts[k] > 0) {
        scores[k] = scores[k] / counts[k];
      }
    });

    return scores;
  }

  /**
   * Generate RIASEC interpretation
   */
  private static generateRiasecInterpretation(scores: IRiasecScores): string {
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const topThree = sortedScores.map(([letter]) => letter).join('');
    
    const interpretations = {
      'R': 'Realistic (Doers) - You prefer hands-on work and practical activities',
      'I': 'Investigative (Thinkers) - You enjoy research, analysis, and intellectual challenges',
      'A': 'Artistic (Creators) - You are drawn to creative and expressive activities',
      'S': 'Social (Helpers) - You like working with and helping people',
      'E': 'Enterprising (Persuaders) - You enjoy leadership and business activities',
      'C': 'Conventional (Organizers) - You prefer structured, detail-oriented work'
    };

    const descriptions = sortedScores.map(([letter, score]) => 
      `${interpretations[letter as keyof typeof interpretations]} (${score} points)`
    );

    return `Your Holland Code is ${topThree}. Your top interests are: ${descriptions.join(', ')}`;
  }

  /**
   * Generate RIASEC recommendations
   */
  private static generateRiasecRecommendations(scores: IRiasecScores): string[] {
    const topInterests = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([letter]) => letter);
    
    const recommendations = {
      'R': ['Engineering', 'Agriculture', 'Construction', 'Mechanics', 'Outdoor Work'],
      'I': ['Research', 'Science', 'Medicine', 'Technology', 'Analysis'],
      'A': ['Design', 'Writing', 'Music', 'Theatre', 'Visual Arts'],
      'S': ['Teaching', 'Counseling', 'Healthcare', 'Social Work', 'Human Resources'],
      'E': ['Business', 'Sales', 'Management', 'Entrepreneurship', 'Politics'],
      'C': ['Accounting', 'Administration', 'Banking', 'Data Management', 'Operations']
    };

    const careerList: string[] = [];
    topInterests.forEach(interest => {
      careerList.push(...recommendations[interest as keyof typeof recommendations]);
    });

    return [...new Set(careerList)].slice(0, 8);
  }

  /**
   * Generate Brain Profile interpretation
   */
  private static generateBrainInterpretation(scores: IBrainScores): string {
    const sortedScores = Object.entries(scores)
      .sort(([,a], [,b]) => b - a);
    
    const interpretations = {
      'L1': 'Analyst and Realist - You are logical, practical, and fact-based',
      'L2': 'Conservative/Organizer - You are structured, detailed, and systematic',
      'R1': 'Strategist and Imaginative - You are creative, innovative, and big-picture focused',
      'R2': 'Socializer and Empathic - You are people-oriented, emotional, and collaborative'
    };

    const topTwo = sortedScores.slice(0, 2);
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    
    const descriptions = topTwo.map(([quad, score]) => 
      `${interpretations[quad as keyof typeof interpretations]} (${Math.round((score / total) * 100)}%)`
    );

    return `Your dominant brain quadrants are ${descriptions.join(' and ')}`;
  }

  /**
   * Generate Brain Profile recommendations
   */
  private static generateBrainRecommendations(scores: IBrainScores): string[] {
    const topQuadrant = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const recommendations = {
      'L1': ['Use logical frameworks and step-by-step approaches', 'Focus on facts and data-driven learning'],
      'L2': ['Create structured study schedules', 'Use detailed notes and organized materials'],
      'R1': ['Engage in creative problem-solving', 'Use visual aids and mind maps'],
      'R2': ['Learn through group discussions', 'Seek mentors who provide emotional support']
    };

    return recommendations[topQuadrant as keyof typeof recommendations] || ['General learning recommendations'];
  }

  /**
   * Generate STEPS interpretation
   */
  private static generateStepsInterpretation(scores: IStepsScores): string {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
    const employabilityQuotient = (avgScore / 5) * 10;
    
    let assessment = '';
    if (employabilityQuotient >= 8) assessment = 'Excellent job readiness!';
    else if (employabilityQuotient >= 6) assessment = 'Good potential with room for improvement.';
    else if (employabilityQuotient >= 4) assessment = 'Moderate job readiness - focus on skill development.';
    else assessment = 'Significant improvement needed in key employability skills.';

    return `Your Employability Quotient is ${employabilityQuotient.toFixed(1)}/10. ${assessment}`;
  }

  /**
   * Generate STEPS recommendations
   */
  private static generateStepsRecommendations(scores: IStepsScores): string[] {
    const weakAreas = Object.entries(scores)
      .filter(([, score]) => score < 3.5)
      .map(([area]) => area);
    
    const improvements = {
      'S': 'Focus on self-management skills: time management, grooming, emotional control',
      'T': 'Develop teamwork skills: empathy, adaptability, conflict resolution',
      'E': 'Build enterprising skills: leadership, networking, risk management',
      'P': 'Enhance problem-solving: critical thinking, creativity, resilience',
      'Speaking': 'Improve communication: verbal skills, listening, body language'
    };

    if (weakAreas.length > 0) {
      return weakAreas.map(area => improvements[area as keyof typeof improvements]);
    }

    return ['Continue developing all areas to maintain high employability'];
  }

  /**
   * Delete test (if user wants to restart)
   */
  static async deleteTest(userId: string, testId: string): Promise<boolean> {
    try {
      const result = await PsychometricTest.deleteOne({
        userId: new Types.ObjectId(userId),
        testId,
        status: 'in_progress' // Only allow deletion of in-progress tests
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete test: ${error}`);
    }
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<any> {
    try {
      const [
        totalTests,
        completedTests,
        avgCompletionTime,
        topHollandCodes
      ] = await Promise.all([
        PsychometricTest.countDocuments(),
        PsychometricTest.countDocuments({ status: 'completed' }),
        PsychometricTest.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, avgTime: { $avg: '$totalTimeSpent' } } }
        ]),
        PsychometricTest.aggregate([
          { $match: { status: 'completed', 'overallResults.hollandCode': { $exists: true } } },
          { $group: { _id: '$overallResults.hollandCode', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalTests,
        completedTests,
        completionRate: totalTests > 0 ? (completedTests / totalTests) * 100 : 0,
        avgCompletionTime: avgCompletionTime[0]?.avgTime || 0,
        topHollandCodes: topHollandCodes.map((item: any) => ({
          code: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get platform stats: ${error}`);
    }
  }
}

export default PsychometricTestService;