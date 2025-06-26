/**
 * Main backend file: Initializes Express server, loads environment variables,
 * sets up middleware, and connects routes.
 *
 * Purpose: Serves the frontend, handles API requests, and ensures robust
 * configuration for production.
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth.js';
import postsRouter from './posts.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME',
'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error('Missing required enviroment variable: ${envVar}');
    process.exit(1);
  }
}

const app = express();
const __dirname = path.resolve();

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? 'https://guesty-blog.onrender.com' : '*' }));
app.use(express.json());

// Serve static frontend files
app.use('/', express.static(path.join(__dirname, 'frontend')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Fallback: Serve index.html for unmatched GET requests (SPA support)
app.get('*', (req, res) => {
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