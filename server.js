const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/database');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Define allowed origins
const allowedOrigins = [
  'https://davidadebanwo.com',
  'https://www.davidadebanwo.com',
  'https://emmanueladama.com',       // Emmanuel's portfolio - REPLACE with actual domain
  'https://www.emmanueladama.com',   // Emmanuel's portfolio - REPLACE with actual domain
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5173',
];

// 2. Configure CORS middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// 3. Apply CORS Middleware - MUST be before routes
app.use(cors(corsOptions));

// 4. Handle Preflight Requests specifically for all routes
app.options('*', cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', messageRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio Backend API is running!',
    endpoints: {
      'POST /api/messages': 'Submit a new message (include "source" field to specify portfolio)',
      'GET /api/messages': 'Retrieve all messages (use ?source=domain.com to filter)',
      'GET /api/messages/:source': 'Retrieve messages for a specific portfolio source',
      'GET /api/sources': 'List all valid portfolio sources'
    }
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see the API info`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});
