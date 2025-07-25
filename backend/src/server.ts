// backend/src/server.ts - TypeScript Server Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { networkInterfaces } from 'os';
import { connectDB, healthCheck } from './config/database';
import { validateEnvironment } from './config/environment';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { globalRateLimit } from './middleware/rateLimit.middleware.js';
import studentRoutes from './routes/student.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import './models/index.js'
import psychometricRoutes from './routes/psychometric.routes.js';
const app = express();

// Validate environment variables first
if (!validateEnvironment()) {
  console.error('❌ Environment validation failed');
  process.exit(1);
}

// Get all network interfaces and IPs
function getNetworkIPs() {
  const nets = networkInterfaces();
  const results: Array<{ name: string; address: string; netmask: string }> = [];

  for (const name of Object.keys(nets)) {
    const netArray = nets[name];
    if (netArray) {
      for (const net of netArray) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          results.push({
            name,
            address: net.address,
            netmask: net.netmask,
          });
        }
      }
    }
  }
  return results;
}

// Get the primary network IP
function getPrimaryIP(): string {
  const networkIPs = getNetworkIPs();
  
  // Prefer common private network ranges
  const priorityOrder = ['192.168.', '10.', '172.'];
  
  for (const prefix of priorityOrder) {
    const ip = networkIPs.find(net => net.address.startsWith(prefix));
    if (ip) return ip.address;
  }
  
  // Return first available IP if no preferred found
  return networkIPs.length > 0 ? networkIPs[0].address : 'localhost';
}

// Enhanced CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log(`🌐 CORS Request from origin: ${origin || 'No origin (mobile app)'}`);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Get current network IPs
    const networkIPs = getNetworkIPs().map(net => net.address);
    
    // Allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006', // Expo web
      'http://127.0.0.1:8081',
      ...networkIPs.map(ip => `http://${ip}:8081`),
      ...networkIPs.map(ip => `http://${ip}:19006`),
      ...networkIPs.map(ip => `http://${ip}:3000`),
    ];

    // Add environment-specific origins
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }

    console.log(`📋 Allowed origins:`, allowedOrigins);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // For development, be more lenient
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost with any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('✅ Allowing localhost origin');
        return callback(null, true);
      }
      
      // Allow local network IPs
      const originIP = origin.match(/http:\/\/([\d.]+)/);
      if (originIP && networkIPs.includes(originIP[1])) {
        console.log('✅ Allowing local network IP origin');
        return callback(null, true);
      }
      
      // Allow Expo development URLs
      if (origin.includes('exp://') || origin.includes('expo://')) {
        console.log('✅ Allowing Expo origin');
        return callback(null, true);
      }
    }

    console.log(`❌ Origin not allowed: ${origin}`);
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
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

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS - Must be before other middleware
app.use(cors(corsOptions));

// Add CORS headers manually as backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Compression
app.use(compression());

// Rate limiting
app.use(globalRateLimit);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/mentors', mentorRoutes);
app.use('/api/v1/psychometric', psychometricRoutes);
console.log('📝 Psychometric routes registered at /api/v1/psychometric');
app.use('/api/v1/mentors', mentorRoutes)
console.log('mentor routes registered.')

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const networkIPs = getNetworkIPs();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: dbHealth,
      server: 'running',
      network: {
        primaryIP: getPrimaryIP(),
        allIPs: networkIPs,
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error instanceof Error ? error.message : String(error)),
    });
  }
});

// Network info endpoint
app.get('/network-info', (req, res) => {
  const networkIPs = getNetworkIPs();
  const primaryIP = getPrimaryIP();
  
  res.json({
    primaryIP,
    allNetworkIPs: networkIPs,
    serverURLs: {
      local: `http://localhost:${process.env.PORT || 5000}`,
      network: `http://${primaryIP}:${process.env.PORT || 5000}`,
      health: `http://${primaryIP}:${process.env.PORT || 5000}/health`,
    },
    instructions: {
      message: 'Use the network URL in your React Native app',
      mobileConfig: `Update your frontend api.ts with: BASE_URL: 'http://${primaryIP}:${process.env.PORT || 5000}'`,
    }
  });
});

// Add this route after your other routes
app.get('/api/v1/status', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    res.json({
      success: true,
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status === 'connected' ? 'healthy' : 'unhealthy',
        auth: 'operational',
        student: 'operational',
        mentors: 'operational'
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'degraded',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const networkIPs = getNetworkIPs();
  const primaryIP = getPrimaryIP();
  
  res.json({
    message: 'MentorMatch API Server',
    version: '1.0.0',
    status: 'running',
    network: {
      primaryIP,
      allIPs: networkIPs,
    },
    endpoints: {
      health: '/health',
      networkInfo: '/network-info',
      auth: '/api/v1/auth',
    },
    mobileSetup: {
      instruction: 'Use this URL in your React Native app:',
      baseURL: `http://${primaryIP}:${process.env.PORT || 5000}`,
    }
  });
});

// Test endpoint for mobile connectivity
app.get('/test-mobile', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile connection successful! 🎉',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const PORT = Number(process.env.PORT) || 5000;
    const HOST = '0.0.0.0'; // Listen on all interfaces
    
    const server = app.listen(PORT, HOST, () => {
      const networkIPs = getNetworkIPs();
      const primaryIP = getPrimaryIP();
      
      console.log('\n🚀 ========================================');
      console.log('🎓 MentorMatch API Server Started!');
      console.log('🚀 ========================================');
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server listening on all interfaces (0.0.0.0:${PORT})`);
      console.log('\n📍 Available URLs:');
      console.log(`   → Local:    http://localhost:${PORT}`);
      console.log(`   → Network:  http://${primaryIP}:${PORT}`);
      console.log(`   → Health:   http://${primaryIP}:${PORT}/health`);
      
      if (networkIPs.length > 1) {
        console.log('\n🌐 All Network Interfaces:');
        networkIPs.forEach(net => {
          console.log(`   → ${net.name}: http://${net.address}:${PORT}`);
        });
      }
      
      console.log('\n🚀 ========================================');
      console.log('📱 FOR REACT NATIVE SETUP:');
      console.log(`   Update your frontend/services/api.ts:`);
      console.log(`   BASE_URL: 'http://${primaryIP}:${PORT}'`);
      console.log('\n🔗 API Endpoints:');
      console.log(`   → Auth: http://${primaryIP}:${PORT}/api/v1/auth`);
      console.log(`   → Test: http://${primaryIP}:${PORT}/test-mobile`);
      console.log('🚀 ========================================');
      
      // Test network connectivity
      console.log('\n🧪 Testing network accessibility...');
      console.log(`📝 Copy this URL and test in your mobile browser:`);
      console.log(`   http://${primaryIP}:${PORT}/health`);
      console.log('\n💡 Troubleshooting:');
      console.log('   • Ensure both devices are on the same WiFi network');
      console.log('   • Check firewall settings if connection fails');
      console.log('   • Try disabling firewall temporarily for testing');
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
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT || 5000} is already in use. Try a different port.`);
      console.error('You can change the port in your .env.development file.');
    }
    process.exit(1);
  }
};

startServer();

export default app;