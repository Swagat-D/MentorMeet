// src/routes/auth.routes.ts - Authentication Routes (Fixed with relative imports)
import { Router } from 'express';
import authController from '../controllers/auth.controller';
import googleAuthController from '../controllers/google-auth.controller';
import { authenticate, requireEmailVerification } from '../middleware/auth.middleware';
import { authRateLimit, otpRateLimit, passwordResetRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  onboardingBasicSchema,
  onboardingGoalsSchema,
} from '../validations/auth.validation';
import { googleAuthSchema, unlinkGoogleSchema } from '../validations/auth.validation';

const router = Router();

// Public routes (no authentication required)

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
router.post(
  '/verify-email',
  authRateLimit,
  validate(verifyOTPSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth login/signup
 * @access  Public
 */
router.post(
  '/google',
  authRateLimit,
  validate(googleAuthSchema),
  googleAuthController.googleAuth
);

/**
 * @route   POST /api/v1/auth/unlink-google
 * @desc    Unlink Google account and set password
 * @access  Private
 */
router.post(
  '/unlink-google',
  authenticate,
  requireEmailVerification,
  validate(unlinkGoogleSchema),
  googleAuthController.unlinkGoogle
);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP for email verification
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimit,
  validate(resendOTPSchema),
  authController.resendOTP
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Initiate password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  authRateLimit,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Protected routes (authentication required)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getProfile
);

/**
 * @route   GET /api/v1/auth/check
 * @desc    Check authentication status
 * @access  Private
 */
router.get(
  '/check',
  authenticate,
  authController.checkAuth
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  requireEmailVerification,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  requireEmailVerification,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @route   GET /api/v1/auth/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get(
  '/dashboard',
  authenticate,
  requireEmailVerification,
  authController.getDashboard
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete(
  '/account',
  authenticate,
  requireEmailVerification,
  authController.deactivateAccount
);

// Onboarding routes

/**
 * @route   PUT /api/v1/auth/onboarding/basic
 * @desc    Update basic onboarding information
 * @access  Private
 */
router.put(
  '/onboarding/basic',
  authenticate,
  requireEmailVerification,
  validate(onboardingBasicSchema),
  authController.updateOnboarding
);

/**
 * @route   PUT /api/v1/auth/onboarding/goals
 * @desc    Update learning goals and interests
 * @access  Private
 */
router.put(
  '/onboarding/goals',
  authenticate,
  requireEmailVerification,
  validate(onboardingGoalsSchema),
  authController.updateOnboarding
);

/**
 * @route   POST /api/v1/auth/onboarding/complete
 * @desc    Complete onboarding process
 * @access  Private
 */
router.post(
  '/onboarding/complete',
  authenticate,
  requireEmailVerification,
  authController.completeOnboarding
);

export default router;