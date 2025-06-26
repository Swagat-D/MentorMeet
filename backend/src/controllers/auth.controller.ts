// src/controllers/auth.controller.ts - Authentication Controller
import { Request, Response } from 'express';
import authService from '@/services/auth.service';
import { 
  RegisterInput, 
  LoginInput,
  VerifyOTPInput,
  ResendOTPInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '@/validations/auth.validation';
import { IUser } from '@/models/User.model';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { catchAsync } from '@/middleware/error.middleware';
import { extractClientIP } from '../utils/ip.utils';

/**
 * Register a new user
 */
export const register = catchAsync(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
  const { name, email, password } = req.body;
  
  // Get client metadata with production-ready IP extraction
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  const result = await authService.register(
    { name, email, password },
    metadata
  );

  if (result.success) {
    res.status(201).json(result);
  } else {
    res.status(400).json(result);
  }
});

/**
 * Verify email with OTP
 */
export const verifyEmail = catchAsync(async (req: Request<{}, {}, VerifyOTPInput>, res: Response) => {
  const { email, otp } = req.body;

  const result = await authService.verifyEmail(email, otp);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Resend OTP for email verification
 */
export const resendOTP = catchAsync(async (req: Request<{}, {}, ResendOTPInput>, res: Response) => {
  const { email } = req.body;
  
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  const result = await authService.resendOTP(email, undefined, metadata);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * User login
 */
export const login = catchAsync(async (req: Request<{}, {}, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Initiate password reset
 */
export const forgotPassword = catchAsync(async (req: Request<{}, {}, ForgotPasswordInput>, res: Response) => {
  const { email } = req.body;
  
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  const result = await authService.forgotPassword(email, metadata);

  res.status(200).json(result);
});

/**
 * Reset password with OTP
 */
export const resetPassword = catchAsync(async (req: Request<{}, {}, ResetPasswordInput>, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const result = await authService.resetPassword(email, otp, newPassword);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Change password (authenticated user)
 */
export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  const result = await authService.changePassword(userId, currentPassword, newPassword);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Get current user profile
 */
export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  const result = await authService.getUserProfile(userId);

  const statusCode = result.success ? 200 : 404;
  res.status(statusCode).json(result);
});

/**
 * Update user profile
 */
export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const updateData: UpdateProfileInput = req.body;

  const result = await authService.updateProfile(userId, updateData as Partial<IUser>);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Update onboarding information
 */
export const updateOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const onboardingData = req.body;

  const result = await authService.updateOnboarding(userId, onboardingData);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Complete onboarding process
 */
export const completeOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { goals, interests } = req.body;

  const result = await authService.updateOnboarding(userId, {
    goals,
    interests,
  });

  if (result.success) {
    // Mark onboarding as completed
    const user = req.user;
    if (user) {
      await user.updateOnboardingStatus('completed' as any);
    }
  }

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Logout user (client-side token invalidation)
 */
export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. Here we can log the logout event.
  
  console.log(`User ${req.userId} logged out`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Refresh access token
 */
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  // Note: Implement refresh token logic in auth service
  // For now, return error as refresh tokens need additional implementation
  return res.status(501).json({
    success: false,
    message: 'Refresh token functionality not implemented yet',
  });
});

/**
 * Deactivate user account
 */
export const deactivateAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  const result = await authService.deactivateAccount(userId);

  const statusCode = result.success ? 200 : 400;
  res.status(statusCode).json(result);
});

/**
 * Get user dashboard data (for authenticated users)
 */
export const getDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded,
        onboardingStatus: user.onboardingStatus,
        stats: user.stats,
        goals: user.goals,
        interests: user.interests,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    },
  });
});

/**
 * Check authentication status
 */
export const checkAuth = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'User is authenticated',
    data: {
      isAuthenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        isOnboarded: user.isOnboarded,
        onboardingStatus: user.onboardingStatus,
      },
    },
  });
});

export default {
  register,
  verifyEmail,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  updateOnboarding,
  completeOnboarding,
  logout,
  refreshToken,
  deactivateAccount,
  getDashboard,
  checkAuth,
};