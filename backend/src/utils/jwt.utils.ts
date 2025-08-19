// src/utils/jwt.utils.ts - JWT Token Management Utilities (Fixed ExpiresIn Types)
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User.model';

// Direct environment variable access with validation
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';

// Validate required environment variables
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Token payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
}

export const generateTokenPair = (user: IUser): TokenPair => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

   const accessToken = jwt.sign(payload, process.env.JWT_SECRET!);
  
  return {
    accessToken,
  };
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: IUser): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '60m',
    issuer: 'mentormatch-api',
    audience: 'mentormatch-app',
  });
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mentormatch-api',
      audience: 'mentormatch-app',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
};
/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  return token;
};

/**
 * Check if token is expired (without verification)
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a simple password reset token (short-lived)
 */
export const generatePasswordResetToken = (userId: string, email: string): string => {
  const payload = {
    userId,
    email,
    type: 'password-reset',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '60m',
    issuer: 'mentormatch-api',
    audience: 'mentormatch-app',
  });
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'mentormatch-api',
      audience: 'mentormatch-app',
    }) as any;

    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Password reset token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid password reset token');
    }
    throw new Error('Password reset token verification failed');
  }
};

/**
 * Create JWT response format for client
 */
export const createTokenResponse = (user: IUser, tokens: TokenPair) => {
  return {
    success: true,
    message: 'Authentication successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isOnboarded: user.isOnboarded,
        avatar: user.avatar,
      },
      tokens: {
        accessToken: tokens.accessToken,
        expiresIn: JWT_EXPIRES_IN,
      },
    },
  };
};

export default {
  generateAccessToken,
  verifyAccessToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  createTokenResponse,
};