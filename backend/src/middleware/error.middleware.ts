// src/middleware/error.middleware.ts - Error Handling Middleware
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: any[];
  stack?: string;
}

// Handle different types of errors
const handleValidationError = (error: mongoose.Error.ValidationError): ErrorResponse => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
  }));

  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
};

const handleZodError = (error: ZodError): ErrorResponse => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    message: 'Validation failed',
    errors,
  };
};

const handleMongoError = (error: any): ErrorResponse => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      success: false,
      message: `${field} already exists`,
    };
  }

  // Cast error
  if (error.name === 'CastError') {
    return {
      success: false,
      message: 'Invalid ID format',
    };
  }

  return {
    success: false,
    message: 'Database error',
  };
};

const handleJWTError = (): ErrorResponse => ({
  success: false,
  message: 'Invalid token',
});

const handleJWTExpiredError = (): ErrorResponse => ({
  success: false,
  message: 'Token expired',
});

// Development error response
const sendErrorDev = (err: any, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name,
    message: err.message,
    stack: err.stack,
    details: err,
  });
};

// Production error response
const sendErrorProd = (err: any, res: Response): void => {
  let errorResponse: ErrorResponse;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    errorResponse = handleValidationError(err);
    res.status(400).json(errorResponse);
    return;
  }

  // Zod validation error
  if (err instanceof ZodError) {
    errorResponse = handleZodError(err);
    res.status(400).json(errorResponse);
    return;
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    errorResponse = handleMongoError(err);
    res.status(400).json(errorResponse);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse = handleJWTError();
    res.status(401).json(errorResponse);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse = handleJWTExpiredError();
    res.status(401).json(errorResponse);
    return;
  }

  // Operational errors (safe to send to client)
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown errors (don't leak error details)
  console.error('UNKNOWN ERROR:', err);
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
  });
  return;
};

// Global error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  console.error('Error occurred:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Set default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(err);
};

export default {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
};