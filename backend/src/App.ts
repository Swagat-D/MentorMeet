// src/app.ts - Express App Configuration with Routes
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { env } from './config/environment';
import corsOptions from './config/cors';
import { errorHandler, notFound } from './middleware/error.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import { sanitizeRequest, limitRequestSize } from './middleware/validation.middleware';
import { healthCheck } from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';

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

// Request sanitization and size limiting
app.use(sanitizeRequest);
app.use(limitRequestSize(10 * 1024 * 1024)); // 10MB limit

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
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`${timestamp} - ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    const healthData = {
      status: 'OK',
      message: 'MentorMatch API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      database: dbHealth,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: env.API_VERSION,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API root endpoint
app.get(`/api/${env.API_VERSION}`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'MentorMatch API',
    version: env.API_VERSION,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    endpoints: {
      auth: `/api/${env.API_VERSION}/auth`,
      health: '/health',
      docs: '/api-docs',
    },
    features: {
      authentication: true,
      emailVerification: true,
      passwordReset: true,
      onboarding: true,
      rateLimiting: true,
      cors: true,
      security: true,
    },
  });
});

// API Routes
app.use(`/api/${env.API_VERSION}/auth`, authRoutes);

// API documentation placeholder
if (env.NODE_ENV === 'development') {
  app.get('/api-docs', (_req, res) => {
    res.status(200).json({
      message: 'MentorMatch API Documentation',
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      note: 'Swagger documentation coming soon...',
      endpoints: {
        authentication: {
          register: `POST /api/${env.API_VERSION}/auth/register`,
          login: `POST /api/${env.API_VERSION}/auth/login`,
          verifyEmail: `POST /api/${env.API_VERSION}/auth/verify-email`,
          resendOTP: `POST /api/${env.API_VERSION}/auth/resend-otp`,
          forgotPassword: `POST /api/${env.API_VERSION}/auth/forgot-password`,
          resetPassword: `POST /api/${env.API_VERSION}/auth/reset-password`,
          changePassword: `POST /api/${env.API_VERSION}/auth/change-password`,
          profile: `GET /api/${env.API_VERSION}/auth/me`,
          updateProfile: `PUT /api/${env.API_VERSION}/auth/profile`,
          dashboard: `GET /api/${env.API_VERSION}/auth/dashboard`,
          logout: `POST /api/${env.API_VERSION}/auth/logout`,
        },
        onboarding: {
          updateBasic: `PUT /api/${env.API_VERSION}/auth/onboarding/basic`,
          updateGoals: `PUT /api/${env.API_VERSION}/auth/onboarding/goals`,
          complete: `POST /api/${env.API_VERSION}/auth/onboarding/complete`,
        },
      },
    });
  });
}

// Welcome message for root path
app.get('/', (_req, res) => {
  res.status(200).json({
    message: '🎓 Welcome to MentorMatch API',
    description: 'Student-Mentor Learning Platform Backend',
    version: env.API_VERSION,
    environment: env.NODE_ENV,
    status: 'Running',
    timestamp: new Date().toISOString(),
    links: {
      api: `/api/${env.API_VERSION}`,
      health: '/health',
      docs: env.NODE_ENV === 'development' ? '/api-docs' : null,
    },
  });
});

// 404 handler for undefined routes
app.use('*', notFound);

// Global error handler (must be last)
app.use(errorHandler);

export default app;