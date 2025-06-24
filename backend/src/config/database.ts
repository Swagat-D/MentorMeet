// src/config/database.ts - MongoDB Connection Configuration (Production Ready)
import mongoose from 'mongoose';
import { dbConfig, appConfig } from './environment';

// MongoDB connection state
let isConnected = false;

// Connection options
const mongooseOptions = {
  ...dbConfig.options,
  dbName: 'mentormatch',
  w: 'majority' as const,
};

/**
 * Connect to MongoDB database
 */
export const connectDB = async (): Promise<void> => {
  // Avoid multiple connections
  if (isConnected) {
    console.log('📦 Using existing MongoDB connection');
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Set mongoose options for better error handling
    mongoose.set('strictQuery', false);
    
    // Connect to MongoDB
    const connection = await mongoose.connect(dbConfig.uri, mongooseOptions);
    
    isConnected = true;
    
    console.log(`🍃 MongoDB connected successfully`);
    console.log(`📍 Database: ${connection.connection.name}`);
    console.log(`🌐 Host: ${connection.connection.host}:${connection.connection.port}`);
    
    // Handle connection events
    setupConnectionEventHandlers();
    
    // Create indexes after connection
    await createIndexes();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Exit process with failure in production
    if (appConfig.isProduction) {
      process.exit(1);
    }
    
    throw error;
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
  });
  
  // Connection error
  connection.on('error', (error) => {
    console.error('🔴 Mongoose connection error:', error);
    isConnected = false;
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
};

/**
 * Database health check
 */
export const healthCheck = async () => {
  try {
    const status = getConnectionStatus();
    
    if (!isConnected || status.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    // Test database operation
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      connection: status,
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
    
    // Check if collections exist first to avoid errors
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    //const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Create indexes only if collections exist or will be created
    // User indexes
    try {
      await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.collection('users').createIndex({ role: 1 });
      await mongoose.connection.collection('users').createIndex({ isEmailVerified: 1 });
      await mongoose.connection.collection('users').createIndex({ isActive: 1 });
      await mongoose.connection.collection('users').createIndex({ onboardingStatus: 1 });
      await mongoose.connection.collection('users').createIndex({ createdAt: -1 });
      await mongoose.connection.collection('users').createIndex({ lastLoginAt: -1 });
      console.log('✅ User indexes created');
    } catch (error) {
      // Ignore errors for non-existent collections
      console.log('📝 User collection indexes will be created when collection exists');
    }
    
    // OTP indexes
    try {
      await mongoose.connection.collection('otps').createIndex({ email: 1, type: 1 });
      await mongoose.connection.collection('otps').createIndex({ email: 1, type: 1, status: 1 });
      await mongoose.connection.collection('otps').createIndex({ code: 1, type: 1 });
      await mongoose.connection.collection('otps').createIndex({ userId: 1 });
      await mongoose.connection.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await mongoose.connection.collection('otps').createIndex({ createdAt: -1 });
      console.log('✅ OTP indexes created');
    } catch (error) {
      console.log('📝 OTP collection indexes will be created when collection exists');
    }
    
    // Refresh token indexes (for future use)
    try {
      await mongoose.connection.collection('refreshtokens').createIndex({ token: 1 }, { unique: true });
      await mongoose.connection.collection('refreshtokens').createIndex({ userId: 1 });
      await mongoose.connection.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      console.log('✅ Refresh token indexes created');
    } catch (error) {
      console.log('📝 Refresh token collection indexes will be created when collection exists');
    }
    
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
    const stats = await db.stats();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
};

/**
 * Cleanup old documents (utility function)
 */
export const performCleanup = async (): Promise<void> => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Clean up expired OTPs (older than 24 hours)
    const otpCleanup = await mongoose.connection.collection('otps').deleteMany({
      $or: [
        { expiresAt: { $lte: new Date() } },
        { status: { $in: ['verified', 'failed'] } },
        { createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    });
    
    console.log(`🗑️ Cleaned up ${otpCleanup.deletedCount || 0} old OTP records`);
    
    // Add more cleanup tasks here as needed
    
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  }
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
};