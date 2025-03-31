/*
Main backend file (starts server and connects routes)

Purpose: Initilize the server, load environment variables, 
start listening 
*/

// Import required modules
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
