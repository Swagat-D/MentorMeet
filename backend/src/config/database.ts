// backend/src/config/database.ts - Production-Ready MongoDB Configuration
import mongoose from 'mongoose';
import { dbConfig, appConfig } from './environment';

// MongoDB connection state
let isConnected = false;
let connectionRetries = 0;
const maxRetries = 5;
const retryDelay = 5000; // 5 seconds

// Optimized connection options for production
const mongooseOptions = {
  dbName: process.env.DB_NAME || 'mentormatch',
  w: 'majority' as const,
  journal: true,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  compressors: ['zlib' as 'zlib'],
  retryWrites: true,
  retryReads: true,
  readPreference: 'primary' as const,
  appName: 'MentorMatch'
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Connect to MongoDB database with retry logic
 */
export const connectDB = async (): Promise<void> => {
  // Avoid multiple connections
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return;
  }

  while (connectionRetries < maxRetries) {
    try {
      console.log(`🔄 Connecting to MongoDB... (Attempt ${connectionRetries + 1}/${maxRetries})`);
      
      // Set mongoose options for better error handling
      mongoose.set('strictQuery', false);
      mongoose.set('bufferCommands', false);
      
      // Enable query logging in development
      if (!appConfig.isProduction) {
        mongoose.set('debug', true);
      }
      
      // Connect to MongoDB
      await mongoose.connect(dbConfig.uri, mongooseOptions);
      
      isConnected = true;
      connectionRetries = 0; // Reset retry count on successful connection
      
      console.log(`🍃 MongoDB connected successfully`);
      console.log(`📍 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      console.log(`📊 Connection Pool Size: Min=${mongooseOptions.minPoolSize}, Max=${mongooseOptions.maxPoolSize}`);
      
      // Handle connection events
      setupConnectionEventHandlers();
      
      // Verify models
      verifyModels();

      // Create indexes after connection
      await createIndexes();
      
      // Start background maintenance tasks
      startMaintenanceTasks();
      
      return;
      
    } catch (error) {
      connectionRetries++;
      console.error(`❌ MongoDB connection error (Attempt ${connectionRetries}/${maxRetries}):`, error);
      
      if (connectionRetries >= maxRetries) {
        console.error('💥 Max connection retries exceeded. Exiting...');
        if (appConfig.isProduction) {
          process.exit(1);
        }
        throw error;
      }
      
      console.log(`⏳ Retrying connection in ${retryDelay}ms...`);
      await sleep(retryDelay);
    }
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Get database connection status
 */
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    collections: Object.keys(mongoose.connection.collections).length,
  };
};

/**
 * Setup connection event handlers
 */
const setupConnectionEventHandlers = () => {
  const connection = mongoose.connection;
  
  // Connection opened
  connection.on('connected', () => {
    console.log('🟢 Mongoose connected to MongoDB');
    isConnected = true;
    connectionRetries = 0;
  });
  
  // Connection error
  connection.on('error', (error) => {
    console.error('🔴 Mongoose connection error:', error);
    isConnected = false;
    
    // Attempt to reconnect on error
    if (connectionRetries < maxRetries) {
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        connectDB();
      }, retryDelay);
    }
  });
  
  // Connection disconnected
  connection.on('disconnected', () => {
    console.log('🟡 Mongoose disconnected from MongoDB');
    isConnected = false;
  });
  
  // Reconnected
  connection.on('reconnected', () => {
    console.log('🟢 Mongoose reconnected to MongoDB');
    isConnected = true;
    connectionRetries = 0;
  });
  
  // Connection timeout
  connection.on('timeout', () => {
    console.log('⏰ Mongoose connection timeout');
  });
  
  // Connection close
  connection.on('close', () => {
    console.log('🔵 Mongoose connection closed');
    isConnected = false;
  });
  
  // Buffer full
  connection.on('fullsetup', () => {
    console.log('🔧 Mongoose full setup complete');
  });
  
  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    return () => {
      console.log(`\n📡 Received ${signal}. Gracefully shutting down MongoDB connection...`);
      
      mongoose.connection.close()
        .then(() => {
          console.log('🔌 MongoDB connection closed due to application termination');
          process.exit(0);
        })
        .catch((err) => {
          console.error('❌ Error closing MongoDB connection:', err);
          process.exit(1);
        });
    };
  };
  
  // Handle different termination signals
  process.on('SIGINT', gracefulShutdown('SIGINT'));
  process.on('SIGTERM', gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', gracefulShutdown('SIGUSR2')); // Nodemon restart
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION')();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION')();
  });
};

/**
 * Database health check with detailed diagnostics
 */
export const healthCheck = async () => {
  try {
    const status = getConnectionStatus();
    
    if (!isConnected || status.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    // Test database operation with timeout
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    return {
      status: 'healthy',
      connection: status,
      responseTime: `${responseTime}ms`,
      stats: {
        collections: dbStats.collections,
        dataSize: `${Math.round(dbStats.dataSize / 1024 / 1024 * 100) / 100}MB`,
        storageSize: `${Math.round(dbStats.storageSize / 1024 / 1024 * 100) / 100}MB`,
        indexes: dbStats.indexes,
        objects: dbStats.objects,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Create database indexes for better performance
 */
export const createIndexes = async (): Promise<void> => {
  try {
    console.log('🔧 Creating database indexes...');
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }

    const indexPromises = [];
    
    // User indexes
    try {
      indexPromises.push(
        mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true, background: true }),
        mongoose.connection.collection('users').createIndex({ role: 1 }, { background: true }),
        mongoose.connection.collection('users').createIndex({ isEmailVerified: 1 }, { background: true }),
        mongoose.connection.collection('users').createIndex({ isActive: 1 }, { background: true }),
        mongoose.connection.collection('users').createIndex({ onboardingStatus: 1 }, { background: true }),
        mongoose.connection.collection('users').createIndex({ createdAt: -1 }, { background: true }),
        mongoose.connection.collection('users').createIndex({ lastLoginAt: -1 }, { background: true })
      );
      console.log('📋 User indexes queued');
    } catch (error) {
      console.log('📝 User collection indexes will be created when collection exists');
    }
    
    // OTP indexes
    try {
      indexPromises.push(
        mongoose.connection.collection('otps').createIndex({ email: 1, type: 1 }, { background: true }),
        mongoose.connection.collection('otps').createIndex({ email: 1, type: 1, status: 1 }, { background: true }),
        mongoose.connection.collection('otps').createIndex({ code: 1, type: 1 }, { background: true }),
        mongoose.connection.collection('otps').createIndex({ userId: 1 }, { background: true }),
        mongoose.connection.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true }),
        mongoose.connection.collection('otps').createIndex({ createdAt: -1 }, { background: true })
      );
      console.log('📋 OTP indexes queued');
    } catch (error) {
      console.log('📝 OTP collection indexes will be created when collection exists');
    }
    
    // Refresh token indexes
    try {
      indexPromises.push(
        mongoose.connection.collection('refreshtokens').createIndex({ token: 1 }, { unique: true, background: true }),
        mongoose.connection.collection('refreshtokens').createIndex({ userId: 1 }, { background: true }),
        mongoose.connection.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true })
      );
      console.log('📋 Refresh token indexes queued');
    } catch (error) {
      console.log('📝 Refresh token collection indexes will be created when collection exists');
    }

    // Psychometric test indexes (critical for performance)
    try {
      indexPromises.push(
        mongoose.connection.collection('psychometrictests').createIndex({ userId: 1, status: 1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ testId: 1 }, { unique: true, background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ userId: 1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ status: 1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ createdAt: -1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ completedAt: -1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ userId: 1, createdAt: -1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ 'overallResults.hollandCode': 1 }, { background: true }),
        mongoose.connection.collection('psychometrictests').createIndex({ status: 1, completedAt: -1 }, { background: true })
      );
      console.log('📋 Psychometric test indexes queued');
    } catch (error) {
      console.log('📝 Psychometric test collection indexes will be created when collection exists');
    }

    
    // Wait for all indexes to be created
    await Promise.allSettled(indexPromises);
    
    console.log('✅ Database indexes setup completed');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    // Don't throw error, just log it as indexes can be created later
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not established.');
    }
    
    const [stats, collections] = await Promise.all([
      db.stats(),
      db.listCollections().toArray()
    ]);
    
    return {
      database: {
        collections: stats.collections,
        dataSize: `${Math.round(stats.dataSize / 1024 / 1024 * 100) / 100}MB`,
        storageSize: `${Math.round(stats.storageSize / 1024 / 1024 * 100) / 100}MB`,
        indexes: stats.indexes,
        indexSize: `${Math.round(stats.indexSize / 1024 / 1024 * 100) / 100}MB`,
        objects: stats.objects,
        avgObjSize: `${Math.round(stats.avgObjSize)}B`,
      },
      collections: collections.map(col => ({
        name: col.name,
        type: col.type
      })),
      connection: getConnectionStatus()
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
};

/**
 * Verify all models are registered
 */
export const verifyModels = (): void => {
  try {
    const modelNames = mongoose.modelNames();
    console.log('📋 Registered models:', modelNames);
    
    const expectedModels = [
      'User', 'OTP', 'Session', 'StudentProgress', 
      'Achievement', 'LearningInsight', 'Mentor', 
      'Review', 'RefreshToken', 'PsychometricTest'
    ];
    
    const missingModels = expectedModels.filter(model => !modelNames.includes(model));
    
    if (missingModels.length > 0) {
      console.warn('⚠️ Missing models:', missingModels);
    } else {
      console.log('✅ All expected models are registered');
    }
  } catch (error) {
    console.error('❌ Error verifying models:', error);
  }
};

/**
 * Cleanup old documents and optimize database
 */
export const performCleanup = async (): Promise<void> => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    const cleanupTasks = [];
    
    // Clean up expired OTPs (older than 24 hours)
    cleanupTasks.push(
      mongoose.connection.collection('otps').deleteMany({
        $or: [
          { expiresAt: { $lte: new Date() } },
          { status: { $in: ['verified', 'failed'] } },
          { createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      })
    );
    
    // Clean up old abandoned tests (older than 7 days)
    cleanupTasks.push(
      mongoose.connection.collection('psychometrictests').deleteMany({
        status: 'abandoned',
        createdAt: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    );
    
    // Clean up expired refresh tokens
    cleanupTasks.push(
      mongoose.connection.collection('refreshtokens').deleteMany({
        expiresAt: { $lte: new Date() }
      })
    );
    
    const results = await Promise.allSettled(cleanupTasks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const taskNames = ['OTPs', 'abandoned tests', 'refresh tokens'];
        console.log(`🗑️ Cleaned up ${result.value.deletedCount || 0} ${taskNames[index]}`);
      }
    });
    
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  }
};

/**
 * Start background maintenance tasks
 */
const startMaintenanceTasks = () => {
  // Run cleanup every 6 hours
  setInterval(performCleanup, 6 * 60 * 60 * 1000);
  
  // Log connection stats every hour
  setInterval(async () => {
    if (isConnected) {
      const health = await healthCheck();
      if (health.status === 'healthy') {
        console.log(`📊 DB Health: ${health.responseTime} response time, ${health.stats?.objects} objects`);
      }
    }
  }, 60 * 60 * 1000);
};

/**
 * Check database connection and retry if needed
 */
export const ensureConnection = async (): Promise<boolean> => {
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      console.log('🔄 Reconnecting to database...');
      await connectDB();
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure database connection:', error);
    return false;
  }
};

// Export default object with all functions
export default {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
  createIndexes,
  getDatabaseStats,
  performCleanup,
  ensureConnection,
  verifyModels
};