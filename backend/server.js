import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import clientRoutes from './routes/clientRoutes.js'; // Added Client Routes
import jobRoutes from './routes/jobRoutes.js';       // Added Job Routes
// ... existing imports
import interviewRoutes from './routes/interviewRoutes.js'; // Add this

// ... middleware

// ... rest of file
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Allows parsing of JSON body
app.use(cors()); // Enable CORS for frontend requests

// Database Connection Logic
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/clients', clientRoutes); // Register Client API
app.use('/api/jobs', jobRoutes);       // Register Job API

app.use('/api/auth', authRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interviews', interviewRoutes); // Add this line

// Base route (Health check)
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});