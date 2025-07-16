// backend/src/routes/psychometric.routes.ts - Production-Ready Routes
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { body, param, query, validationResult } = require('express-validator');
import withAuth from '../middleware/auth.middleware';
import { PsychometricTestService } from '../services/psychometricTestService';
import { IUser } from '../models/User.model';
import mongoose from 'mongoose';

const router = Router();

// Rate limiting for different endpoints
const testRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

const submissionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 submissions per minute
  message: {
    success: false,
    message: 'Too many submissions, please slow down'
  }
});

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

// Error handling middleware
const handleServiceError = (error: any, res: Response, defaultMessage: string) => {
  console.error('❌ Service Error:', error);
  
  if (error.message.includes('Invalid responses count') || 
      error.message.includes('must be at least') ||
      error.message.includes('are required')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.message.includes('No active test found')) {
    return res.status(404).json({
      success: false,
      message: 'No active test found. Please start a new test.'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: defaultMessage,
    ...(process.env.NODE_ENV === 'development' && { debug: error.message })
  });
};

/**
 * GET /api/v1/psychometric/test - Health check
 */
router.get('/test', testRateLimit, (req: Request, res: Response) => {
  console.log('🧪 Psychometric test route accessed');
  return res.json({
    success: true,
    message: 'Psychometric API is working',
    timestamp: new Date().toISOString(),
    models: {
      registered: mongoose.modelNames(),
      psychometricRegistered: mongoose.modelNames().includes('PsychometricTest')
    }
  });
});

/**
 * GET /api/v1/psychometric/user-test - Get or create user test
 */
router.get('/user-test', 
  testRateLimit,
  withAuth.authenticate, 
  async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;
      console.log(`🧠 Getting/creating psychometric test for user: ${user._id}`);

      const test = await PsychometricTestService.getOrCreateTest(user._id.toString());

      return res.json({
        success: true,
        data: {
          testId: test.testId,
          status: test.status,
          completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
          sectionsCompleted: test.sectionsCompleted,
          nextSection: test.getNextSection ? test.getNextSection() : null,
          startedAt: test.startedAt,
          totalTimeSpent: test.totalTimeSpent,
          lastActiveSection: test.lastActiveSection,
          progressData: test.progressData,
          riasecResult: test.riasecResult,
          brainProfileResult: test.brainProfileResult,
          employabilityResult: test.employabilityResult,
          personalInsightsResult: test.personalInsightsResult,
          overallResults: test.overallResults,
          isComplete: test.isComplete()
        }
      });

    } catch (error: any) {
      return handleServiceError(error, res, 'Failed to get psychometric test');
    }
  }
);

/**
 * POST /api/v1/psychometric/riasec - Submit RIASEC results
 */
router.post('/riasec', [
  submissionRateLimit,
  withAuth.authenticate,
  body('responses')
    .isObject()
    .withMessage('Responses must be an object')
    .custom((value : any) => {
      const responseCount = Object.keys(value).length;
      if (responseCount !== 54) {
        throw new Error(`Expected 54 responses, received ${responseCount}`);
      }
      
      const hasInvalidResponses = Object.values(value).some(val => typeof val !== 'boolean');
      if (hasInvalidResponses) {
        throw new Error('All responses must be true/false');
      }
      
      return true;
    }),
  body('timeSpent')
    .isNumeric()
    .withMessage('Time spent must be a number')
    .isInt({ min: 1, max: 7200 })
    .withMessage('Time spent must be between 1 and 7200 seconds'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { responses, timeSpent } = req.body;

    console.log(`📝 Saving RIASEC results for user: ${user._id}`);
    console.log(`📊 Processing ${Object.keys(responses).length} responses`);

    const test = await PsychometricTestService.saveRiasecResults(
      user._id.toString(),
      responses,
      timeSpent
    );

    return res.json({
      success: true,
      message: 'RIASEC results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
        sectionsCompleted: test.sectionsCompleted,
        riasecResult: test.riasecResult,
        nextSection: test.getNextSection(),
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to save RIASEC results');
  }
});

/**
 * POST /api/v1/psychometric/brain-profile - Submit Brain Profile results
 */
router.post('/brain-profile', [
  submissionRateLimit,
  withAuth.authenticate,
  body('responses')
    .isObject()
    .withMessage('Responses must be an object')
    .custom((value: any) => {
      const responseCount = Object.keys(value).length;
      if (responseCount !== 10) {
        throw new Error(`Expected 10 responses, received ${responseCount}`);
      }
      
      const hasInvalidResponses = Object.values(value).some(val => 
        !Array.isArray(val) || val.length !== 4 || val.some(v => typeof v !== 'number')
      );
      if (hasInvalidResponses) {
        throw new Error('All responses must be arrays of 4 numbers');
      }
      
      return true;
    }),
  body('timeSpent')
    .isNumeric()
    .withMessage('Time spent must be a number')
    .isInt({ min: 1, max: 3600 })
    .withMessage('Time spent must be between 1 and 3600 seconds'),
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

    return res.json({
      success: true,
      message: 'Brain Profile results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
        sectionsCompleted: test.sectionsCompleted,
        brainProfileResult: test.brainProfileResult,
        nextSection: test.getNextSection(),
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to save Brain Profile results');
  }
});

/**
 * POST /api/v1/psychometric/employability - Submit Employability results
 */
router.post('/employability', [
  submissionRateLimit,
  withAuth.authenticate,
  body('responses')
    .isObject()
    .withMessage('Responses must be an object')
    .custom((value: any) => {
      const responseCount = Object.keys(value).length;
      if (responseCount !== 25) {
        throw new Error(`Expected 25 responses, received ${responseCount}`);
      }
      
      const hasInvalidResponses = Object.values(value).some(val => 
        typeof val !== 'number' || val < 1 || val > 5
      );
      if (hasInvalidResponses) {
        throw new Error('All responses must be numbers between 1 and 5');
      }
      
      return true;
    }),
  body('timeSpent')
    .isNumeric()
    .withMessage('Time spent must be a number')
    .isInt({ min: 1, max: 3600 })
    .withMessage('Time spent must be between 1 and 3600 seconds'),
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

    return res.json({
      success: true,
      message: 'Employability results saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
        sectionsCompleted: test.sectionsCompleted,
        employabilityResult: test.employabilityResult,
        nextSection: test.getNextSection(),
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to save Employability results');
  }
});

/**
 * POST /api/v1/psychometric/personal-insights - Submit Personal Insights
 */
router.post('/personal-insights', [
  submissionRateLimit,
  withAuth.authenticate,
  body('whatYouLike')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('What you like must be 10-500 characters'),
  body('whatYouAreGoodAt')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('What you are good at must be 10-500 characters'),
  body('recentProjects')
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Recent projects must be 10-500 characters'),
  body('characterStrengths')
    .isArray({ min: 3, max: 10 })
    .withMessage('Character strengths must be an array of 3-10 items'),
  body('valuesInLife')
    .isArray({ min: 3, max: 10 })
    .withMessage('Values in life must be an array of 3-10 items'),
  body('timeSpent')
    .isNumeric()
    .withMessage('Time spent must be a number')
    .isInt({ min: 1, max: 1800 })
    .withMessage('Time spent must be between 1 and 1800 seconds'),
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

    return res.json({
      success: true,
      message: 'Personal insights saved successfully',
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
        sectionsCompleted: test.sectionsCompleted,
        personalInsightsResult: test.personalInsightsResult,
        overallResults: test.overallResults,
        isComplete: test.isComplete()
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to save Personal Insights');
  }
});

/**
 * POST /api/v1/psychometric/save-progress - Auto-save progress
 */
router.post('/save-progress', [
  testRateLimit,
  withAuth.authenticate,
  body('sectionType')
    .isIn(['riasec', 'brainProfile', 'employability', 'personalInsights'])
    .withMessage('Invalid section type'),
  body('responses')
    .isObject()
    .withMessage('Responses must be an object'),
  body('currentQuestionIndex')
    .optional()
    .isNumeric()
    .withMessage('Current question index must be a number'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { sectionType, responses, currentQuestionIndex } = req.body;

    console.log(`💾 Auto-saving progress for user: ${user._id}, section: ${sectionType}`);

    await PsychometricTestService.saveProgress(
      user._id.toString(),
      sectionType,
      responses,
      currentQuestionIndex
    );
    
    return res.json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        sectionType,
        savedResponses: Object.keys(responses).length,
        currentQuestionIndex: currentQuestionIndex || 0
      }
    });

  } catch (error: any) {
    // Don't fail auto-save requests
    console.warn('⚠️ Auto-save failed:', error);
    return res.json({
      success: false,
      message: 'Progress save failed but test continues'
    });
  }
});

/**
 * GET /api/v1/psychometric/results/:testId? - Get test results
 */
router.get('/results/:testId?', [
  testRateLimit,
  withAuth.authenticate,
  param('testId')
    .optional()
    .isString()
    .withMessage('Test ID must be a string'),
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

    return res.json({
      success: true,
      data: {
        testId: test.testId,
        status: test.status,
        completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
        startedAt: test.startedAt,
        completedAt: test.completedAt,
        totalTimeSpent: test.totalTimeSpent,
        sectionsCompleted: test.sectionsCompleted,
        riasecResult: test.riasecResult,
        brainProfileResult: test.brainProfileResult,
        employabilityResult: test.employabilityResult,
        personalInsightsResult: test.personalInsightsResult,
        overallResults: test.overallResults,
        isComplete: test.isComplete ? test.isComplete() : false
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to get test results');
  }
});

/**
 * GET /api/v1/psychometric/history - Get test history
 */
router.get('/history', [
  testRateLimit,
  withAuth.authenticate,
  query('limit')
    .optional()
    .isNumeric()
    .withMessage('Limit must be a number')
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const limit = parseInt(req.query.limit as string) || 10;

    console.log(`📚 Getting test history for user: ${user._id}`);

    const tests = await PsychometricTestService.getTestHistory(user._id.toString(), limit);

    const formattedTests = tests.map(test => ({
      testId: test.testId,
      status: test.status,
      completionPercentage: Math.round((Object.values(test.sectionsCompleted).filter(Boolean).length / 4) * 100),
      startedAt: test.startedAt,
      completedAt: test.completedAt,
      totalTimeSpent: test.totalTimeSpent,
      hollandCode: test.overallResults?.hollandCode,
      employabilityQuotient: test.overallResults?.employabilityQuotient
    }));

    return res.json({
      success: true,
      data: {
        tests: formattedTests,
        total: tests.length
      }
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to get test history');
  }
});

/**
 * DELETE /api/v1/psychometric/test/:testId - Delete test
 */
router.delete('/test/:testId', [
  submissionRateLimit,
  withAuth.authenticate,
  param('testId')
    .isString()
    .withMessage('Test ID is required'),
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

    return res.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to delete test');
  }
});

/**
 * POST /api/v1/psychometric/validate-section - Validate section responses
 */
router.post('/validate-section', [
  testRateLimit,
  withAuth.authenticate,
  body('sectionType')
    .isIn(['riasec', 'brainProfile', 'employability', 'personalInsights'])
    .withMessage('Invalid section type'),
  body('responses')
    .isObject()
    .withMessage('Responses must be an object'),
  validateRequest
], async (req: Request, res: Response) => {
  try {
    console.log('🔍 Validation route accessed');
    console.log('📥 Request body:', req.body);
    
    const { sectionType, responses } = req.body;
    
    let isValid = false;
    let validationErrors: string[] = [];
    const responseCount = Object.keys(responses).length;

    console.log(`📊 Validating ${sectionType} with ${responseCount} responses`);

    switch (sectionType) {
      case 'riasec':
        isValid = responseCount === 54 && Object.values(responses).every(val => typeof val === 'boolean');
        if (!isValid) {
          validationErrors.push(`RIASEC requires 54 boolean responses. Got ${responseCount}`);
        }
        break;

      case 'brainProfile':
        isValid = responseCount === 10 && Object.values(responses).every(val => 
          Array.isArray(val) && val.length === 4 && val.every(v => typeof v === 'number')
        );
        if (!isValid) {
          validationErrors.push('Brain Profile requires 10 ranking arrays of 4 numbers each');
        }
        break;

      case 'employability':
        isValid = responseCount === 25 && Object.values(responses).every(val => 
          typeof val === 'number' && val >= 1 && val <= 5
        );
        if (!isValid) {
          validationErrors.push('Employability requires 25 numeric responses (1-5)');
        }
        break;

      case 'personalInsights':
        const required = ['whatYouLike', 'whatYouAreGoodAt', 'recentProjects'];
        const hasRequired = required.every(field => 
          responses[field] && typeof responses[field] === 'string' && responses[field].length >= 10
        );
        const hasArrays = Array.isArray(responses.characterStrengths) && 
                         Array.isArray(responses.valuesInLife) &&
                         responses.characterStrengths.length >= 3 &&
                         responses.valuesInLife.length >= 3;
        isValid = hasRequired && hasArrays;
        if (!isValid) {
          validationErrors.push('Personal Insights missing required fields or insufficient data');
        }
        break;
    }

    console.log(`✅ Validation result: ${isValid}`);

    return res.json({
      success: true,
      data: {
        isValid,
        validationErrors,
        responseCount
      }
    });

  } catch (error: any) {
    console.error('❌ Validation route error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Validation failed'
    });
  }
});

/**
 * GET /api/v1/psychometric/career-recommendations/:hollandCode - Get career recommendations
 */
router.get('/career-recommendations/:hollandCode', [
  testRateLimit,
  param('hollandCode')
    .isLength({ min: 1, max: 6 })
    .withMessage('Holland Code must be 1-6 characters')
    .matches(/^[RIASEC]+$/)
    .withMessage('Holland Code must contain only letters R, I, A, S, E, C'),
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

    const industryMappings = {
      'R': ['Manufacturing', 'Construction', 'Agriculture', 'Transportation'],
      'I': ['Healthcare', 'Research', 'Technology', 'Education'],
      'A': ['Media & Entertainment', 'Design', 'Publishing', 'Advertising'],
      'S': ['Education', 'Healthcare', 'Social Services', 'Human Resources'],
      'E': ['Business', 'Finance', 'Sales & Marketing', 'Legal'],
      'C': ['Finance', 'Administration', 'Data Management', 'Government']
    };

    const careers: string[] = [];
    const industries: Set<string> = new Set();
    
    for (const letter of hollandCode.toUpperCase()) {
      if (careerMappings[letter as keyof typeof careerMappings]) {
        careers.push(...careerMappings[letter as keyof typeof careerMappings]);
      }
      if (industryMappings[letter as keyof typeof industryMappings]) {
        industryMappings[letter as keyof typeof industryMappings].forEach(industry => industries.add(industry));
      }
    }

    const uniqueCareers = [...new Set(careers)].slice(0, 15);

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: 'Failed to get career recommendations'
    });
  }
});

/**
 * GET /api/v1/psychometric/stats - Platform statistics (Admin only)
 */
router.get('/stats', [
  testRateLimit,
  withAuth.authenticate
], async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    console.log('📊 Getting platform psychometric statistics');

    const stats = await PsychometricTestService.getPlatformStats();

    return res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    return handleServiceError(error, res, 'Failed to get platform statistics');
  }
});

export default router;