// src/utils/otp.utils.ts - OTP Management Utilities
import OTP, { OTPType, OTPStatus } from '@/models/OTP.model';
import { otpConfig } from '@/config/environment';

export interface OTPCreationResult {
  success: boolean;
  code: string;
  expiresAt: Date;
  message?: string;
}

export interface OTPVerificationResult {
  success: boolean;
  message: string;
  otp?: any;
}

export interface OTPRateLimitResult {
  canRequest: boolean;
  message: string;
  remainingTime?: number;
}

/**
 * Generate a random OTP code
 */
export const generateOTPCode = (length: number = 6): string => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return code;
};

/**
 * Create a new OTP for email verification or password reset
 */
export const createOTP = async (
  email: string,
  type: OTPType,
  userId?: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<OTPCreationResult> => {
  try {
    // Invalidate any existing pending OTPs for this email and type
    await OTP.updateMany(
      {
        email: email.toLowerCase(),
        type,
        status: OTPStatus.PENDING,
      },
      {
        status: OTPStatus.EXPIRED,
      }
    );

    // Generate new OTP code
    const code = generateOTPCode(otpConfig.length);
    const expiresAt = new Date(Date.now() + otpConfig.expiresIn);

    // Create new OTP record
    const newOTP = new OTP({
      email: email.toLowerCase(),
      userId,
      code,
      type,
      status: OTPStatus.PENDING,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      maxAttempts: otpConfig.maxAttempts,
    });

    await newOTP.save();

    console.log(`OTP created for ${email}: ${code} (Type: ${type})`);

    return {
      success: true,
      code,
      expiresAt,
    };
  } catch (error) {
    console.error('Error creating OTP:', error);
    return {
      success: false,
      code: '',
      expiresAt: new Date(),
      message: 'Failed to create OTP',
    };
  }
};

/**
 * Verify OTP and handle attempts
 */
export const verifyOTPWithAttempts = async (
  email: string,
  code: string,
  type: OTPType
): Promise<OTPVerificationResult> => {
  try {
    // Find the most recent pending OTP
    const otp = await OTP.findOne({
      email: email.toLowerCase(),
      type,
      status: OTPStatus.PENDING,
    }).sort({ createdAt: -1 });

    if (!otp) {
      return {
        success: false,
        message: 'No valid OTP found. Please request a new code.',
      };
    }

    // Check if OTP is expired
    if (otp.isExpired()) {
      await otp.markAsExpired();
      return {
        success: false,
        message: 'OTP has expired. Please request a new code.',
      };
    }

    // Check if max attempts reached
    if (otp.isExhausted()) {
      await otp.markAsExpired();
      return {
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.',
      };
    }

    // Verify the code
    if (otp.code !== code) {
      await otp.incrementAttempts();
      const remainingAttempts = otp.maxAttempts - otp.attempts - 1;
      
      if (remainingAttempts <= 0) {
        return {
          success: false,
          message: 'Invalid OTP. No more attempts remaining. Please request a new code.',
        };
      }
      
      return {
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
      };
    }

    // OTP is valid - mark as verified
    await otp.markAsVerified();

    console.log(`OTP verified successfully for ${email} (Type: ${type})`);

    return {
      success: true,
      message: 'OTP verified successfully',
      otp,
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'OTP verification failed. Please try again.',
    };
  }
};

/**
 * Check if user can request a new OTP (rate limiting)
 */
export const canRequestOTP = async (
  email: string,
  type: OTPType
): Promise<OTPRateLimitResult> => {
  try {
    const now = new Date();
    const rateLimitWindow = new Date(now.getTime() - otpConfig.rateLimit.windowMs);

    // Count OTPs created in the rate limit window
    const recentOTPs = await OTP.countDocuments({
      email: email.toLowerCase(),
      type,
      createdAt: { $gte: rateLimitWindow },
    });

    if (recentOTPs >= otpConfig.rateLimit.max) {
      const oldestOTP = await OTP.findOne({
        email: email.toLowerCase(),
        type,
        createdAt: { $gte: rateLimitWindow },
      }).sort({ createdAt: 1 });

      const resetTime = oldestOTP
        ? new Date(oldestOTP.createdAt.getTime() + otpConfig.rateLimit.windowMs)
        : new Date(now.getTime() + otpConfig.rateLimit.windowMs);

      const remainingTime = Math.ceil((resetTime.getTime() - now.getTime()) / 60000); // minutes

      return {
        canRequest: false,
        message: `Too many OTP requests. Please wait ${remainingTime} minute${remainingTime !== 1 ? 's' : ''} before trying again.`,
        remainingTime,
      };
    }

    return {
      canRequest: true,
      message: 'OTP request allowed',
    };
  } catch (error) {
    console.error('Error checking OTP rate limit:', error);
    return {
      canRequest: false,
      message: 'Unable to process OTP request. Please try again later.',
    };
  }
};

/**
 * Clean up expired OTPs (utility function for maintenance)
 */
export const cleanupExpiredOTPs = async (): Promise<number> => {
  try {
    const result = await OTP.deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { status: { $in: [OTPStatus.VERIFIED, OTPStatus.FAILED] } },
        { createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // 24 hours old
      ],
    });

    console.log(`Cleaned up ${result.deletedCount} expired OTP records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return 0;
  }
};

/**
 * Get OTP statistics for monitoring
 */
export const getOTPStats = async (hours: number = 24) => {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await OTP.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      total: 0,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      successRate: 0,
    };

    stats.forEach((stat) => {
      const type = stat._id.type;
      const status = stat._id.status;
      const count = stat.count;

      summary.total += count;
      summary.byType[type] = (summary.byType[type] || 0) + count;
      summary.byStatus[status] = (summary.byStatus[status] || 0) + count;
    });

    // Calculate success rate
    const verified = summary.byStatus[OTPStatus.VERIFIED] || 0;
    summary.successRate = summary.total > 0 ? (verified / summary.total) * 100 : 0;

    return summary;
  } catch (error) {
    console.error('Error getting OTP stats:', error);
    return null;
  }
};

export default {
  generateOTPCode,
  createOTP,
  verifyOTPWithAttempts,
  canRequestOTP,
  cleanupExpiredOTPs,
  getOTPStats,
};