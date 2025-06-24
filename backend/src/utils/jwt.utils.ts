// src/utils/jwt.utils.ts - JWT Token Management Utilities
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/environment';
import { IUser } from '@/models/User.model';

// Token payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

// Token pair interface
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: 'mentormatch-api',
    audience: 'mentormatch-app',
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: RefreshTokenPayload = {
    userId: user.id,
    email: user.email,
    tokenVersion: 1, // Can be used for token invalidation
  };

  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: 'mentormatch-api',
    audience: 'mentormatch-app',
  });
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (user: IUser): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
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
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
      issuer: 'mentormatch-api',
      audience: 'mentormatch-app',
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  // Check if header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract token (remove 'Bearer ' prefix)
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

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: '15m', // Short-lived for security
    issuer: 'mentormatch-api',
    audience: 'mentormatch-app',
  });
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): { userId: string; email: string } => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
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
        refreshToken: tokens.refreshToken,
        expiresIn: jwtConfig.expiresIn,
      },
    },
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  isTokenExpired,
  getTokenExpiration,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  createTokenResponse,
};