import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './models/database.js';
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import messageRoutes from './routes/messages.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({ 
    service: 'balance-seekr-backend',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      users: {
        getProfile: 'GET /api/users/:address',
        checkUsername: 'GET /api/users/username/check?username=:username',
        registerUsername: 'POST /api/users/username',
        syncXAccount: 'POST /api/users/x-sync'
      },
      groups: {
        listPublic: 'GET /api/groups/public',
        create: 'POST /api/groups',
        join: 'POST /api/groups/:groupId/join',
        checkMembership: 'GET /api/groups/:groupId/members/:address',
        updateJoinPrice: 'PATCH /api/groups/:groupId/join-price',
        updateBackgroundImage: 'PATCH /api/groups/:groupId/background-image'
      },
      messages: {
        list: 'GET /api/groups/:groupId/messages',
        send: 'POST /api/groups/:groupId/messages'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'balance-seekr-backend'
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
// Messages routes are nested under groups - groupId is available in req.params
app.use('/api/groups/:groupId/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('[Server] Starting server...');
    console.log(`[Server] PORT: ${PORT}`);
    console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET'}`);
    
    // Initialize database tables
    console.log('[Server] Initializing database...');
    await initializeDatabase();
    console.log('[Server] Database initialized successfully');

    // Start server - Railway requires listening on 0.0.0.0
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] ✅ Server running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error('[Server] ❌ Failed to start:', error);
    console.error('[Server] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
}

startServer();

