const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const externalPartyRoutes = require('./routes/externalParties');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://gym-softwarefrontend.onrender.com']  // Update with your actual frontend URL
    : 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 Incoming Request: ${req.method} ${req.url}`);
  console.log('  Auth Header:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peerledger';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/external-parties', externalPartyRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
});