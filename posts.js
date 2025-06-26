/**
 * Manages blog posts: Handles CRUD operations for posts with image uploads
 * to Cloudinary and MongoDB storage.
 *
 * Features: Pagination, tag filtering, JWT-protected post creation, and
 * robust error handling for production.
 */

import { Router } from 'express';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let postsCollection;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('blogdb');
    postsCollection = db.collection('posts'); 
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}
connectDB().catch(error => {
  console.error('MongoDB connection failed, exiting:', error);
  process.exit(1);
});

// Middleware to protect routes
function authorize(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.sendStatus(401).json({ message: 'No token provided' });
  }
  const token = auth.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.sendStatus(401).json({ message: 'Invalid token', error: error.message });
  }
}

// GET /api/posts - Fetch posts with pagination and optional tag filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const tag = req.query.tag || null;
    let query = {};
    if (tag) {
      query = { tags: tag };
    }
    const posts = await postsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    const total = await postsCollection.countDocuments(query);
    res.json({
      posts,
      total,
      hasMore: (page * limit) < total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET /api/posts/:id - Fetch a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await postsCollection.findOne({ id: req.params.id });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/posts - Create a new post with optional image upload (protected)
router.post('/', authorize, upload.single('image'), async (req, res) => {
  try {
    const { title, content, song, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
    let imageUrl = null;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'blog_images',
          resource_type: 'image'
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ message: 'Image upload failed', error: uploadError.message });
      } finally {
        try {
          if (await fs.access(req.file.path).then(() => true).catch(() => false)) {
            await fs.unlink(req.file.path);
          }
        } catch (fsError) {
          console.error('Failed to delete temporary file:', fsError);
        }
      }
    }

    const newPost = {
      id: Date.now().toString(),
      title,
      content,
      song: song || null,
      image: imageUrl,
      tags: parsedTags,
      createdAt: new Date().toISOString()
    };
  
    await postsCollection.insertOne(newPost);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

export default router;