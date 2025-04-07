/* 
Handles DOM (document object model) manipulation and event listeners. Connect API
calls to user interactions.
*/ 

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const createPostForm = document.getElementById('createPostForm');
  const blogCardGroup = document.querySelector('.blog-card-group');
  const likeButton = document.querySelector('.like-button');
  const likeCount = document.getElementById('likeCount');
  const nav = document.querySelector('.mobile-nav');
  const navMenuBtn = document.querySelector('.nav-menu-btn');
  const navCloseBtn = document.querySelector('.nav-close-btn');
  const loginBtn = document.getElementById('loginBtn');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const loginPopup = document.getElementById('loginPopup');
  const closeLogin = document.getElementById('closeLogin');

  // Mobile navigation menu functionality
  if (navMenuBtn && navCloseBtn && nav) {
    const navToggleFunc = () => { nav.classList.toggle('active'); };
    navMenuBtn.addEventListener('click', navToggleFunc);
    navCloseBtn.addEventListener('click', navToggleFunc);
  }

  // Login popup
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginPopup) {
        loginPopup.classList.add('active');
      }
    });
  }

  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginPopup) {
        loginPopup.classList.add('active');
      }
    });
  }

  if (closeLogin && loginPopup) {
    closeLogin.addEventListener('click', () => {
      loginPopup.classList.remove('active');
    });
  }

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const result = await api.login({ username, password });
        console.log('Login result:', result);

        if (result.success) {
          localStorage.setItem('token', result.token);
          window.location.href = 'dashboard.html';
        } else {
          alert('Invalid username or password!');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }

      loginForm.reset();
      if (loginPopup) {
        loginPopup.classList.remove('active');
      }
    });
  }

  // Creates post form (only dashboard)
  if (createPostForm) {
    createPostForm.addEventListener('submit', async(e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const content = document.getElementById('content').value;
      try { 
        const result = await api.createPost({ title, content });
        console.log('Post created:', result);
        addNewPostToDOM(result);
        createPostForm.reset();
      } catch (error) {
        console.error('Error while creating post:', error);
      }
    });
  }

  // Add a new post to the DOM
  function addNewPostToDOM(post) {
    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    blogCard.innerHTML = `
    <div class="blog-card-banner">
      <img src="${post.picture}" alt="Blog image" width="250" class="blog-banner-img">
    </div>
    <div class="blog-content-wrapper">
      <button class="blog-topic text-tiny">${post.topic}</button>
      <h3 class="h3"><a href="#">${post.title}</a></h3>
      <p class="blog-text">${post.content}</p>
      <div class="wrapper-flex">
        <div class="wrapper">
          <p class="text-sm"><time datetime="${new Date().toISOString().split('T')[0]}"> ${new Date().toLocaleDateString()}</time></p>
        </div>
      </div>
    </div>
    `;

  if (blogCardGroup) {
    blogCardGroup.insertBefore(blogCard, blogCardGroup.firstChild);
    }
  }

  // Load initial posts
  async function loadInitialPosts() {
    try {
      const posts = await api.getPosts();
      posts.forEach(post => addNewPostToDOM(post));
    } catch (error) {
      console.error('Error while loading posts', error);
    }
  }
  loadInitialPosts();

  // Like button functionality
  if (likeButton && likeCount) {
    let likes = parseInt(localStorage.getItem('pageLikes')) || 0;
    let hasLiked = localStorage.getItem('hasLiked') == 'true';

    likeCount.textContent = likes;
    if (hasLiked) {
      likeButton.classList.add('liked');
      likeButton.disabled = true;
    }

    likeButton.addEventListener('click', () => {
      if (!hasLiked) {
        likes += 1;
        likeCount.textContent = likes;
        likeButton.classList.add('liked');
        likeButton.disabled = true;
        
        localStorage.setItem('pageLikes', likes);
        localStorage.setItem('hasLiked', 'true');

        console.log('Page liked! Total likes:', likes);
      }
    });
  }
});
