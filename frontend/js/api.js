/* 
Handles communication between frontend and beckend. Fetch
posts, submit login/signup, create posts...
*/

const API_URL = 'https://localhost:5000/api';

async function login(credentials) {
    const response = await fetch('${API_URL}/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    return response.json();
}

async function getPosts() {
    const response = await fetch('${API_URL}/posts'); 
    return response.json()    
}

async function createPost(postData) {
    const response = await fetch('${API_URL}/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    return response.json();
}