// src/middleware/validation.middleware.ts - Debug Request Validation Middleware
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface ValidatedRequest<
  TBody = any,
  TParams extends ParamsDictionary = ParamsDictionary,
  TQuery extends ParsedQs = ParsedQs
> extends Request<TParams, any, TBody, TQuery> {
  body: TBody;
  params: TParams;
  query: TQuery;
}

/**
 * Generic validation middleware factory with enhanced debugging
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log the incoming request data for debugging
      console.log('🔍 [VALIDATION] Incoming request data:', {
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query,
        headers: {
          'content-type': req.get('content-type'),
          'user-agent': req.get('user-agent'),
        },
      });

      // Parse and validate request data
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        file: req.file,
        files: req.files,
      });

      console.log('✅ [VALIDATION] Validation successful');

      // Assign validated data back to request
      req.body = validatedData.body || req.body;
      req.params = validatedData.params || req.params;
      req.query = validatedData.query || req.query;

      next();
      return;
    } catch (error) {
      console.error('❌ [VALIDATION] Validation failed:', {
        error: error instanceof ZodError ? error.errors : error,
        requestBody: req.body,
        requestPath: req.path,
      });

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove the first element (body/params/query)
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as any).received : undefined,
          expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
        }));

        console.error('📋 [VALIDATION] Detailed validation errors:', errorMessages);

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
          debug: {
            receivedBody: req.body,
            expectedSchema: 'Check the API documentation for required fields',
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Validation middleware for request body only with debugging
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 [VALIDATE BODY] Incoming body:', req.body);
      
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
      
      console.log('✅ [VALIDATE BODY] Body validation successful');
      next();
      return;
    } catch (error) {
      console.error('❌ [VALIDATE BODY] Body validation failed:', {
        error: error instanceof ZodError ? error.errors : error,
        requestBody: req.body,
      });

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? (err as any).received : undefined,
          expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
        }));

        console.error('📋 [VALIDATE BODY] Detailed body validation errors:', errorMessages);

        return res.status(400).json({
          success: false,
          message: 'Request validation failed',
          errors: errorMessages,
          debug: {
            receivedBody: req.body,
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Validation middleware for URL parameters only
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: errorMessages,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Validation middleware for query parameters only
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: errorMessages,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Sanitize request data to prevent common issues
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  console.log('🧹 [SANITIZE] Sanitizing request data...');
  
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  console.log('✅ [SANITIZE] Request data sanitized');
  next();
};

/**
 * Helper function to sanitize objects
 */
const sanitizeObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }

        sanitized[key] = sanitizeObject(obj[key]);
      }
    }

    return sanitized;
  }

  if (typeof obj === 'string') {
    // Basic XSS prevention - trim and limit length
    return obj.trim().slice(0, 10000);
  }

  return obj;
};

/**
 * Request size limiter middleware
 */
export const limitRequestSize = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        maxSize: `${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
      });
    }

    next();
    return;
  };
};

export default {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  sanitizeRequest,
  limitRequestSize,
};