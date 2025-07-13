/**
 * Main backend file: Initializes Express server, loads environment variables,
 * sets up middleware and connects routes.
 *
 * Purpose: Serves the frontend, handles API requests and ensures robust
 * configuration for production with restriced access via Basic Authentication
 * and JWT for admin actions.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth.js';
import postsRouter from './posts.js';
import basicAuth from 'express-basic-auth';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = [
  'MONGO_URI', 
  'JWT_SECRET', 
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error('Missing required enviroment variable: ${envVar}');
    process.exit(1);
  }
}

const app = express();
const __dirname = path.resolve();

// Middleware to verify JWT token for bypassing Basic Auth
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return next(); 
    } catch (error) {
      console.log('Proceeding with Basic Auth because JWT is invalid');
    }
  }
  return basicAuth({
    users: { [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD },
    challenge: true,
    unauthorizedResponse: 'Unauthorized: Please provide valid credentials'
  })(req, res, next);
};

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://guesty-blog.onrender.com' : '*' }));
app.use(express.json());

// Apply Basic Auth or JWT verification to static files and posts API, but not auth API
app.use('/', verifyJWT, express.static(path.join(__dirname, 'frontend')));
app.use('/api/posts', postsRouter);

// API routes (no Basic Auth for /api/auth)
app.use('/api/auth', authRouter);

// Fallback: Serve index.html for unmatched GET requests (SPA support) with auth
app.get('*', verifyJWT, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'), (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
})

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});