// src/server.ts - Main Server Entry Point
import dotenv from 'dotenv';

// Load environment variables first
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

import app from './app'
import { connectDB } from './config/database';
import { validateEnvironment, appConfig } from './config/environment';
import emailService from './services/email.service';

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  
  process.exit(0);
};

// Main server startup function
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting MentorMatch API Server...\n');

    // 1. Validate environment configuration
    console.log('🔍 Validating environment configuration...');
    if (!validateEnvironment()) {
      console.error('❌ Environment validation failed');
      process.exit(1);
    }
    console.log('✅ Environment configuration is valid\n');

    // 2. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully\n');

    // 3. Verify email service
    console.log('📧 Verifying email service...');
    const emailConnected = await emailService.verifyConnection();
    if (emailConnected) {
      console.log('✅ Email service connected successfully\n');
    } else {
      console.log('⚠️ Email service connection failed (continuing anyway)\n');
    }

    // 4. Start HTTP server
    const server = app.listen(appConfig.port, () => {
      console.log('🎉 MentorMatch API Server is running!\n');
      console.log('📊 Server Information:');
      console.log(`   🌐 Environment: ${appConfig.environment}`);
      console.log(`   🔗 Port: ${appConfig.port}`);
      console.log(`   📡 Version: ${appConfig.version}`);
      console.log(`   🕐 Started: ${new Date().toISOString()}`);
      console.log('\n📋 Available Endpoints:');
      console.log(`   🏠 Health Check: http://localhost:${appConfig.port}/health`);
      console.log(`   🔐 API Root: http://localhost:${appConfig.port}/api/${appConfig.version}`);
      console.log(`   🔑 Auth: http://localhost:${appConfig.port}/api/${appConfig.version}/auth`);
      
      if (appConfig.isDevelopment) {
        console.log(`   📚 API Docs: http://localhost:${appConfig.port}/api-docs`);
      }
      
      console.log('\n🎯 Ready to accept connections!\n');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${appConfig.port} is already in use`);
        console.error('💡 Try using a different port or stop the process using this port');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();