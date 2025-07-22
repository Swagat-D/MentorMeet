import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectDB, healthCheck } from './config/database.js';
import { validateEnvironment } from './config/environment.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { globalRateLimit } from './middleware/rateLimit.middleware.js';
import corsOptions from './config/cors.js';
import './models/index.js';
import psychometricRoutes from './routes/psychometric.routes.js';
import mentorRoutes from './routes/mentor.routes.js'

const app = express();

// Validate environment variables
if (!validateEnvironment()) {
  console.error('❌ Environment validation failed');
  process.exit(1);
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS configuration for mobile access
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Rate limiting
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: dbHealth,
      server: 'running',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/psychometric', psychometricRoutes);
console.log('📝 Psychometric routes registered at /api/v1/psychometric');


// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MentorMatch API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
    },
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Get server IP address
async function getServerIP() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  const results: Record<string, string[]> = {};

  for (const name of Object.keys(nets)) {
    const netArray = nets[name];
    if (netArray) {
      for (const net of netArray) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }
  }
  
  // Return the first available IP
  const interfaces = Object.values(results);
  return interfaces.length > 0 ? interfaces[0][0] : 'localhost';
}

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0'; // Listen on all interfaces
    
    const server = app.listen(Number(PORT), HOST, async () => {
      const serverIP = await getServerIP();
      console.log('\n🚀 ========================================');
      console.log('🎓 MentorMatch API Server Started!');
      console.log('🚀 ========================================');
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server running on:`);
      console.log(`   → Local:    http://localhost:${PORT}`);
      console.log(`   → Network:  http://${serverIP}:${PORT}`);
      console.log(`   → Health:   http://${serverIP}:${PORT}/health`);
      console.log('🚀 ========================================');
      console.log('📱 For React Native development, use the Network URL');
      console.log('🔗 API Endpoints:');
      console.log(`   → Auth: http://${serverIP}:${PORT}/api/v1/auth`);
      console.log('🚀 ========================================\n');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;