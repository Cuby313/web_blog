/* 
Handles user authentication (login and signup)
*/

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const router = Router();
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let usersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db('blogdb');
  usersCollection = db.collection('users');
  const admin = await usersCollection.findOne({ username: process.env.ADMIN_USERNAME });
  if (!admin) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 8);
    await usersCollection.insertOne({
      id: 1,
      username: process.env.ADMIN_USERNAME,
      passwordHash
    });
  }
}
connectDB().catch(console.error);

// Load admin credentials from environment variables
const getEnvVars = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    console.error('Missing required environment variables');
  }
  return { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { JWT_SECRET } = getEnvVars();
    const user = await usersCollection.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/signup', (req, res) => {
  res.status(404).json({ message: 'Signup not supported' });
});
    
export default router;