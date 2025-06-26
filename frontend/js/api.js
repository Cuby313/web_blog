/**
 * Handles frontend-backend communication: Provides functions for login,
 * fetching posts, and creating posts.
 *
 * Uses Fetch API to interact with server endpoints.
 */

;(() => {
  const API_BASE = '/api';

  // Login: Authenticate user and return JWT
  async function login({ username, password }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const { token } = await res.json();
        return { success: true, token };
      } else if (res.status === 401) {
        return { success: false, messag: 'Invalid credentials' };
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
       console.error('API login error:', error);
       throw error;
    }
  }

  // Get Posts: Fetch posts with pagination and optional tag filtering
  async function getPosts(page = 1, tag = null) {
    try {
      const url = tag ? `${API_BASE}/posts?page=${page}&tag=${encodeURIComponent(tag)}` : `${API_BASE}/posts?page=${page}`;
      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Could not load posts');
      }
      return res.json();
    } catch (error) {
      console.error('API getPosts error:', error);
      throw error;
    }
  }

  // Create Post: Submit a new post with optional image and song
  async function createPost(formData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: Invalid or expired token');
        }
        const error = await res.json();
        throw new Error(error.message || 'Post creation failed');
      }
      return res.json();
    } catch (error) {
      console.error('API createPost error:', error);
      throw error;
    }
  }

  window.api = { login, getPosts, createPost };
})();