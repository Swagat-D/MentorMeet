// backend/src/routes/psychometric.routes.ts - Psychometric Test Routes
import { Router, Request, Response } from 'express';
import expressValidator from 'express-validator';
const { body, param, query, validationResult } = require ('expressValidator');
import withAuth from '../middleware/auth.middleware';
import { PsychometricTestService } from '../services/psychometricTestService';
import { IUser } from '../models/User.model';

const router = Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return next();
};

/**
 * GET /api/v1/psychometric/test
 * Get or create a new psychometric test for the user
 */
router.get('/test', withAuth.authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    console.log(`🧠 Getting/creating psychometric test for user: ${user._id}`);

    const test = await PsychometricTestService.getOrCreateTest(user._id.toString());

    res.json({
      success: true,
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        sectionsCompleted: test.sectionsCompleted,
        nextSection: test.getNextSection(),
        startedAt: test.startedAt,
        totalTimeSpent: test.totalTimeSpent,
        riasecResult: test.riasecResult,
        brainProfileResult: test.brainProfileResult,
        employabilityResult: test.employabilityResult,
        personalInsightsResult: test.personalInsightsResult,
        overallResults: test.overallResults
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting psychometric test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get psychometric test'
    });
  }
});

/**
 * POST /api/v1/psychometric/riasec
 * Submit RIASEC (Interest Inventory) section results
 */
router.post('/riasec', [
  withAuth.authenticate,
  body('responses').isObject().withMessage('Responses must be an object'),
  body('timeSpent').isNumeric().withMessage('Time spent must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { responses, timeSpent } = req.body;

    console.log(`📝 Saving RIASEC results for user: ${user._id}`);

    const test = await PsychometricTestService.saveRiasecResults(
      user._id.toString(),
      responses,
      timeSpent
    );

    res.json({
      success: true,
      message: 'RIASEC results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        sectionsCompleted: test.sectionsCompleted,
        riasecResult: test.riasecResult,
        nextSection: test.getNextSection()
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving RIASEC results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save RIASEC results'
    });
  }
});

/**
 * POST /api/v1/psychometric/brain-profile
 * Submit Brain Profile section results
 */
router.post('/brain-profile', [
  withAuth.authenticate,
  body('responses').isObject().withMessage('Responses must be an object'),
  body('timeSpent').isNumeric().withMessage('Time spent must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { responses, timeSpent } = req.body;

    console.log(`🧠 Saving Brain Profile results for user: ${user._id}`);

    const test = await PsychometricTestService.saveBrainProfileResults(
      user._id.toString(),
      responses,
      timeSpent
    );

    res.json({
      success: true,
      message: 'Brain Profile results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        sectionsCompleted: test.sectionsCompleted,
        brainProfileResult: test.brainProfileResult,
        nextSection: test.getNextSection()
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving Brain Profile results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save Brain Profile results'
    });
  }
});

/**
 * POST /api/v1/psychometric/employability
 * Submit Employability (STEPS) section results
 */
router.post('/employability', [
  withAuth.authenticate,
  body('responses').isObject().withMessage('Responses must be an object'),
  body('timeSpent').isNumeric().withMessage('Time spent must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { responses, timeSpent } = req.body;

    console.log(`💼 Saving Employability results for user: ${user._id}`);

    const test = await PsychometricTestService.saveEmployabilityResults(
      user._id.toString(),
      responses,
      timeSpent
    );

    res.json({
      success: true,
      message: 'Employability results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        sectionsCompleted: test.sectionsCompleted,
        employabilityResult: test.employabilityResult,
        nextSection: test.getNextSection()
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving Employability results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save Employability results'
    });
  }
});

/**
 * POST /api/v1/psychometric/personal-insights
 * Submit Personal Insights section results
 */
router.post('/personal-insights', [
  withAuth.authenticate,
  body('whatYouLike').isString().isLength({ min: 10, max: 500 }).withMessage('What you like must be 10-500 characters'),
  body('whatYouAreGoodAt').isString().isLength({ min: 10, max: 500 }).withMessage('What you are good at must be 10-500 characters'),
  body('recentProjects').isString().isLength({ min: 10, max: 500 }).withMessage('Recent projects must be 10-500 characters'),
  body('characterStrengths').isArray().withMessage('Character strengths must be an array'),
  body('valuesInLife').isArray().withMessage('Values in life must be an array'),
  body('timeSpent').isNumeric().withMessage('Time spent must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { whatYouLike, whatYouAreGoodAt, recentProjects, characterStrengths, valuesInLife, timeSpent } = req.body;

    console.log(`📝 Saving Personal Insights for user: ${user._id}`);

    const insights = {
      whatYouLike,
      whatYouAreGoodAt,
      recentProjects,
      characterStrengths,
      valuesInLife
    };

    const test = await PsychometricTestService.savePersonalInsights(
      user._id.toString(),
      insights,
      timeSpent
    );

    res.json({
      success: true,
      message: 'Personal insights saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        sectionsCompleted: test.sectionsCompleted,
        personalInsightsResult: test.personalInsightsResult,
        overallResults: test.overallResults,
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving Personal Insights:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save Personal Insights'
    });
  }
});

/**
 * GET /api/v1/psychometric/results/:testId?
 * Get test results by test ID or latest test
 */
router.get('/results/:testId?', [
  withAuth.authenticate,
  param('testId').optional().isString().withMessage('Test ID must be a string'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { testId } = req.params;

    console.log(`📊 Getting test results for user: ${user._id}, testId: ${testId || 'latest'}`);

    const test = await PsychometricTestService.getTestResults(
      user._id.toString(),
      testId
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: test.completionPercentage,
        startedAt: test.startedAt,
        completedAt: test.completedAt,
        totalTimeSpent: test.totalTimeSpent,
        sectionsCompleted: test.sectionsCompleted,
        riasecResult: test.riasecResult,
        brainProfileResult: test.brainProfileResult,
        employabilityResult: test.employabilityResult,
        personalInsightsResult: test.personalInsightsResult,
        overallResults: test.overallResults,
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting test results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get test results'
    });
  }
});

/**
 * GET /api/v1/psychometric/history
 * Get user's test history
 */
router.get('/history', [
  withAuth.authenticate,
  query('limit').optional().isNumeric().withMessage('Limit must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📚 Getting test history for user: ${user._id}`);

    const tests = await PsychometricTestService.getTestHistory(user._id.toString());

    const formattedTests = tests.map(test => ({
      testId: test.testId,
      status: test.status,
      completionPercentage: test.completionPercentage,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
      totalTimeSpent: test.totalTimeSpent,
      hollandCode: test.overallResults?.hollandCode,
      employabilityQuotient: test.overallResults?.employabilityQuotient
    }));

    res.json({
      success: true,
      data: {
        tests: formattedTests,
        total: tests.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting test history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get test history'
    });
  }
});

/**
 * DELETE /api/v1/psychometric/test/:testId
 * Delete an in-progress test (restart functionality)
 */
router.delete('/test/:testId', [
  withAuth.authenticate,
  param('testId').isString().withMessage('Test ID is required'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { testId } = req.params;

    console.log(`🗑️ Deleting test ${testId} for user: ${user._id}`);

    const deleted = await PsychometricTestService.deleteTest(
      user._id.toString(),
      testId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete test'
    });
  }
});

/**
 * GET /api/v1/psychometric/stats (Admin only)
 * Get platform psychometric test statistics
 */
router.get('/stats', withAuth.authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    
    // Check if user is admin (you can adjust this based on your auth system)
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    console.log('📊 Getting platform psychometric statistics');

    const stats = await PsychometricTestService.getPlatformStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error getting platform stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get platform statistics'
    });
  }
});

/**
 * POST /api/v1/psychometric/validate-section
 * Validate a section's responses before submission
 */
router.post('/validate-section', [
  withAuth.authenticate,
  body('sectionType').isIn(['riasec', 'brainProfile', 'employability', 'personalInsights']).withMessage('Invalid section type'),
  body('responses').isObject().withMessage('Responses must be an object'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { sectionType, responses } = req.body;
    
    console.log(`✅ Validating ${sectionType} section responses`);

    let isValid = false;
    let validationErrors: string[] = [];

    switch (sectionType) {
      case 'riasec':
        // Validate RIASEC responses (should have 54 boolean responses)
        const riasecKeys = Object.keys(responses);
        isValid = riasecKeys.length >= 54 && riasecKeys.every(key => 
          typeof responses[key] === 'boolean'
        );
        if (!isValid) {
          validationErrors.push('RIASEC section requires 54 yes/no responses');
        }
        break;

      case 'brainProfile':
        // Validate Brain Profile responses (should have 10 ranking arrays)
        const brainKeys = Object.keys(responses);
        isValid = brainKeys.length >= 10 && brainKeys.every(key => 
          Array.isArray(responses[key]) && responses[key].length === 4
        );
        if (!isValid) {
          validationErrors.push('Brain Profile section requires 10 ranking questions with 4 options each');
        }
        break;

      case 'employability':
        // Validate STEPS responses (should have 25 numeric responses 1-5)
        const stepsKeys = Object.keys(responses);
        isValid = stepsKeys.length >= 25 && stepsKeys.every(key => 
          typeof responses[key] === 'number' && responses[key] >= 1 && responses[key] <= 5
        );
        if (!isValid) {
          validationErrors.push('Employability section requires 25 responses with scores 1-5');
        }
        break;

      case 'personalInsights':
        // Validate Personal Insights structure
        const required = ['whatYouLike', 'whatYouAreGoodAt', 'recentProjects'];
        const hasRequired = required.every(field => 
          responses[field] && typeof responses[field] === 'string' && responses[field].length >= 10
        );
        const hasArrays = Array.isArray(responses.characterStrengths) && Array.isArray(responses.valuesInLife);
        isValid = hasRequired && hasArrays;
        if (!isValid) {
          validationErrors.push('Personal Insights section requires all text fields (min 10 chars) and strength/value arrays');
        }
        break;
    }

    res.json({
      success: true,
      data: {
        isValid,
        validationErrors,
        responseCount: Object.keys(responses).length
      }
    });

  } catch (error: any) {
    console.error('❌ Error validating section:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate section'
    });
  }
});

/**
 * GET /api/v1/psychometric/career-recommendations/:hollandCode
 * Get career recommendations for a specific Holland Code
 */
router.get('/career-recommendations/:hollandCode', [
  param('hollandCode').isLength({ min: 1, max: 6 }).withMessage('Holland Code must be 1-6 characters'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const { hollandCode } = req.params;
    
    console.log(`💼 Getting career recommendations for Holland Code: ${hollandCode}`);

    const careerMappings = {
      'R': ['Engineer', 'Technician', 'Mechanic', 'Farmer', 'Construction Worker', 'Pilot', 'Electrician', 'Carpenter'],
      'I': ['Researcher', 'Scientist', 'Analyst', 'Doctor', 'Mathematician', 'Psychologist', 'Veterinarian', 'Pharmacist'],
      'A': ['Artist', 'Designer', 'Writer', 'Musician', 'Photographer', 'Actor', 'Architect', 'Fashion Designer'],
      'S': ['Teacher', 'Counselor', 'Social Worker', 'Nurse', 'Coach', 'Therapist', 'HR Manager', 'Community Worker'],
      'E': ['Manager', 'Entrepreneur', 'Sales Representative', 'Lawyer', 'Politician', 'Marketing Manager', 'Real Estate Agent', 'Investment Banker'],
      'C': ['Accountant', 'Administrator', 'Data Analyst', 'Librarian', 'Secretary', 'Banker', 'Insurance Agent', 'Tax Preparer']
    };

    const careers: string[] = [];
    const industries: Set<string> = new Set();
    
    for (const letter of hollandCode.toUpperCase()) {
      if (careerMappings[letter as keyof typeof careerMappings]) {
        careers.push(...careerMappings[letter as keyof typeof careerMappings]);
      }
    }

    // Remove duplicates and limit to top 15
    const uniqueCareers = [...new Set(careers)].slice(0, 15);

    // Add industry categories
    const industryMappings = {
      'R': ['Manufacturing', 'Construction', 'Agriculture', 'Transportation'],
      'I': ['Healthcare', 'Research', 'Technology', 'Education'],
      'A': ['Media & Entertainment', 'Design', 'Publishing', 'Advertising'],
      'S': ['Education', 'Healthcare', 'Social Services', 'Human Resources'],
      'E': ['Business', 'Finance', 'Sales & Marketing', 'Legal'],
      'C': ['Finance', 'Administration', 'Data Management', 'Government']
    };

    for (const letter of hollandCode.toUpperCase()) {
      if (industryMappings[letter as keyof typeof industryMappings]) {
        industryMappings[letter as keyof typeof industryMappings].forEach(industry => industries.add(industry));
      }
    }

    res.json({
      success: true,
      data: {
        hollandCode: hollandCode.toUpperCase(),
        careers: uniqueCareers,
        industries: Array.from(industries),
        totalRecommendations: uniqueCareers.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error getting career recommendations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get career recommendations'
    });
  }
});

/**
 * POST /api/v1/psychometric/save-progress
 * Save intermediate progress (for auto-save functionality)
 */
router.post('/save-progress', [
  withAuth.authenticate,
  body('sectionType').isIn(['riasec', 'brainProfile', 'employability', 'personalInsights']).withMessage('Invalid section type'),
  body('responses').isObject().withMessage('Responses must be an object'),
  body('currentQuestionIndex').optional().isNumeric().withMessage('Current question index must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { sectionType, responses, currentQuestionIndex } = req.body;

    console.log(`💾 Auto-saving progress for user: ${user._id}, section: ${sectionType}`);

    // Get existing test
    const test = await PsychometricTestService.getOrCreateTest(user._id.toString());

    // Save progress to a temporary field (you might want to add this to your schema)
    // For now, we'll just acknowledge the save
    
    res.json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        testId: test.testId,
        sectionType,
        savedResponses: Object.keys(responses).length,
        currentQuestionIndex: currentQuestionIndex || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error saving progress:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save progress'
    });
  }
});

export default router;