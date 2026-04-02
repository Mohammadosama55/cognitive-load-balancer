require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./config/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const cognitiveLoadRoutes = require('./routes/cognitiveLoadRoutes');
const contextPreservationRoutes = require('./routes/contextPreservationRoutes');

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/cognitive-load', cognitiveLoadRoutes);
app.use('/api/context-preservation', contextPreservationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cognitive-load-backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      statusCode: 404
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });

  // Cognitive load update event
  socket.on('cognitive-load-update', (data) => {
    io.emit('cognitive-load-changed', data);
  });

  // Context preservation events
  socket.on('context-save', (data) => {
    io.emit('context-saved', data);
  });

  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}: ${error}`);
  });
});

// Store io instance on app for access in routes
app.io = io;

// Database connection
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cognitive-load';

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.warn(`MongoDB not available (${error.message}). Starting in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info('In-memory MongoDB connected successfully (data will not persist between restarts)');
    } catch (memErr) {
      logger.error(`Failed to start in-memory MongoDB: ${memErr.message}`);
    }
  }
};

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  await connectDB();
};

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

module.exports = app;
