require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const socketAuth = require('./src/sockets/socketAuth');
const socketHandler = require('./src/sockets/socketHandler');
const { startCleanupJob } = require('./src/cron/cleanupJob');
const { logger } = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket authentication
io.use(socketAuth);

// Socket event handlers
socketHandler(io);

// Make io accessible in routes
app.set('io', io);

// Start cleanup cron job
startCleanupJob();

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Socket.IO ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
