// src/routes/onboarding.routes.ts - Onboarding Routes
import { Router } from 'express';
import onboardingController from '../controllers/onboarding.controller';
import { authenticate, requireEmailVerification } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  onboardingBasicSchema,
  onboardingGoalsSchema,
  completeOnboardingSchema,
} from '../validations/auth.validation';

const router = Router();

// All onboarding routes require authentication and email verification
router.use(authenticate);
router.use(requireEmailVerification);

/**
 * @route   GET /api/v1/onboarding/status
 * @desc    Get current onboarding status
 * @access  Private
 */
router.get(
  '/status',
  onboardingController.getOnboardingStatus
);

/**
 * @route   GET /api/v1/onboarding/options
 * @desc    Get available onboarding options (genders, age ranges, etc.)
 * @access  Private
 */
router.get(
  '/options',
  onboardingController.getOnboardingOptions
);

/**
 * @route   PUT /api/v1/onboarding/basic
 * @desc    Update basic onboarding information (gender, age, study level)
 * @access  Private
 */
router.put(
  '/basic',
  authRateLimit,
  validate(onboardingBasicSchema),
  onboardingController.updateBasicInfo
);

/**
 * @route   PUT /api/v1/onboarding/goals
 * @desc    Update learning goals
 * @access  Private
 */
router.put(
  '/goals',
  authRateLimit,
  validate(onboardingGoalsSchema),
  onboardingController.updateGoals
);

/**
 * @route   POST /api/v1/onboarding/complete
 * @desc    Complete the entire onboarding process
 * @access  Private
 */
router.post(
  '/complete',
  authRateLimit,
  validate(completeOnboardingSchema),
  onboardingController.completeOnboarding
);

/**
 * @route   POST /api/v1/onboarding/skip
 * @desc    Skip onboarding with default values
 * @access  Private
 */
router.post(
  '/skip',
  authRateLimit,
  onboardingController.skipOnboarding
);

/**
 * @route   POST /api/v1/onboarding/reset
 * @desc    Reset onboarding status (for redo)
 * @access  Private
 */
router.post(
  '/reset',
  authRateLimit,
  onboardingController.resetOnboarding
);

export default router;