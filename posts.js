/*
Manages blog posts (CRUD operations)
*/

import { Router } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let postsCollection;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function connectDB() {
  await client.connect();
  const db = client.db('blogdb');
  postsCollection = db.collection('posts');
}
connectDB().catch(console.error);

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
router.get('/', async (req, res) => {
  try {
    const posts = await postsCollection.find({}).toArray();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await postsCollection.findOne({ id: req.params.id });
    post ? res.json(post) : res.sendStatus(404);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/posts (protected)
router.post('/', authorize, upload.single('image'), async (req, res) => {
  try {
    const { title, content, song } = req.body;
    const tags = req.body.tags ? req.body.tags.split(',').map((t) => t.trim()): [];
    let imageUrl = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blog_images'
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      song: song || null,
      image: imageUrl,
      tags,
      createdAt: new Date().toISOString()
    };
  
    await postsCollection.insertOne(newPost);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;