import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config/environment';

// Global rate limiting
export const globalRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(rateLimitConfig.windowMs / 1000),
    });
  },
});

// Strict rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.auth.max,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.log(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.round(rateLimitConfig.windowMs / 1000),
    });
  },
});

// OTP rate limiting (more restrictive)
export const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 OTP requests per hour per IP
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use both IP and email for key generation
    const email = req.body.email || req.body.userId || req.ip;
    return `otp_${req.ip}_${email}`;
  },
  handler: (req, res) => {
    console.log(`OTP rate limit exceeded for IP: ${req.ip}, Email: ${req.body.email}`);
    res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please try again after an hour.',
      retryAfter: 3600, // 1 hour in seconds
    });
  },
});

// Password reset rate limiting
export const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 password reset attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body.email || req.ip;
    return `reset_${req.ip}_${email}`;
  },
  handler: (req, res) => {
    console.log(`Password reset rate limit exceeded for IP: ${req.ip}, Email: ${req.body.email}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again in 15 minutes.',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// File upload rate limiting
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please try again in 15 minutes.',
      retryAfter: 900,
    });
  },
});

export default {
  globalRateLimit,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
  uploadRateLimit,
};