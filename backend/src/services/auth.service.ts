// src/services/auth.service.ts - Authentication Business Logic Service
import User, { IUser, OnboardingStatus } from '@/models/User.model';
import { OTPType } from '@/models/OTP.model';
import { generateTokenPair, createTokenResponse } from '@/utils/jwt.utils';
import { createOTP, verifyOTPWithAttempts, canRequestOTP } from '@/utils/otp.utils';
import emailService from '@/services/email.service';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
  user?: IUser;
  tokens?: any;
}

class AuthService {
  /**
   * Register a new user and send email verification OTP
   */
  async register(
  registerData: RegisterData,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<AuthResult> {
  const { name, email, password } = registerData;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return {
          success: false,
          message: 'An account with this email already exists',
        };
      }
      
      // User exists but not verified - allow resending OTP
      const rateLimit = await canRequestOTP(email, OTPType.EMAIL_VERIFICATION);
      
      if (!rateLimit.canRequest) {
        return {
          success: false,
          message: rateLimit.message,
        };
      }
      
      // Create new OTP for existing unverified user
      const { code } = await createOTP(
        email,
        OTPType.EMAIL_VERIFICATION,
        existingUser.id,
        metadata
      );
      
      // Send OTP email
      await emailService.sendOTP(email, code, OTPType.EMAIL_VERIFICATION, name);
      
      return {
        success: true,
        message: 'Verification code sent to your email',
        data: {
          userId: existingUser.id,
          email: existingUser.email,
          requiresVerification: true,
        },
      };
    }

    // Check rate limiting for new registrations
    const rateLimit = await canRequestOTP(email, OTPType.EMAIL_VERIFICATION);
    
    if (!rateLimit.canRequest) {
      return {
        success: false,
        message: rateLimit.message,
      };
    }

    // Create new user (unverified)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password, // Will be hashed by the pre-save middleware
      isEmailVerified: false,
      onboardingStatus: OnboardingStatus.NOT_STARTED,
    });

    await newUser.save();
    console.log(`New user registered: ${email}`);

    // Create OTP for email verification
    const { code } = await createOTP(
      email,
      OTPType.EMAIL_VERIFICATION,
      newUser.id,
      metadata
    );

    // Send verification email
    const emailResult = await emailService.sendOTP(email, code, OTPType.EMAIL_VERIFICATION, name);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success but mention email issue
      return {
        success: true,
        message: 'Account created successfully. Please check your email for verification code. If you don\'t receive it, you can request a new one.',
        data: {
          userId: newUser.id,
          email: newUser.email,
          requiresVerification: true,
          emailSent: false,
        },
      };
    }

    return {
      success: true,
      message: 'Account created successfully. Please check your email for verification code.',
      data: {
        userId: newUser.id,
        email: newUser.email,
        requiresVerification: true,
        emailSent: true,
      },
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed. Please try again.',
    };
  }
}

  /**
   * Verify email with OTP and complete registration
   */
  async verifyEmail(email: string, otp: string): Promise<AuthResult> {
    try {
      // Verify OTP
      const otpResult = await verifyOTPWithAttempts(
        email,
        otp,
        OTPType.EMAIL_VERIFICATION
      );

      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      }

      // Find user and mark as verified
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Mark email as verified
      await user.markEmailAsVerified();
      
      // Update onboarding status
      await user.updateOnboardingStatus(OnboardingStatus.IN_PROGRESS);

      // Generate JWT tokens
      const tokens = generateTokenPair(user);

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);

      console.log(`Email verified for user: ${email}`);

      return createTokenResponse(user, tokens);
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed. Please try again.',
      };
    }
  }

  /**
   * Resend OTP for email verification
   */
  async resendOTP(
    email: string,
    type: OTPType = OTPType.EMAIL_VERIFICATION,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    try {
      // Check rate limiting
      const rateLimit = await canRequestOTP(email, type);
      
      if (!rateLimit.canRequest) {
        return {
          success: false,
          message: rateLimit.message,
        };
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return {
          success: false,
          message: 'No account found with this email',
        };
      }

      // Don't allow resending if already verified (for email verification)
      if (type === OTPType.EMAIL_VERIFICATION && user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified',
        };
      }

      // Create new OTP
      const { code } = await createOTP(email, type, user.id, metadata);

      // Send OTP email
      await emailService.sendOTP(email, code, type, user.name);

      return {
        success: true,
        message: 'New verification code sent to your email',
      };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  /**
   * Login user with email and password
   */
  async login(loginData: LoginData): Promise<AuthResult> {
    const { email, password } = loginData;

    try {
      // Find user with password field
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
          data: {
            requiresVerification: true,
            email: user.email,
          },
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT tokens
      const tokens = generateTokenPair(user);

      console.log(`User logged in: ${email}`);

      return createTokenResponse(user, tokens);
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Initiate password reset process
   */
  async forgotPassword(
  email: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<AuthResult> {
  try {
    // Check rate limiting first
    const rateLimit = await canRequestOTP(email, OTPType.PASSWORD_RESET);
    
    if (!rateLimit.canRequest) {
      return {
        success: false,
        message: rateLimit.message,
      };
    }

    // Find user - only send email if user exists and is verified
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: true,
      isActive: true,
    });
    
    if (!user) {
      // Don't reveal if email exists or not for security, but don't send email
      return {
        success: true,
        message: 'If an account with this email exists, a password reset code will be sent.',
      };
    }

    // Create password reset OTP
    const { code } = await createOTP(
      email,
      OTPType.PASSWORD_RESET,
      user.id,
      metadata
    );

    // Send password reset email
    const emailResult = await emailService.sendOTP(email, code, OTPType.PASSWORD_RESET, user.name);
    
    console.log(`Password reset OTP sent to: ${email}`);

    return {
      success: true,
      message: 'If an account with this email exists, a password reset code will be sent.',
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: 'Failed to process password reset request. Please try again.',
    };
  }
}

  /**
   * Reset password with OTP verification
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<AuthResult> {
    try {
      // Verify OTP
      const otpResult = await verifyOTPWithAttempts(
        email,
        otp,
        OTPType.PASSWORD_RESET
      );

      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      }

      // Find user
      const user = await User.findOne({ 
        email: email.toLowerCase(),
        isEmailVerified: true,
        isActive: true,
      }).select('+password');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Update password (will be hashed by pre-save middleware)
      user.password = newPassword;
      await user.save();

      // Send password reset success email
      await emailService.sendPasswordResetSuccessEmail(user.email, user.name);

      console.log(`Password reset successful for: ${email}`);

      return {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Password reset failed. Please try again.',
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> {
    try {
      // Find user with password
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Check if new password is different
      const isSamePassword = await user.comparePassword(newPassword);
      
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password must be different from current password',
        };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      console.log(`Password changed for user: ${userId}`);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password. Please try again.',
      };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      return {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            gender: user.gender,
            ageRange: user.ageRange,
            studyLevel: user.studyLevel,
            bio: user.bio,
            location: user.location,
            timezone: user.timezone,
            goals: user.goals,
            interests: user.interests,
            isEmailVerified: user.isEmailVerified,
            isOnboarded: user.isOnboarded,
            onboardingStatus: user.onboardingStatus,
            stats: user.stats,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
        },
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Failed to retrieve user profile',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Update allowed fields
      const allowedFields = [
        'name', 'phone', 'bio', 'location', 'timezone', 
        'gender', 'ageRange', 'studyLevel'
      ];

      allowedFields.forEach(field => {
        if (updateData[field as keyof IUser] !== undefined) {
          (user as any)[field] = updateData[field as keyof IUser];
        }
      });

      await user.save();

      console.log(`Profile updated for user: ${userId}`);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            phone: user.phone,
            gender: user.gender,
            ageRange: user.ageRange,
            studyLevel: user.studyLevel,
            bio: user.bio,
            location: user.location,
            timezone: user.timezone,
          },
        },
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile. Please try again.',
      };
    }
  }

  /**
   * Update onboarding data
   */
  async updateOnboarding(
    userId: string,
    onboardingData: {
      gender?: string;
      ageRange?: string;
      studyLevel?: string;
      goals?: string[];
      interests?: string[];
    }
  ): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Update onboarding fields
      if (onboardingData.gender) user.gender = onboardingData.gender as any;
      if (onboardingData.ageRange) user.ageRange = onboardingData.ageRange as any;
      if (onboardingData.studyLevel) user.studyLevel = onboardingData.studyLevel as any;
      if (onboardingData.goals) user.goals = onboardingData.goals;
      if (onboardingData.interests) user.interests = onboardingData.interests;

      // Update onboarding status
      if (user.gender && user.ageRange && user.studyLevel && user.goals.length > 0) {
        await user.updateOnboardingStatus(OnboardingStatus.COMPLETED);
      } else {
        await user.updateOnboardingStatus(OnboardingStatus.IN_PROGRESS);
      }

      console.log(`Onboarding updated for user: ${userId}`);

      return {
        success: true,
        message: 'Onboarding information updated successfully',
        data: {
          user: {
            id: user.id,
            gender: user.gender,
            ageRange: user.ageRange,
            studyLevel: user.studyLevel,
            goals: user.goals,
            interests: user.interests,
            isOnboarded: user.isOnboarded,
            onboardingStatus: user.onboardingStatus,
          },
        },
      };
    } catch (error) {
      console.error('Update onboarding error:', error);
      return {
        success: false,
        message: 'Failed to update onboarding information. Please try again.',
      };
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      user.isActive = false;
      await user.save();

      console.log(`Account deactivated for user: ${userId}`);

      return {
        success: true,
        message: 'Account deactivated successfully',
      };
    } catch (error) {
      console.error('Deactivate account error:', error);
      return {
        success: false,
        message: 'Failed to deactivate account. Please try again.',
      };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;