/* 
Handles login, signup and logout for author
*/

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Load admin credentials from environment variables
const getEnvVars = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    console.error('Missing required environment variables: ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET');
  }

  return { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD };
};

// Initialize users array with hashed password
let users = [];
try {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = getEnvVars();
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 8);
  users = [{ id: 1, username: ADMIN_USERNAME, passwordHash }];
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Logic for author login
    const { username, password } = req.body;
    // Validate and authenticate
    const { JWT_SECRET } = getEnvVars();
    const user = users.find((u) => u.username === username);
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
  // Logic for author signup
  res.json({ message: 'Signup route' });
});
  
export default router;
