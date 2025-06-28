// src/controllers/onboarding.controller.ts - Complete Onboarding Controller Implementation
import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { 
  OnboardingBasicInput,
  OnboardingGoalsInput,
  CompleteOnboardingInput,
} from '../validations/auth.validation';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { catchAsync } from '../middleware/error.middleware';
import { extractClientIP } from '../utils/ip.utils';
import User, { OnboardingStatus } from '../models/User.model';

/**
 * Get onboarding status for authenticated user
 */
export const getOnboardingStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const user = req.user;

  console.log('🎯 Get onboarding status:', { userId });

  try {
    res.status(200).json({
      success: true,
      message: 'Onboarding status retrieved successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: user.isOnboarded,
          onboardingStatus: user.onboardingStatus,
          gender: user.gender,
          ageRange: user.ageRange,
          studyLevel: user.studyLevel,
          goals: user.goals,
        },
      },
    });
  } catch (error: any) {
    console.error('💥 Get onboarding status error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update basic onboarding information (gender, age, study level)
 */
export const updateBasicInfo = catchAsync(async (req: Request<{}, {}, OnboardingBasicInput>, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { gender, ageRange, studyLevel } = req.body;

  console.log('🎯 Update basic onboarding info:', {
    userId,
    gender,
    ageRange,
    studyLevel,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await authService.updateOnboarding(userId, {
      gender,
      ageRange,
      studyLevel,
    });

    console.log('📋 Basic info update result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Basic info update error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update basic information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Update learning goals
 */
export const updateGoals = catchAsync(async (req: Request<{}, {}, OnboardingGoalsInput>, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;
  const { goals } = req.body;

  console.log('🎯 Update goals:', {
    userId,
    goalsCount: goals?.length,
    clientIP: extractClientIP(req),
  });

  try {
    const result = await authService.updateOnboarding(userId, {
      goals,
    });

    console.log('📋 Goals update result:', {
      success: result.success,
      message: result.message,
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('💥 Goals update error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update goals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Complete the entire onboarding process
 */
export const completeOnboarding = catchAsync(async (req: Request<{}, {}, CompleteOnboardingInput>, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;
  const user = (req as AuthenticatedRequest).user;
  const { goals } = req.body;

  console.log('🎯 Complete onboarding:', {
    userId,
    goalsCount: goals?.length,
    clientIP: extractClientIP(req),
  });

  try {
    // First update the goals
    const updateResult = await authService.updateOnboarding(userId, {
      goals,
    });

    if (!updateResult.success) {
      return res.status(400).json(updateResult);
    }

    // Then mark onboarding as completed
    const updatedUser = await User.findById(userId);
    if (updatedUser) {
      await updatedUser.updateOnboardingStatus(OnboardingStatus.COMPLETED);
    }

    console.log('📋 Complete onboarding result:', {
      success: true,
      message: 'Onboarding completed successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully! Welcome to MentorMatch!',
      data: {
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: true,
          onboardingStatus: OnboardingStatus.COMPLETED,
          goals,
        },
      },
    });
  } catch (error: any) {
    console.error('💥 Complete onboarding error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Skip onboarding (set minimal defaults and mark as completed)
 */
export const skipOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const user = req.user;

  console.log('🎯 Skip onboarding:', {
    userId,
    clientIP: extractClientIP(req),
  });

  try {
    // Set minimal defaults for required fields if not already set
    const updateData: any = {};
    
    if (!user.gender) {
      updateData.gender = 'prefer-not-to-say';
    }
    
    if (!user.ageRange) {
      updateData.ageRange = '18-22'; // Default age range
    }
    
    if (!user.studyLevel) {
      updateData.studyLevel = 'undergraduate'; // Default study level
    }
    
    if (!user.goals || user.goals.length === 0) {
      updateData.goals = ['general-learning']; // Default goal
    }

    // Update user with defaults if needed
    if (Object.keys(updateData).length > 0) {
      await authService.updateOnboarding(userId, updateData);
    }

    // Mark onboarding as completed
    const updatedUser = await User.findById(userId);
    if (updatedUser) {
      await updatedUser.updateOnboardingStatus(OnboardingStatus.COMPLETED);
    }

    console.log('📋 Skip onboarding result:', {
      success: true,
      message: 'Onboarding skipped successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding skipped successfully! You can complete your profile later.',
      data: {
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: true,
          onboardingStatus: OnboardingStatus.COMPLETED,
          ...updateData,
        },
      },
    });
  } catch (error: any) {
    console.error('💥 Skip onboarding error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to skip onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Reset onboarding status (for admin or user who wants to redo)
 */
export const resetOnboarding = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  console.log('🎯 Reset onboarding:', {
    userId,
    clientIP: extractClientIP(req),
  });

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Reset onboarding fields
    user.onboardingStatus = OnboardingStatus.NOT_STARTED;
    user.isOnboarded = false;
    user.gender = undefined;
    user.ageRange = undefined;
    user.studyLevel = undefined;
    user.goals = [];

    await user.save();

    console.log('📋 Reset onboarding result:', {
      success: true,
      message: 'Onboarding reset successfully',
    });

    res.status(200).json({
      success: true,
      message: 'Onboarding has been reset. You can start the process again.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOnboarded: false,
          onboardingStatus: OnboardingStatus.NOT_STARTED,
          gender: null,
          ageRange: null,
          studyLevel: null,
          goals: [],
        },
      },
    });
  } catch (error: any) {
    console.error('💥 Reset onboarding error:', {
      userId,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get available options for onboarding forms
 */
export const getOnboardingOptions = catchAsync(async (req: Request, res: Response) => {
  console.log('🎯 Get onboarding options');

  try {
    const options = {
      genders: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'prefer-not-to-say', label: 'Prefer not to say' },
      ],
      ageRanges: [
        { value: '13-17', label: '13-17 years' },
        { value: '18-22', label: '18-22 years' },
        { value: '23-27', label: '23-27 years' },
        { value: '28+', label: '28+ years' },
      ],
      studyLevels: [
        { value: 'high-school', label: 'High School', description: 'Grade 9-12' },
        { value: 'undergraduate', label: 'Undergraduate', description: 'Bachelor\'s Degree' },
        { value: 'graduate', label: 'Graduate', description: 'Master\'s/PhD' },
        { value: 'professional', label: 'Professional', description: 'Working Professional' },
      ],
      suggestedGoals: [
        { value: 'academic-excellence', label: 'Academic Excellence', description: 'Improve grades & understanding' },
        { value: 'exam-preparation', label: 'Exam Preparation', description: 'Ace your upcoming tests' },
        { value: 'skill-development', label: 'Skill Development', description: 'Learn new abilities' },
        { value: 'career-guidance', label: 'Career Guidance', description: 'Plan your future path' },
        { value: 'homework-help', label: 'Homework Help', description: 'Get support with assignments' },
        { value: 'study-habits', label: 'Study Habits', description: 'Develop better routines' },
        { value: 'college-prep', label: 'College Preparation', description: 'Get ready for higher education' },
        { value: 'subject-mastery', label: 'Subject Mastery', description: 'Excel in specific subjects' },
        { value: 'confidence-building', label: 'Confidence Building', description: 'Boost self-esteem' },
        { value: 'time-management', label: 'Time Management', description: 'Organize your schedule' },
        { value: 'research-skills', label: 'Research Skills', description: 'Learn to find information' },
        { value: 'presentation-skills', label: 'Presentation Skills', description: 'Improve public speaking' },
      ],
    };

    res.status(200).json({
      success: true,
      message: 'Onboarding options retrieved successfully',
      data: options,
    });
  } catch (error: any) {
    console.error('💥 Get onboarding options error:', {
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default {
  getOnboardingStatus,
  updateBasicInfo,
  updateGoals,
  completeOnboarding,
  skipOnboarding,
  resetOnboarding,
  getOnboardingOptions,
};