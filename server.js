/*
Main backend file (starts server and connects routes)

Purpose: Initialize the Express server, load environment variables, 
sets up middleware and connects routes 
*/

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './auth.js';
import postsRouter from './posts.js';

const app = express();
const __dirname = path.resolve();

// Middleware
app.use(cors());
app.use(express.json());

// Static front-end
app.use('/', express.static(path.join(__dirname, 'frontend')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);

// Fallback: serve index.html for any other GET
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});