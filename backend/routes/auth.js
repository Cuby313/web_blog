/* 
Handles login, signup and logout for author
*/

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
    // Logic for author login
    const { username, password } = req.body;
    // Validate and authenticate
    res.json({ message: 'Login route' });
  });
  
  router.post('/signup', (req, res) => {
    // Logic for author signup
    res.json({ message: 'Signup route' });
  });
  
  module.exports = router;