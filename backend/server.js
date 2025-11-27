import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/authRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';

dotenv.config();

const app = express();

// CORS configuration - ADD localhost:8080
app.use(cors({
  origin: [
    'https://cms-vagarious.netlify.app',
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:8080',  // ADD THIS LINE
    'http://127.0.0.1:8080'   // ADD THIS LINE for IP access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests globally
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Routes - Mount with /api prefix (for organized API structure)
app.use('/api/auth', authRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interviews', interviewRoutes);

// ALSO mount without /api prefix for compatibility with existing frontend
app.use('/auth', authRoutes);
app.use('/recruiters', recruiterRoutes);
app.use('/candidates', candidateRoutes);
app.use('/clients', clientRoutes);
app.use('/jobs', jobRoutes);
app.use('/interviews', interviewRoutes);

// Test routes to verify everything is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test route with /api prefix',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'API test route without /api prefix',
    timestamp: new Date().toISOString()
  });
});

// Test specific endpoints that are failing
app.get('/recruiters', (req, res) => {
  res.json({ 
    message: 'Recruiters endpoint is working',
    data: [] 
  });
});

app.get('/candidates', (req, res) => {
  res.json({ 
    message: 'Candidates endpoint is working',
    data: [] 
  });
});

app.get('/jobs', (req, res) => {
  res.json({ 
    message: 'Jobs endpoint is working',
    data: [] 
  });
});

app.get('/clients', (req, res) => {
  res.json({ 
    message: 'Clients endpoint is working',
    data: [] 
  });
});

app.get('/interviews', (req, res) => {
  res.json({ 
    message: 'Interviews endpoint is working',
    data: [] 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors: {
      allowedOrigins: [
        'https://cms-vagarious.netlify.app',
        'http://localhost:5173',
        'http://localhost:5000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
      ]
    }
  });
});

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Recruitment API is running...',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      withApiPrefix: '/api/...',
      withoutApiPrefix: '/...'
    },
    cors: {
      allowedOrigins: [
        'https://cms-vagarious.netlify.app',
        'http://localhost:5173', 
        'http://localhost:5000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/auth/login',
      '/auth/login',
      '/api/recruiters',
      '/recruiters',
      '/api/candidates', 
      '/candidates',
      '/api/jobs',
      '/jobs',
      '/api/clients',
      '/clients',
      '/api/interviews',
      '/interviews',
      '/api/test',
      '/test',
      '/health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy: Origin not allowed'
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for:');
  console.log('- https://cms-vagarious.netlify.app');
  console.log('- http://localhost:5173');
  console.log('- http://localhost:5000');
  console.log('- http://localhost:8080');
  console.log('- http://127.0.0.1:8080');
});