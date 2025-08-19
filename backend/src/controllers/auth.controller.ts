// src/controllers/auth.controller.ts - Complete Authentication Controller Implementation
import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { 
  RegisterInput, 
  LoginInput,
  VerifyOTPInput,
  ResendOTPInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../validations/auth.validation';
import { IUser } from '../models/User.model';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { catchAsync } from '../middleware/error.middleware';
import { extractClientIP } from '../utils/ip.utils';

/**
 * Register a new user
 */
export const register = catchAsync(async (req: Request<{}, {}, RegisterInput>, res: Response) => {
  const { name, email, password, role } = req.body;
  
  console.log('🔐 Registration attempt:', {
    email,
    name,
    role,
    passwordLength: password?.length,
    clientIP: extractClientIP(req),
    userAgent: req.get('User-Agent'),
  });
  
  // Get client metadata with production-ready IP extraction
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  try {
    console.log('📝 Calling auth service register...');
    const result = await authService.register(
      { name, email, password, role },
      metadata
    );

    console.log('📋 Registration result:', {
      success: result.success,
      message: result.message,
      hasData: !!result.data,
    });

    if (result.success) {
      console.log('✅ Registration successful for:', email);
      res.status(201).json(result);
    } else {
      console.log('❌ Registration failed for:', email, 'Reason:', result.message);
      res.status(400).json(result);
    }
  } catch (error: any) {
    console.error('💥 Registration error:', {
      email,
      error: error.message,
      stack: error.stack,
    });
    
    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Verify email with OTP
 */
export const verifyEmail = catchAsync(async (req: Request<{}, {}, VerifyOTPInput>, res: Response) => {
  const { email, otp } = req.body;

  console.log('📧 Email verification attempt:', {
    email,
    otpLength: otp?.length,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await authService.verifyEmail(email, otp);

    console.log('📋 Email verification result:', {
      success: result.success,
      message: result.message,
      hasTokens: !!(result as any).tokens,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Email verification error:', {
      email,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Email verification failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Resend OTP for email verification
 */
export const resendOTP = catchAsync(async (req: Request<{}, {}, ResendOTPInput>, res: Response) => {
  const { email } = req.body;
  
  console.log('🔄 OTP resend attempt:', {
    email,
    clientIP: extractClientIP(req),
  });
  
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  try {
    const result = await authService.resendOTP(email, undefined, metadata);

    console.log('📋 OTP resend result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 OTP resend error:', {
      email,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * User login
 */
export const login = catchAsync(async (req: Request<{}, {}, LoginInput>, res: Response) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', {
    email,
    passwordLength: password?.length,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await authService.login({ email, password });

    console.log('📋 Login result:', {
      success: result.success,
      message: result.message,
      hasTokens: !!(result as any).tokens,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Login error:', {
      email,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Login failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Initiate password reset
 */
export const forgotPassword = catchAsync(async (req: Request<{}, {}, ForgotPasswordInput>, res: Response) => {
  const { email } = req.body;
  
  console.log('🔑 Password reset request:', {
    email,
    clientIP: extractClientIP(req),
  });
  
  const metadata: { ipAddress?: string; userAgent?: string } = {};
  metadata.ipAddress = extractClientIP(req);
  const userAgent = req.get('User-Agent');
  if (userAgent !== undefined) metadata.userAgent = userAgent;

  try {
    const result = await authService.forgotPassword(email, metadata);

    console.log('📋 Password reset result:', {
      success: result.success,
      message: result.message,
    });

    // Always return 200 for forgot password for security
    res.status(200).json(result);
  } catch (error: any) {
    console.error('💥 Password reset error:', {
      email,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Password reset failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Reset password with OTP
 */
export const resetPassword = catchAsync(async (req: Request<{}, {}, ResetPasswordInput>, res: Response) => {
  const { email, otp, newPassword } = req.body;

  console.log('🔐 Password reset with OTP:', {
    email,
    otpLength: otp?.length,
    newPasswordLength: newPassword?.length,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await authService.resetPassword(email, otp, newPassword);

    console.log('📋 Password reset with OTP result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Password reset with OTP error:', {
      email,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Password reset failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Change password (authenticated user)
 */
export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  console.log('🔐 Password change attempt:', {
    userId,
    currentPasswordLength: currentPassword?.length,
    newPasswordLength: newPassword?.length,
  });

  try {
    const result = await authService.changePassword(userId, currentPassword, newPassword);

    console.log('📋 Password change result:', {
      success: result.success,
      message: result.message,
      userId,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Password change error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Password change failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get current user profile
 */
export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('👤 Profile request:', { userId });

  try {
    const result = await authService.getUserProfile(userId);

    console.log('📋 Profile result:', {
      success: result.success,
      hasUser: !!result.data?.user,
    });

    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Profile error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get profile due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update user profile
 */
export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const updateData: UpdateProfileInput = req.body;

  console.log('👤 Profile update attempt:', {
    userId,
    updateFields: Object.keys(updateData),
  });

  try {
    const result = await authService.updateProfile(userId, updateData as Partial<IUser>);

    console.log('📋 Profile update result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Profile update error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Profile update failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update onboarding information
 */
export const updateOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const onboardingData = req.body;

  console.log('🎯 Onboarding update attempt:', {
    userId,
    onboardingFields: Object.keys(onboardingData),
  });

  try {
    const result = await authService.updateOnboarding(userId, onboardingData);

    console.log('📋 Onboarding update result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Onboarding update error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Onboarding update failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Complete onboarding process
 */
export const completeOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { goals } = req.body;

  console.log('🎯 Complete onboarding attempt:', {
    userId,
    goalsCount: goals?.length,
  });

  try {
    const result = await authService.updateOnboarding(userId, {
      goals,
    });

    console.log('📋 Complete onboarding result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Complete onboarding error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Onboarding completion failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Logout user (client-side token invalidation)
 */
export const logout = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. Here we can log the logout event.
  
  console.log(`🚪 User ${req.userId} logged out from ${extractClientIP(req)}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Deactivate user account
 */
export const deactivateAccount = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('🗑️ Account deactivation attempt:', { userId });

  try {
    const result = await authService.deactivateAccount(userId);

    console.log('📋 Account deactivation result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Account deactivation error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Account deactivation failed due to server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get user dashboard data (for authenticated users)
 */
export const getDashboard = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  console.log('📊 Dashboard request:', { userId: user.id });

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

  console.log('🔍 Auth check:', { userId: user.id });

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
  deactivateAccount,
  getDashboard,
  checkAuth,
};