// src/config/cors.ts - CORS Configuration for Mobile Access (Fixed)
import { CorsOptions } from 'cors';
import { corsConfig } from './environment';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (corsConfig.origin.includes(origin)) {
      return callback(null, true);
    }

    // For development, allow localhost with any port and mobile development
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost with any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow local network IPs (for mobile development)
      if (/^http:\/\/192\.168\.\d+\.\d+/.test(origin) || 
          /^http:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/.test(origin)) {
        return callback(null, true);
      }
      
      // Allow Expo development URLs
      if (origin.includes('exp://') || origin.includes('expo://')) {
        return callback(null, true);
      }
    }

    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: corsConfig.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export default corsOptions;