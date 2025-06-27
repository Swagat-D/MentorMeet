// src/validations/auth.validation.ts - Debug Authentication Validation Schemas
import { z } from 'zod';
import { Gender, StudyLevel, AgeRange } from '../models/User.model';

// User registration validation with detailed error messages
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ 
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string'
      })
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .trim()
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
    email: z
      .string({ 
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string'
      })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({ 
        required_error: 'Password is required',
        invalid_type_error: 'Password must be a string'
      })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    
    // Make role optional with default value
    role: z
      .enum(['mentee', 'mentor'], {
        invalid_type_error: 'Role must be either "mentee" or "mentor"'
      })
      .optional()
      .default('mentee'),
  }).strict(), // Only allow specified fields
});

// Alternative simpler registration schema for testing
export const registerSchemaSimple = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['mentee', 'mentor']).optional().default('mentee'),
  }),
});

// User login validation
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

// OTP verification validation
export const verifyOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

// Resend OTP validation
export const resendOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
  }),
});

// Forgot password validation
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
  }),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please enter a valid email address')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
    
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token cannot be empty'),
  }),
});

// Change password validation (for authenticated users)
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  }),
});

// Update profile validation
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .trim()
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
      .optional(),
    
    phone: z
      .string()
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
      .optional()
      .nullable(),
    
    bio: z
      .string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional()
      .nullable(),
    
    location: z
      .string()
      .max(100, 'Location cannot exceed 100 characters')
      .optional()
      .nullable(),
    
    timezone: z
      .string()
      .optional()
      .nullable(),
      
    gender: z
      .enum(Object.values(Gender) as [string, ...string[]])
      .optional()
      .nullable(),
      
    ageRange: z
      .enum(Object.values(AgeRange) as [string, ...string[]])
      .optional()
      .nullable(),
      
    studyLevel: z
      .enum(Object.values(StudyLevel) as [string, ...string[]])
      .optional()
      .nullable(),
  }),
});

// Onboarding basic info validation
export const onboardingBasicSchema = z.object({
  body: z.object({
    gender: z
      .enum(Object.values(Gender) as [string, ...string[]], {
        required_error: 'Gender is required',
      }),
      
    ageRange: z
      .enum(Object.values(AgeRange) as [string, ...string[]], {
        required_error: 'Age range is required',
      }),
      
    studyLevel: z
      .enum(Object.values(StudyLevel) as [string, ...string[]], {
        required_error: 'Study level is required',
      }),
  }),
});

// Onboarding goals validation
export const onboardingGoalsSchema = z.object({
  body: z.object({
    goals: z
      .array(z.string().trim().min(1, 'Goal cannot be empty'))
      .min(1, 'At least one goal is required')
      .max(10, 'Maximum 10 goals allowed'),
      
    interests: z
      .array(z.string().trim().min(1, 'Interest cannot be empty'))
      .max(15, 'Maximum 15 interests allowed')
      .optional(),
  }),
});

// Common parameter validations
export const emailParamSchema = z.object({
  params: z.object({
    email: z
      .string()
      .email('Please enter a valid email address')
      .toLowerCase()
      .transform((email) => decodeURIComponent(email)),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z
      .string({ required_error: 'User ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  }),
});

// Upload validation
export const uploadAvatarSchema = z.object({
  file: z.object({
    mimetype: z
      .string()
      .refine(
        (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
        'Only JPEG, PNG, and WebP images are allowed'
      ),
    size: z
      .number()
      .max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  }).optional(),
});

// Type definitions for validated data
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>['body'];
export type ResendOTPInput = z.infer<typeof resendOTPSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type OnboardingBasicInput = z.infer<typeof onboardingBasicSchema>['body'];
export type OnboardingGoalsInput = z.infer<typeof onboardingGoalsSchema>['body'];

// Validation middleware helper
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      console.log('🔍 [VALIDATE SCHEMA] Validating request:', {
        body: req.body,
        params: req.params,
        query: req.query,
      });

      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        file: req.file,
      });
      
      console.log('✅ [VALIDATE SCHEMA] Validation successful');
      next();
    } catch (error) {
      console.error('❌ [VALIDATE SCHEMA] Validation failed:', error);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};