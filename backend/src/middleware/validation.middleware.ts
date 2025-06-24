// src/middleware/validation.middleware.ts - Request Validation Middleware
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
 * Generic validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate request data
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        file: req.file,
        files: req.files,
      });

      // Assign validated data back to request
      req.body = validatedData.body || req.body;
      req.params = validatedData.params || req.params;
      req.query = validatedData.query || req.query;

      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'), // Remove the first element (body/params/query)
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
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
 * Validation middleware for request body only
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
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
          message: 'Request validation failed',
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
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

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