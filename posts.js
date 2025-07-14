/**
 * Manages blog posts: Handles CRUD operations for posts with multiple
 * image and video uploads to Cloudinary and MongoDB storage.
 *
 * Features: Pagination, tag filtering, JWT-protected post creation, and
 * robust error handling for production.
 */

import { Router } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

const router = Router();
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } 
});
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let postsCollection;
let isConnected = false;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
async function connectDB() {
  try {
    if (!isConnected) {
      await client.connect();
      const db = client.db('blogdb');
      postsCollection = db.collection('posts');
      isConnected = true;
      console.log('MongoDB connected for posts');
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function ensureDBConnection(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
}

router.use(ensureDBConnection);

// Middleware to protect routes
function authorize(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = auth.split(' ')[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
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
    const normalizedPosts = posts.map(post => ({
      ...post,
      images: post.images || (post.image ? [post.image] : []),
      videos: post.videos || [],
      image: undefined
    }));
    const total = await postsCollection.countDocuments(query);
    res.json({
      posts: normalizedPosts,
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
    const post = await postsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({
      ...post,
      images: post.images || (post.image ? [post.image] : []),
      videos: post.videos || [],
      image: undefined
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/posts - Create a new post with optional image and video uploads
router.post('/', authorize, upload.array('media', 10), async (req, res) => {
  try {
    const { title, content, song, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
    let imageUrls = [];
    let videoUrls = [];

    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const isVideo = file.mimetype.startsWith('video/');
          const result = await cloudinary.uploader.upload(file.path, {
            folder: isVideo ? 'blog_videos' : 'blog_images',
            resource_type: isVideo ? 'video' : 'image'
          });
          if (isVideo) {
            videoUrls.push(result.secure_url);
          } else {
            imageUrls.push(result.secure_url);
          }
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ message: 'Media upload failed', error: uploadError.message });
      } finally {
        try {
          for (const file of req.files) {
            if (await fs.access(file.path).then(() => true).catch(() => false)) {
              await fs.unlink(file.path);
            }
          }
        } catch (fsError) {
          console.error('Failed to delete temporary file:', fsError);
        }
      }
    }

    const newPost = {
      title,
      content,
      songUrl: song || null,
      images: imageUrls,
      videos: videoUrls,
      tags: parsedTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await postsCollection.insertOne(newPost);
    newPost._id = result.insertedId;
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

// PUT /api/posts/:id - Update a post with optional image and video uploads
router.put('/:id', authorize, upload.array('media', 10), async (req, res) => {
  try {
    const { title, content, song, tags, existingImages, existingVideos } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const parsedTags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
    let imageUrls = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
    let videoUrls = existingVideos ? (Array.isArray(existingVideos) ? existingVideos : [existingVideos]) : [];

    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const isVideo = file.mimetype.startsWith('video/');
          const result = await cloudinary.uploader.upload(file.path, {
            folder: isVideo ? 'blog_videos' : 'blog_images',
            resource_type: isVideo ? 'video' : 'image'
          });
          if (isVideo) {
            videoUrls.push(result.secure_url);
          } else {
            imageUrls.push(result.secure_url);
          }
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ message: 'Media upload failed', error: uploadError.message });
      } finally {
        try {
          for (const file of req.files) {
            if (await fs.access(file.path).then(() => true).catch(() => false)) {
              await fs.unlink(file.path);
            }
          }
        } catch (fsError) {
          console.error('Failed to delete temporary file:', fsError);
        }
      }
    }

    const updatedPost = {
      title,
      content,
      songUrl: song || null,
      images: imageUrls,
      videos: videoUrls,
      tags: parsedTags,
      updatedAt: new Date().toISOString()
    };

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedPost }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ ...updatedPost, _id: req.params.id });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', authorize, async (req, res) => {
  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.images && post.images.length > 0) {
      for (const url of post.images) {
        const publicId = url.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`blog_images/${publicId}`);
      }
    }
    if (post.videos && post.videos.length > 0) {
      for (const url of post.videos) {
        const publicId = url.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`blog_videos/${publicId}`, {resource_type: 'video'});
      }
    }
    const result = await postsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
});

export default router;