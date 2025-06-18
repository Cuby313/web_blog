/* 
Handles communication between frontend and beckend. Fetch
posts, submit login/signup, create posts...
*/

;(function() {
  const API_BASE = '/api';

  async function login({ username, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const { token } = await res.json();
      return { success: true, token };
    } else if (res.status === 401) {
      return { success: false };
    } else {
      throw new Error('Login failed');
    }
  }

  async function getPosts() {
    const res = await fetch(`${API_BASE}/posts`);
    if (!res.ok) throw new Error('Could not load posts');
    return res.json();
  }

  async function createPost(formData) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData  // must be FormData()
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized');
      throw new Error('Post creation failed');
    }
    return res.json();
  }

  window.api = { login, getPosts, createPost };
})();
