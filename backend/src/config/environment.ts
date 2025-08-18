// src/config/environment.ts - Environment Configuration for MongoDB (Fixed)
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

// Environment validation schema
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_VERSION: z.string().default('v1'),
  
  // Database Configuration
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  MONGODB_TEST_URI: z.string().optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('60m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS Configuration
  FRONTEND_URL: z.string().url().default('http://localhost:8081'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:8081,http://localhost:3000'),
  
  // Email Configuration
  EMAIL_SERVICE: z.enum(['gmail', 'outlook', 'custom']).default('gmail'),
  EMAIL_USER: z.string().email('Please provide a valid email'),
  EMAIL_PASS: z.string().min(1, 'Email password/app password is required'),
  EMAIL_FROM: z.string().email().default('noreply@mentormatch.com'),
  
  // Custom SMTP (if not using Gmail/Outlook)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z.string().transform(Boolean).optional(),
  
  // OTP Configuration
  OTP_EXPIRES_IN: z.string().transform(Number).default('10'), // minutes
  OTP_LENGTH: z.string().transform(Number).default('6'),
  MAX_OTP_ATTEMPTS: z.string().transform(Number).default('5'),
  OTP_RATE_LIMIT_WINDOW: z.string().transform(Number).default('3600000'), // 1 hour in ms
  OTP_RATE_LIMIT_MAX: z.string().transform(Number).default('3'), // max 3 OTPs per hour
  
  // File Upload Configuration (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  
  // Security Configuration
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  PASSWORD_RESET_EXPIRES_IN: z.string().transform(Number).default('15'), // minutes
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('5'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  
  // Feature Flags
  ENABLE_SWAGGER: z.string().transform(Boolean).default('true'),
  ENABLE_LOGGING: z.string().transform(Boolean).default('true'),
});

// Validate and parse environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error('Please check your .env file and ensure all required variables are set.\n');
  
  parseResult.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  
  console.error('\n💡 Copy .env.example to .env.development and fill in the values');
  process.exit(1);
}

export const env = parseResult.data;

// Derived configurations
export const config = {
  // App Configuration
  app: {
    name: 'MentorMatch API',
    version: env.API_VERSION,
    port: env.PORT,
    environment: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  
  // Database Configuration
  database: {
    uri: env.NODE_ENV === 'test' ? env.MONGODB_TEST_URI || env.MONGODB_URI : env.MONGODB_URI,
    options: {
      retryWrites: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  
  // JWT Configuration - Fixed types
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Email Configuration
  email: {
    service: env.EMAIL_SERVICE,
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_SECURE || false,
    },
  },
  
  // OTP Configuration
  otp: {
    expiresIn: env.OTP_EXPIRES_IN * 60 * 1000, // Convert minutes to milliseconds
    length: env.OTP_LENGTH,
    maxAttempts: env.MAX_OTP_ATTEMPTS,
    rateLimit: {
      windowMs: env.OTP_RATE_LIMIT_WINDOW,
      max: env.OTP_RATE_LIMIT_MAX,
    },
  },
  
  // File Upload Configuration
  upload: {
    cloudinary: {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    },
    maxFileSize: env.MAX_FILE_SIZE,
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
  
  // Security Configuration
  security: {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    passwordResetExpiresIn: env.PASSWORD_RESET_EXPIRES_IN * 60 * 1000, // Convert to ms
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    auth: {
      max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  // CORS Configuration
  cors: {
    origin: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  
  // Logging Configuration
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    enabled: env.ENABLE_LOGGING,
  },
  
  // Feature Flags
  features: {
    swagger: env.ENABLE_SWAGGER,
  },
};

// Export individual configurations for easier imports
export const {
  app: appConfig,
  database: dbConfig,
  jwt: jwtConfig,
  email: emailConfig,
  otp: otpConfig,
  upload: uploadConfig,
  security: securityConfig,
  rateLimit: rateLimitConfig,
  cors: corsConfig,
  logging: loggingConfig,
} = config;

// Validation helper
export const validateEnvironment = () => {
  console.log('🔍 Validating environment configuration...');
  
  const required = {
    'MongoDB URI': env.MONGODB_URI,
    'JWT Secret': env.JWT_SECRET,
    'Email User': env.EMAIL_USER,
    'Email Password': env.EMAIL_PASS,
    'Cloudinary Cloud Name': env.CLOUDINARY_CLOUD_NAME,
  };
  
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    return false;
  }
  
  console.log('✅ Environment configuration is valid');
  return true;
};

export default config;