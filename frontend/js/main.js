/**
 * Handles DOM manipulation and event listeners: Connects API calls to user
 * interactions for login, post display, and post creation.
 *
 * Features: Responsive navigation, post rendering with Cloudinary images,
 * pagination, and YouTube song previews.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const loginForm = document.getElementById('loginForm');
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
  const imageInput = document.getElementById('post-image');
  const imagePreview = document.getElementById('image-preview');
  const songInput = document.getElementById('song-link');
  const songPreview = document.getElementById('song-preview');
  const blogEditorForm = document.getElementById('blog-editor-form');
  const blogPost = document.querySelector('.blog-post');
  const loadMoreBtn = document.querySelector('.load-more');


  // Mobile navigation toggle
  if (navMenuBtn && navCloseBtn && nav) {
    const navToggleFunc = () => nav.classList.toggle('active');
    navMenuBtn.addEventListener('click', navToggleFunc);
    navCloseBtn.addEventListener('click', navToggleFunc);
  }

  // Login popup toggle
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

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username')?.value;
      const password = document.getElementById('password')?.value;
      if (!username || !password) {
        alert('Please enter both username and password');
        return;
      }
      try {
        const result = await api.login({ username, password });
        if (result.success && result.token) {
          localStorage.setItem('token', result.token);
          window.location.href = 'dashboard.html';
        } else {
          alert(result.message || 'Invalid username or password');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ${error.message}');
      }
      loginForm.reset();
      if (loginPopup) {
        loginPopup.classList.remove('active');
      }
    });
  }

  // Add a new post to the DOM (for index.html)
  function addNewPostToDOM(post) {
    if (!blogCardGroup) {
      console.error('blog-card-group element not found');
      return;
    }
    const maxLength = 200;
    let preview = post.content || '';
    if (preview.length > maxLength) {
      preview = preview.slice(0, maxLength).trimEnd().concat('…');
    }
    const fallbackImage = 'https://res.cloudinary.com/didhwj8j3/image/upload/v1750941449/front_logo_machu_k8wanc.png';
    const imageSrc = post.image || fallbackImage;

    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    blogCard.dataset.tags = (post.tags || []).join(',');
    const tagLabel = (post.tags && post.tags.length > 0) ? post.tags[0] : 'BLOG';
    
    blogCard.innerHTML = `
      <div class="blog-card-banner">
        <img src="${imageSrc}" alt="Blog image" width="250" class="blog-banner-img">
      </div>
      <div class="blog-content-wrapper">
        <button class="blog-topic text-tiny">${post.song ? 'SONG' : 'BLOG'}</button>
        <button class="blog-topic text-tiny">${tagLabel}</button>
        <h3 class="h3"><a href="post.html?id=${post.id}">${post.title}</a></h3>
        <p class="blog-text">${preview}</p>
        <div class="wrapper-flex">
          <div class="wrapper">
            <p class="text-sm"><time datetime="${post.createdAt ? post.createdAt.split('T')[0] : ''}">${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</time></p>
          </div>
        </div>
      </div>
    `;
    blogCardGroup.insertBefore(blogCard, blogCardGroup.firstChild);
  }

  // Load single post for post.html
  async function loadSinglePost() {
    if (!blogPost) return;
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (!postId) {
      blogPost.innerHTML = '<p class="entry-content">Post not found.</p>';
      return;
    }
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Post not found');
      }
      const post = await response.json();
      const fallbackImage = 'https://res.cloudinary.com/didhwj8j3/image/upload/v1750941449/front_logo_machu_k8wanc.png';
      const imageSrc = post.image || fallbackImage;
      
      blogPost.innerHTML = `
        ${post.image ? `
          <figure class="post-thumbnail">
            <img src="${imageSrc}" alt="${post.title}" class="entry-image">
          </figure>
        ` : ''}
        <h1 class="entry-title">${post.title}</h1>
        <div class="entry-content">
          ${post.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        ${post.tags && post.tags.length > 0 ? `
          <div class="entry-tags">
            ${post.tags.map(tag => `<span>#${tag}</span>`).join('')}
          </div>
        ` : ''}
        ${post.song ? `
          <div class="song-preview-container">
            <a href="${post.song}" target="_blank">
              <img src="https://img.youtube.com/vi/${extractYouTubeId(post.song)}/maxresdefault.jpg" alt="Song preview" class="song-preview">
              <ion-icon name="play" class="play-icon"></ion-icon>
            </a>
          </div>
        ` : ''}
        <div class="entry-footer">
          <div class="space-post-footer"></div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading single post:', error);
      blogPost.innerHTML = '<p class="entry-content">Failed to laod post: ${error.message}</p>';
    }
  }

  // Dashboard: Image preview
  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = 'none';
      }
    });
  }

  // Dashboard: Post creation
  if (blogEditorForm) {
    blogEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('post-title')?.value;
      const content = document.getElementById('post-content')?.value;
      const image = document.getElementById('post-image')?.files[0];
      const song = document.getElementById('song-link')?.value;
      const tags = document.getElementById('post-tags')?.value;

      if (!title || !content) {
        alert('Title and content are required');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (tags) formData.append('tags', tags);
      if (image) formData.append('image', image);
      if (song) formData.append('song', song);

      try {
        const result = await api.createPost(formData);
        alert('Post created successfully!');
        blogEditorForm.reset();
        if (imagePreview) imagePreview.style.display = 'none';
        if (songPreview) songPreview.style.display = 'none';
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post: ${error.message}');
      }
    });
  }

  // Dashboard: YouTube song preview
  if (songInput && songPreview) {
    songInput.addEventListener('input', function() {
      const url = this.value;
      const videoId = extractYouTubeId(url);
      if (videoId) {
        songPreview.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        songPreview.style.display = 'block';
      } else {
        songPreview.style.display = 'none';
      }
    });
  }

  // Extract YouTube video ID from URL
  function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Load initial posts for index.html
  async function loadInitialPosts() {
    if (!blogCardGroup) {
      console.error('blog-card-group element not found');
      return;
    }
    try {
      const data = await api.getPosts(1, currentTag);
      blogCardGroup.innerHTML = '';
      if (data.posts && data.posts.length > 0) {
        data.posts.forEach(post => addNewPostToDOM(post));
      } else {
        blogCardGroup.innerHTML = '';
      }
      if (!data.hasMore) {
        if (loadMoreBtn) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = 'No more posts';
        }
      } else {
        if (loadMoreBtn) {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load more';
        }
      }
    } catch (error) {
      console.error('Error while loading posts:', error);
      blogCardGroup.innerHTML = '<p>Failed to load posts: ${error.message}</p>';
    }
  }

  // Like button functionality
  if (likeButton && likeCount) {
    let likes = parseInt(localStorage.getItem('pageLikes') || '0', 10);
    let hasLiked = localStorage.getItem('hasLiked') === 'true';
    likeCount.textContent = likes.toString();

    if (hasLiked) {
      likeButton.classList.add('liked');
      likeButton.disabled = true;
    }

    likeButton.addEventListener('click', () => {
      if (!hasLiked) {
        likes += 1;
        likeCount.textContent = likes.toString();
        likeButton.classList.add('liked');
        likeButton.disabled = true;
        localStorage.setItem('pageLikes', likes);
        localStorage.setItem('hasLiked', 'true');
      }
    });
  }

  // Reset dashboard form
  function resetForm() {
    if (blogEditorForm) {
      blogEditorForm.reset();
      if (imagePreview) imagePreview.style.display = 'none';
      if (songPreview) songPreview.style.display = 'none';
    }
  }
  window.resetForm = resetForm; 

  // Topic filtering
  let currentTag = null;
  function initializeTopicFilters() {
    document.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const tag = btn.dataset.tag;
        if (currentTag === tag) {
          currentTag = null;
          btn.classList.remove('active');
          filterByTag('all');
        } else {
          document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTag = tag;
          filterByTag(tag);
        }
        currentPageNum = 1;
        loadInitialPosts();
      });
    });
  } 

  function filterByTag(tag) {
    document.querySelectorAll('.blog-card').forEach(card => {
      const tags = (card.dataset.tags || '').split(',').map(t => t.trim());
      card.style.display = tag === 'all' || tags.includes(tag) ? '' : 'none';
    });
  }

  // Load posts or single post based on page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage === 'index.html' && blogCardGroup) {
    loadInitialPosts().then(() => {
      initializeTopicFilters();
    });
  } else if (currentPage === 'post.html' && blogPost) {
    loadSinglePost();
  } else if (currentPage === 'dashboard.html') {
    console.log('Dashboard page loaded');
  }

  // Load more posts
  let currentPageNum = 1;
  const POSTS_PER_PAGE = 5;
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      try {
        const data = await api.getPosts(currentPageNum + 1, currentTag);
        if (data.posts && data.posts.length > 0) {
          data.posts.forEach(post => addNewPostToDOM(post));
        } 
        currentPageNum++;
        if (!data.hasMore) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = 'No more posts';
        } else {
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = 'Load more';
        }
      } catch (error) {
        console.error('Error loading more posts:', error);
        if (loadMoreBtn) {
          loadMoreBtn.textContent = 'Error: ${error.message}';
        }
      }
    })
  }
});