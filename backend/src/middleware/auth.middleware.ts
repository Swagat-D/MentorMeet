// src/middleware/auth.middleware.ts - Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt.utils';
import User, { IUser, UserRole } from '../models/User.model';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      userRole?: UserRole;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: IUser;
  userId: string;
  userRole: UserRole;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    // Verify token
    let payload: JWTPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({
        success: false,
        message,
      });
      return;
    }

    // Find user in database
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
      return;
    }

    // Check if email is verified (for protected routes)
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Email verification required',
        requiresVerification: true,
      });
      return;
    }

    // Attach user info to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
    return;
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (user && user.isActive && user.isEmailVerified) {
        req.user = user;
        req.userId = user.id;
        req.userRole = user.role;
      }
    } catch (error) {
      // Invalid token, but continue without authentication
      console.log('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !req.userRole) {
      _res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      _res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.userRole,
      });
      return;
    }

    next();
  };
};

/**
 * Email verification check middleware
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      message: 'Email verification required',
      requiresVerification: true,
    });
    return;
  }

  next();
};

/**
 * Onboarding completion check middleware
 */
export const requireOnboarding = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!req.user.isOnboarded) {
    res.status(403).json({
      success: false,
      message: 'Profile setup incomplete',
      requiresOnboarding: true,
      onboardingStatus: req.user.onboardingStatus,
    });
    return;
  }

  next();
};

/**
 * Admin only middleware
 */
export const adminOnly = authorize(UserRole.ADMIN);

/**
 * Mentor only middleware
 */
export const mentorOnly = authorize(UserRole.MENTOR);

/**
 * Mentee only middleware
 */
export const menteeOnly = authorize(UserRole.MENTEE);

/**
 * Mentor or admin middleware
 */
export const mentorOrAdmin = authorize(UserRole.MENTOR, UserRole.ADMIN);

/**
 * Self or admin access middleware - allows users to access their own data or admins to access anyone's
 */
export const selfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const targetUserId = req.params[userIdParam];
    const isAdmin = req.userRole === UserRole.ADMIN;
    const isSelf = req.userId === targetUserId;

    if (!isSelf && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.',
      });
      return;
    }

    next();
  };
};

/**
 * Active user check middleware
 */
export const requireActiveUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!req.user.isActive) {
    res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Please contact support.',
    });
    return;
  }

  next();
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireEmailVerification,
  requireOnboarding,
  adminOnly,
  mentorOnly,
  menteeOnly,
  mentorOrAdmin,
  selfOrAdmin,
  requireActiveUser,
};