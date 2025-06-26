/**
 * Handles user authentication: Manages login and admin user setup.
 *
 * Note: Signup is disabled as only admin users are allowed.
 */

import { Router } from 'express';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let usersCollection;

// Connect to MongoDB and initialize admin user
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('blogdb');
    usersCollection = db.collection('users');
    const admin = await usersCollection.findOne({ username: process.env.ADMIN_USERNAME });
    if (!admin) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 8);
      await usersCollection.insertOne({
        id: 1,
        username: process.env.ADMIN_USERNAME,
        passwordHash
      });
      console.log('Admin user created');
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB or create admin:', error);
    throw error;
  }
}
connectDB().catch(error => {
  console.error('MongoDB connection failed, exiting:', error);
  process.exit(1);
});

// POST /api/auth/login - Authenticate user and issue JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await usersCollection.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

// POST /api/auth/signup - Disabled for admin-only access
router.post('/signup', (req, res) => {
  res.status(404).json({ message: 'Signup not supported' });
});
    
export default router;