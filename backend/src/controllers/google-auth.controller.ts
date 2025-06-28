// backend/src/controllers/google-auth.controller.ts - Google OAuth Controller
import { Request, Response } from 'express';
import googleAuthService from '../services/google-auth.service';
import { catchAsync } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Google OAuth login/signup
 */
export const googleAuth = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  console.log('🔐 [GOOGLE AUTH] Google authentication attempt');
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Google token is required',
    });
  }
  
  try {
    const result = await googleAuthService.authenticateWithGoogle(token);
    
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('💥 [GOOGLE AUTH] Controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed',
    });
  }
});

/**
 * Unlink Google account
 */
export const unlinkGoogle = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { password } = req.body;
  const userId = req.userId;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'New password is required',
    });
  }
  
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long',
    });
  }
  
  try {
    const result = await googleAuthService.unlinkGoogleAccount(userId, password);
    
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
    
  } catch (error: any) {
    console.error('💥 [GOOGLE AUTH] Unlink controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlink Google account',
    });
  }
});

export default {
  googleAuth,
  unlinkGoogle,
};

