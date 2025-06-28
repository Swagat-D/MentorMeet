import User, { IUser, OnboardingStatus } from '../models/User.model';
import { verifyGoogleToken } from '../config/google.config';
import { generateTokenPair, createTokenResponse } from '../utils/jwt.utils';

export interface GoogleAuthResult {
  success: boolean;
  message: string;
  data?: any;
  isNewUser?: boolean;
}

class GoogleAuthService {
  
  /**
   * Authenticate user with Google OAuth token
   */
  async authenticateWithGoogle(googleToken: string): Promise<GoogleAuthResult> {
    try {
      console.log('🔍 [GOOGLE AUTH] Verifying Google token...');
      
      // Verify Google token
      const googleUser = await verifyGoogleToken(googleToken);
      
      if (!googleUser.email) {
        return {
          success: false,
          message: 'Email not provided by Google account',
        };
      }
      
      console.log('✅ [GOOGLE AUTH] Google token verified:', {
        email: googleUser.email,
        name: googleUser.name,
        emailVerified: googleUser.emailVerified,
      });
      
      // Check if user already exists
      let user = await User.findOne({
        $or: [
          { email: googleUser.email.toLowerCase() },
          { googleId: googleUser.googleId }
        ]
      });
      
      let isNewUser = false;
      
      if (user) {
        console.log('👤 [GOOGLE AUTH] Existing user found');
        
        // If user exists with email but no Google ID, link accounts
        if (!user.googleId && user.provider === 'email') {
          user.googleId = googleUser.googleId;
          user.provider = 'google';
          user.isEmailVerified = true;
          user.avatar = user.avatar || googleUser.picture;
          await user.save();
          
          console.log('🔗 [GOOGLE AUTH] Linked existing email account with Google');
        }
        
        // Update user info from Google
        user.name = googleUser.name || user.name;
        user.avatar = user.avatar || googleUser.picture;
        user.isEmailVerified = true;
        
        await user.save();
        await user.updateLastLogin();
        
      } else {
        console.log('👤 [GOOGLE AUTH] Creating new user');
        isNewUser = true;
        
        // Create new user
        user = new User({
          name: googleUser.name,
          email: googleUser.email.toLowerCase(),
          provider: 'google',
          googleId: googleUser.googleId,
          password: null, // No password for Google users
          isEmailVerified: true,
          avatar: googleUser.picture,
          role: 'mentee', // Default role
          onboardingStatus: OnboardingStatus.NOT_STARTED,
        });
        
        await user.save();
        console.log('✅ [GOOGLE AUTH] New Google user created');
      }
      
      // Generate JWT tokens
      const tokens = generateTokenPair(user);
      
      return {
        success: true,
        message: isNewUser ? 'Account created successfully with Google' : 'Signed in successfully with Google',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            provider: user.provider,
            isEmailVerified: user.isEmailVerified,
            isOnboarded: user.isOnboarded,
            onboardingStatus: user.onboardingStatus,
            canChangePassword: user.provider === 'email',
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        },
        isNewUser,
      };
      
    } catch (error: any) {
      console.error('💥 [GOOGLE AUTH] Authentication error:', error);
      return {
        success: false,
        message: error.message || 'Google authentication failed',
      };
    }
  }
  
  /**
   * Unlink Google account (for users who want to switch to email)
   */
  async unlinkGoogleAccount(userId: string, newPassword: string): Promise<GoogleAuthResult> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      
      if (user.provider !== 'google') {
        return {
          success: false,
          message: 'Account is not linked with Google',
        };
      }
      
      // Convert to email account
      user.provider = 'email';
      user.googleId = undefined;
      user.password = newPassword; // Will be hashed by pre-save middleware
      
      await user.save();
      
      return {
        success: true,
        message: 'Google account unlinked successfully. You can now sign in with email and password.',
      };
      
    } catch (error: any) {
      console.error('💥 [GOOGLE AUTH] Unlink error:', error);
      return {
        success: false,
        message: 'Failed to unlink Google account',
      };
    }
  }
}

const googleAuthService = new GoogleAuthService();
export default googleAuthService;

