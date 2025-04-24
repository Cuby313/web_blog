/*
Handles API requests (adding/updating/deleting posts)
*/

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const POSTS_FILE = path.join(__dirname, 'posts.json');
const SECRET_KEY = 'your-secret-key'; // Replace with a secure key in production

// Initialize posts.json if it doesn't exist
async function initializePostsFile() {
  try {
    await fs.access(POSTS_FILE);
  } catch {
    await fs.writeFile(POSTS_FILE, JSON.stringify([]));
  }
}
initializePostsFile();

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Hardcoded admin user (for simplicity; replace with proper user management in production)
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ success: true, token });
  }
  res.json({ success: false, message: 'Invalid username or password' });
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = JSON.parse(await fs.readFile(POSTS_FILE));
    res.json(posts);
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, song } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const post = {
      id: Date.now().toString(),
      title,
      content,
      image,
      song,
      createdAt: new Date().toISOString(),
    };

    const posts = JSON.parse(await fs.readFile(POSTS_FILE));
    posts.unshift(post); // Add new post to the beginning
    await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));

    res.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.listen(5000, () => console.log('Server running on https://localhost:5000'));