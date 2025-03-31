/*
Handles API requests (adding/updating/deleting posts)
*/

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const postsFile = path.join(__dirname, '../db/posts.json');

router.get('/', (req, res) => {
    fs.readFile(postsFile, 'utf8', (err, data) => {
        if (err) throw err;
        res.json(JSON.parse(data));
    });
});

router.post('/', (req, res) => {
    res.json({ message: 'Create new post' });
});

module.exports = router;