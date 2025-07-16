// src/services/auth.service.ts - Complete Authentication Service Implementation
import User, { IUser, OnboardingStatus } from '../models/User.model';
import { OTPType } from '../models/OTP.model';
import { generateTokenPair, createTokenResponse } from '../utils/jwt.utils';
import { createOTP, verifyOTPWithAttempts, canRequestOTP } from '../utils/otp.utils';
import emailService from './email.service';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'mentee' | 'mentor';
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
    const { name, email, password, role = 'mentee' } = registerData;

    try {
      console.log('🔍 [AUTH SERVICE] Starting registration process:', {
        email,
        name,
        role,
        hasPassword: !!password,
        passwordLength: password?.length,
        metadata,
      });

      // Step 1: Check if user already exists
      console.log('📋 [AUTH SERVICE] Checking if user exists...');
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingUser) {
        console.log('⚠️ [AUTH SERVICE] User already exists:', {
          email,
          isVerified: existingUser.isEmailVerified,
          userId: existingUser.id,
        });

        if (existingUser.isEmailVerified) {
          return {
            success: false,
            message: 'An account with this email already exists',
          };
        }
        
        console.log('🔄 [AUTH SERVICE] User exists but not verified, checking rate limit...');
        
        // User exists but not verified - allow resending OTP
        const rateLimit = await canRequestOTP(email, OTPType.EMAIL_VERIFICATION);
        
        if (!rateLimit.canRequest) {
          console.log('🚫 [AUTH SERVICE] Rate limit exceeded:', rateLimit.message);
          return {
            success: false,
            message: rateLimit.message,
          };
        }
        
        console.log('📧 [AUTH SERVICE] Creating OTP for existing unverified user...');
        
        // Create new OTP for existing unverified user
        const otpResult = await createOTP(
          email,
          OTPType.EMAIL_VERIFICATION,
          existingUser.id,
          metadata
        );

        if (!otpResult.success) {
          console.error('❌ [AUTH SERVICE] Failed to create OTP:', otpResult.message);
          return {
            success: false,
            message: 'Failed to create verification code. Please try again.',
          };
        }
        
        console.log('✅ [AUTH SERVICE] OTP created successfully:', {
          email,
          otpCode: otpResult.code,
          expiresAt: otpResult.expiresAt,
        });
        
        // Send OTP email
        console.log('📤 [AUTH SERVICE] Sending OTP email...');
        const emailResult = await emailService.sendOTP(email, otpResult.code, OTPType.EMAIL_VERIFICATION, name);
        
        console.log('📧 [AUTH SERVICE] Email send result:', emailResult);
        
        return {
          success: true,
          message: 'Verification code sent to your email',
          data: {
            userId: existingUser.id,
            email: existingUser.email,
            requiresVerification: true,
            emailSent: emailResult.success,
          },
        };
      }

      // Step 2: Check rate limiting for new registrations
      console.log('🔄 [AUTH SERVICE] Checking rate limit for new registration...');
      const rateLimit = await canRequestOTP(email, OTPType.EMAIL_VERIFICATION);
      
      if (!rateLimit.canRequest) {
        console.log('🚫 [AUTH SERVICE] Rate limit exceeded for new user:', rateLimit.message);
        return {
          success: false,
          message: rateLimit.message,
        };
      }

      // Step 3: Create new user
      console.log('👤 [AUTH SERVICE] Creating new user...');
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password, // Will be hashed by the pre-save middleware
        role,
        isEmailVerified: false,
        onboardingStatus: OnboardingStatus.NOT_STARTED,
      });

      console.log('💾 [AUTH SERVICE] Saving new user to database...');
      await newUser.save();
      console.log('✅ [AUTH SERVICE] New user created successfully:', {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      });

      // Step 4: Create OTP for email verification
      console.log('📧 [AUTH SERVICE] Creating OTP for new user...');
      const otpResult = await createOTP(
        email,
        OTPType.EMAIL_VERIFICATION,
        newUser.id,
        metadata
      );

      if (!otpResult.success) {
        console.error('❌ [AUTH SERVICE] Failed to create OTP for new user:', otpResult.message);
        return {
          success: false,
          message: 'Account created but failed to send verification code. Please try to resend.',
        };
      }

      console.log('✅ [AUTH SERVICE] OTP created for new user:', {
        email,
        otpCode: otpResult.code,
        expiresAt: otpResult.expiresAt,
      });

      // Step 5: Send verification email
      console.log('📤 [AUTH SERVICE] Sending verification email to new user...');
      const emailResult = await emailService.sendOTP(email, otpResult.code, OTPType.EMAIL_VERIFICATION, name);
      
      console.log('📧 [AUTH SERVICE] Email send result for new user:', emailResult);
      
      if (!emailResult.success) {
        console.error('❌ [AUTH SERVICE] Failed to send verification email:', emailResult.error);
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

      console.log('🎉 [AUTH SERVICE] Registration completed successfully:', {
        userId: newUser.id,
        email: newUser.email,
        emailSent: true,
      });

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
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Registration error:', {
        email,
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Provide more specific error messages
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: `Validation failed: ${validationErrors.join(', ')}`,
        };
      }
      
      if (error.code === 11000) {
        return {
          success: false,
          message: 'An account with this email already exists',
        };
      }
      
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
      console.log('🔍 [AUTH SERVICE] Starting email verification:', {
        email,
        otpLength: otp?.length,
      });

      // Verify OTP
      console.log('🔐 [AUTH SERVICE] Verifying OTP...');
      const otpResult = await verifyOTPWithAttempts(
        email,
        otp,
        OTPType.EMAIL_VERIFICATION
      );

      if (!otpResult.success) {
        console.log('❌ [AUTH SERVICE] OTP verification failed:', otpResult.message);
        return {
          success: false,
          message: otpResult.message,
        };
      }

      console.log('✅ [AUTH SERVICE] OTP verified successfully');

      // Find user and mark as verified
      console.log('👤 [AUTH SERVICE] Finding user...');
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.error('❌ [AUTH SERVICE] User not found after OTP verification');
        return {
          success: false,
          message: 'User not found',
        };
      }

      console.log('👤 [AUTH SERVICE] User found, marking as verified...');
      
      // Mark email as verified
      await user.markEmailAsVerified();
      
      // Update onboarding status
      await user.updateOnboardingStatus(OnboardingStatus.IN_PROGRESS);

      console.log('✅ [AUTH SERVICE] User marked as verified');

      // Generate JWT tokens
      console.log('🔑 [AUTH SERVICE] Generating JWT tokens...');
      const tokens = generateTokenPair(user);

      console.log('✅ [AUTH SERVICE] JWT tokens generated');

      // Send welcome email
      console.log('📧 [AUTH SERVICE] Sending welcome email...');
      try {
        await emailService.sendWelcomeEmail(user.email, user.name);
        console.log('✅ [AUTH SERVICE] Welcome email sent');
      } catch (emailError) {
        console.warn('⚠️ [AUTH SERVICE] Welcome email failed, but continuing:', emailError);
      }

      console.log('🎉 [AUTH SERVICE] Email verification completed successfully');

      return createTokenResponse(user, tokens);
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Email verification error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
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
      console.log('🔄 [AUTH SERVICE] Starting OTP resend:', {
        email,
        type,
        metadata,
      });

      // Check rate limiting
      const rateLimit = await canRequestOTP(email, type);
      
      if (!rateLimit.canRequest) {
        console.log('🚫 [AUTH SERVICE] Rate limit exceeded for resend:', rateLimit.message);
        return {
          success: false,
          message: rateLimit.message,
        };
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        console.log('❌ [AUTH SERVICE] User not found for OTP resend');
        return {
          success: false,
          message: 'No account found with this email',
        };
      }

      // Don't allow resending if already verified (for email verification)
      if (type === OTPType.EMAIL_VERIFICATION && user.isEmailVerified) {
        console.log('⚠️ [AUTH SERVICE] Email already verified, cannot resend');
        return {
          success: false,
          message: 'Email is already verified',
        };
      }

      // Create new OTP
      console.log('📧 [AUTH SERVICE] Creating new OTP...');
      const otpResult = await createOTP(email, type, user.id, metadata);

      if (!otpResult.success) {
        console.error('❌ [AUTH SERVICE] Failed to create OTP for resend');
        return {
          success: false,
          message: 'Failed to create verification code. Please try again.',
        };
      }

      // Send OTP email
      console.log('📤 [AUTH SERVICE] Sending resend OTP email...');
      const emailResult = await emailService.sendOTP(email, otpResult.code, type, user.name);

      console.log('📧 [AUTH SERVICE] Resend email result:', emailResult);

      return {
        success: true,
        message: 'New verification code sent to your email',
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Resend OTP error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  /**
   * User login with email and password
   */
  async login(loginData: LoginData): Promise<AuthResult> {
    const { email, password } = loginData;

    try {
      console.log('🔐 [AUTH SERVICE] Starting login process:', {
        email,
        hasPassword: !!password,
      });

      // Find user with password field
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        console.log('❌ [AUTH SERVICE] User not found for login');
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        console.log('⚠️ [AUTH SERVICE] Account deactivated');
        return {
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        console.log('⚠️ [AUTH SERVICE] Email not verified');
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
      console.log('🔐 [AUTH SERVICE] Verifying password...');
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        console.log('❌ [AUTH SERVICE] Invalid password');
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT tokens
      const tokens = generateTokenPair(user);

      console.log('✅ [AUTH SERVICE] Login successful');

      return createTokenResponse(user, tokens);
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Login error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  /**
   * Initiate forgot password process
   */
  async forgotPassword(
    email: string, 
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<AuthResult> {
    try {
      console.log('🔑 [AUTH SERVICE] Starting forgot password process:', {
        email,
        metadata,
      });

      // Check rate limiting
      const rateLimit = await canRequestOTP(email, OTPType.PASSWORD_RESET);
      
      if (!rateLimit.canRequest) {
        console.log('🚫 [AUTH SERVICE] Rate limit exceeded for password reset:', rateLimit.message);
        return {
          success: false,
          message: rateLimit.message,
        };
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Always return success message for security (don't reveal if email exists)
      const successMessage = 'If an account with this email exists, you will receive a password reset code shortly.';
      
      if (!user) {
        console.log('❌ [AUTH SERVICE] User not found for password reset');
        // Return success to prevent email enumeration
        return {
          success: true,
          message: successMessage,
        };
      }

      // Check if account is active
      if (!user.isActive) {
        console.log('⚠️ [AUTH SERVICE] Account deactivated for password reset');
        return {
          success: true,
          message: successMessage,
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        console.log('⚠️ [AUTH SERVICE] Email not verified for password reset');
        return {
          success: false,
          message: 'Please verify your email first before resetting password',
        };
      }

      // Create OTP for password reset
      console.log('📧 [AUTH SERVICE] Creating password reset OTP...');
      const otpResult = await createOTP(email, OTPType.PASSWORD_RESET, user.id, metadata);

      if (!otpResult.success) {
        console.error('❌ [AUTH SERVICE] Failed to create password reset OTP');
        return {
          success: false,
          message: 'Failed to generate reset code. Please try again.',
        };
      }

      // Send password reset email
      console.log('📤 [AUTH SERVICE] Sending password reset email...');
      const emailResult = await emailService.sendOTP(email, otpResult.code, OTPType.PASSWORD_RESET, user.name);

      console.log('📧 [AUTH SERVICE] Password reset email result:', emailResult);

      return {
        success: true,
        message: successMessage,
        data: {
          emailSent: emailResult.success,
        },
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Forgot password error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Failed to process password reset request. Please try again.',
      };
    }
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResult> {
    try {
      console.log('🔐 [AUTH SERVICE] Starting password reset with OTP:', {
        email,
        otpLength: otp?.length,
        newPasswordLength: newPassword?.length,
      });

      // Verify OTP
      console.log('🔐 [AUTH SERVICE] Verifying password reset OTP...');
      const otpResult = await verifyOTPWithAttempts(
        email,
        otp,
        OTPType.PASSWORD_RESET
      );

      if (!otpResult.success) {
        console.log('❌ [AUTH SERVICE] Password reset OTP verification failed:', otpResult.message);
        return {
          success: false,
          message: otpResult.message,
        };
      }

      console.log('✅ [AUTH SERVICE] Password reset OTP verified successfully');

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      
      if (!user) {
        console.error('❌ [AUTH SERVICE] User not found for password reset');
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        console.log('⚠️ [AUTH SERVICE] Account deactivated during password reset');
        return {
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        };
      }

      // Update password
      console.log('🔐 [AUTH SERVICE] Updating user password...');
      user.password = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      console.log('✅ [AUTH SERVICE] Password updated successfully');

      // Send password reset success email
      try {
        await emailService.sendPasswordResetSuccessEmail(user.email, user.name);
        console.log('✅ [AUTH SERVICE] Password reset success email sent');
      } catch (emailError) {
        console.warn('⚠️ [AUTH SERVICE] Password reset success email failed:', emailError);
      }

      console.log('🎉 [AUTH SERVICE] Password reset completed successfully');

      return {
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Password reset error:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Password reset failed. Please try again.',
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      console.log('🔐 [AUTH SERVICE] Starting password change:', {
        userId,
        currentPasswordLength: currentPassword?.length,
        newPasswordLength: newPassword?.length,
      });

      // Find user with password
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        console.error('❌ [AUTH SERVICE] User not found for password change');
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if account is active
      if (!user.isActive) {
        console.log('⚠️ [AUTH SERVICE] Account deactivated during password change');
        return {
          success: false,
          message: 'Account has been deactivated. Please contact support.',
        };
      }

      // Verify current password
      console.log('🔐 [AUTH SERVICE] Verifying current password...');
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        console.log('❌ [AUTH SERVICE] Current password invalid');
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
      console.log('🔐 [AUTH SERVICE] Updating password...');
      user.password = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      console.log('✅ [AUTH SERVICE] Password changed successfully');

      return {
        success: true,
        message: 'Password has been changed successfully',
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Password change error:', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: 'Password change failed. Please try again.',
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<AuthResult> {
    try {
      console.log('👤 [AUTH SERVICE] Getting user profile:', { userId });

      const user = await User.findById(userId);
      
      if (!user) {
        console.log('❌ [AUTH SERVICE] User not found for profile');
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account has been deactivated',
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
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
            isEmailVerified: user.isEmailVerified,
            isOnboarded: user.isOnboarded,
            isTestGiven: user.isTestGiven,
            onboardingStatus: user.onboardingStatus,
            stats: user.stats,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
          },
        },
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Get profile error:', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        message: 'Failed to retrieve profile',
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<AuthResult> {
    try {
      console.log('👤 [AUTH SERVICE] Updating user profile:', {
        userId,
        updateFields: Object.keys(updateData),
      });

      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account has been deactivated',
        };
      }

      // Update allowed fields
      const allowedFields = [
        'name', 'phone', 'gender', 'ageRange', 'studyLevel', 'bio', 
        'location', 'timezone', 'goals', 'avatar'
      ];

      Object.keys(updateData).forEach(field => {
        if (allowedFields.includes(field) && updateData[field as keyof IUser] !== undefined) {
          (user as any)[field] = updateData[field as keyof IUser];
        }
      });

      await user.save();

      console.log('✅ [AUTH SERVICE] Profile updated successfully');

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
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
            isEmailVerified: user.isEmailVerified,
            isOnboarded: user.isOnboarded,
            onboardingStatus: user.onboardingStatus,
            stats: user.stats,
          },
        },
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Update profile error:', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        message: 'Failed to update profile',
      };
    }
  }

  /**
   * Update onboarding information
   */
  async updateOnboarding(userId: string, onboardingData: any): Promise<AuthResult> {
    try {
      console.log('🎯 [AUTH SERVICE] Updating onboarding data:', {
        userId,
        onboardingFields: Object.keys(onboardingData),
      });

      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account has been deactivated',
        };
      }

      // Update onboarding fields
      const allowedFields = [
        'gender', 'ageRange', 'studyLevel', 'goals'
      ];

      Object.keys(onboardingData).forEach(field => {
        if (allowedFields.includes(field) && onboardingData[field] !== undefined) {
          (user as any)[field] = onboardingData[field];
        }
      });

      // Update onboarding status based on progress
      if (user.gender && user.ageRange && user.studyLevel) {
        if (user.goals && user.goals.length > 0) {
          user.onboardingStatus = OnboardingStatus.COMPLETED;
          user.isOnboarded = true;
        } else {
          user.onboardingStatus = OnboardingStatus.IN_PROGRESS;
        }
      }

      await user.save();

      console.log('✅ [AUTH SERVICE] Onboarding updated successfully');

      return {
        success: true,
        message: 'Onboarding information updated successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            gender: user.gender,
            ageRange: user.ageRange,
            studyLevel: user.studyLevel,
            goals: user.goals,
            isOnboarded: user.isOnboarded,
            onboardingStatus: user.onboardingStatus,
          },
        },
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Update onboarding error:', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        message: 'Failed to update onboarding information',
      };
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<AuthResult> {
    try {
      console.log('🗑️ [AUTH SERVICE] Deactivating account:', { userId });

      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is already deactivated',
        };
      }

      // Deactivate account
      user.isActive = false;
      await user.save();

      console.log('✅ [AUTH SERVICE] Account deactivated successfully');

      return {
        success: true,
        message: 'Account has been deactivated successfully',
      };
    } catch (error: any) {
      console.error('💥 [AUTH SERVICE] Deactivate account error:', {
        userId,
        error: error.message,
      });
      return {
        success: false,
        message: 'Failed to deactivate account',
      };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;