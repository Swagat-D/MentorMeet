// src/app.ts - Express App Configuration
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { env } from './config/environment';
import corsOptions from './config/cors';
import { errorHandler, notFound } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware'
import { healthCheck } from './config/database';

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware (simple console logging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    res.status(200).json({
      status: 'OK',
      message: 'MentorMatch API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      database: dbHealth,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
    });
  }
});

// API root endpoint
app.get(`/api/${env.API_VERSION}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MentorMatch API',
    version: env.API_VERSION,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `/api/${env.API_VERSION}/auth`,
      users: `/api/${env.API_VERSION}/users`,
      otp: `/api/${env.API_VERSION}/otp`,
      onboarding: `/api/${env.API_VERSION}/onboarding`,
      health: '/health',
      docs: '/api-docs',
    },
  });
});

// API routes will be added here
// app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
// app.use(`/api/${env.API_VERSION}/users`, userRoutes);
// app.use(`/api/${env.API_VERSION}/otp`, otpRoutes);

// API documentation (Swagger) - will be added later
if (env.NODE_ENV === 'development') {
  app.get('/api-docs', (req, res) => {
    res.status(200).json({
      message: 'API Documentation will be available here',
      note: 'Swagger documentation coming soon...',
    });
  });
}

// 404 handler for undefined routes
app.use('*', notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;