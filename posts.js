/*
Handles API requests (adding/updating/deleting posts)
*/

import { Router } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// In-memory posts store
let posts = [];

// Load JWT_SECRET from environment variables
const getEnvVars = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return { JWT_SECRET };
};

// Middleware to protect routes
function authorize(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.sendStatus(401);
  const token = auth.split(' ')[1];
  try {
    const { JWT_SECRET } = getEnvVars();
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(401);
  }
}

// GET /api/posts
router.get('/', (req, res) => {
  res.json(posts);
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  post ? res.json(post) : res.sendStatus(404);
});

// POST /api/posts (protected)
router.post('/', authorize, upload.single('image'), (req, res) => {
  const { title, content, song } = req.body;
  const tags = req.body.tags ? req.body.tags.split(',').map((t) => t.trim()): [];
  const imageUrl = req.file ? `/uploads/${path.basename(req.file.path)}` : null;

  const newPost = {
    id: Date.now().toString(),
    title,
    content,
    song: song || null,
    image: imageUrl || null,
    tags,
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  res.status(201).json(newPost);
});

export default router;
