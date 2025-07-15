/**
 * Handles DOM manipulation and event listeners: Connects API calls to user
 * interactions for login, post display and post creation.
 *
 * Features: Responsive navigation, post rendering with Cloudinary images and videos,
 * pagination, YouTube song previews, multiple image and video uploads and media carousel.
 */

const selectedFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded fired, pathname:', window.location.pathname);

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
  const mediaInput = document.getElementById('post-media');
  const mediaPreviewContainer = document.getElementById('media-preview-container');
  const songInput = document.getElementById('song-link');
  const songPreview = document.getElementById('song-preview');
  const blogEditorForm = document.getElementById('blog-editor-form');
  const blogPost = document.querySelector('.blog-post');
  const loadMoreBtn = document.querySelector('.load-more');
  const postList = document.getElementById('post-list');
  const searchInput = document.getElementById('post-search');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  // Logout functionality
  if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }
  if (document.getElementById('mobileLogoutBtn')) {
    document.getElementById('mobileLogoutBtn').addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }

  // Fetch and populate the create/edit post form
  if (id && blogEditorForm) {
    try {
      const post = await api.getPost(id);
      document.getElementById('post-title').value = post.title || '';
      document.getElementById('post-content').value = post.content || '';
      document.getElementById('post-tags').value = post.tags?.join(',') || '';
      document.getElementById('song-link').value = post.songUrl || '';
      if (mediaPreviewContainer && (post.images || post.videos)) {
        selectedFiles.length = 0;
        if (post.images) post.images.forEach(url => selectedFiles.push({ type: 'image', url }));
        if (post.videos) post.videos.forEach(url => selectedFiles.push({ type: 'video', url }));
        updatePreviews();
      }
    } catch (error) {
      console.error('Error fetching post for editing:', error);
      alert(`Failed to load post: ${error.message}`);
    }
  }

  // Generate thumbnail for a video file
  async function generateVideoThumbnail(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        video.currentTime = 1; 
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        URL.revokeObjectURL(video.src);
        resolve(dataUrl);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to generate video thumbnail'));
      };
    });
  }

  function getThumbnail(post) {
    const fallbackImage = 'https://res.cloudinary.com/didhwj8j3/image/upload/v1750941449/front_logo_machu_k8wanc.png';
    
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    
    if (post.videos && post.videos.length > 0) {
      const videoUrl = post.videos[0];
      return videoUrl.replace('/upload/', '/upload/t_media_thumbnail/').replace(/\.[^/.]+$/, '.jpg');
    }
    
    if (post.songUrl) {
      const videoId = extractYouTubeId(post.songUrl);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    
    return fallbackImage;
  }

  // Multiple media preview and deletion
  async function updatePreviews() {
    if (!mediaPreviewContainer) return;
    mediaPreviewContainer.innerHTML = '';
    for (let idx = 0; idx < selectedFiles.length; idx++) {
      const file = selectedFiles[idx];
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-wrapper' + (file.type === 'video' || (file.url && file.url.includes('/video/')) ? ' video-preview' : '');
      const element = document.createElement('img');
      element.className = 'media-preview';
      try {
        if (file.type === 'video' && file.file) {
          element.src = await generateVideoThumbnail(file.file);
        } else if (file.url && file.url.includes('/video/')) {
          element.src = file.url.replace('/upload/', '/upload/t_media_thumbnail/').replace(/\.[^/.]+$/, '.jpg');
        } else {
          element.src = file.url || URL.createObjectURL(file.file);
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        element.src = 'https://res.cloudinary.com/didhwj8j3/image/upload/v1750941449/front_logo_machu_k8wanc.png';
      }
      wrapper.appendChild(element);
      const del = document.createElement('button');
      del.textContent = '×';
      del.className = 'delete-preview';
      del.addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        updatePreviews();
      });
      wrapper.appendChild(del);
      mediaPreviewContainer.appendChild(wrapper);
    }
    mediaPreviewContainer.style.display = selectedFiles.length ? 'block' : 'none';
  }

  if (mediaInput && mediaPreviewContainer) {
    mediaInput.addEventListener('change', async () => {
      Array.from(mediaInput.files).forEach(f => {
        if (!selectedFiles.some(existing => 
          (typeof existing === 'string' && existing === f.name) || 
          (existing.url && existing.url === f.name) || 
          (existing.name && existing.name === f.name)
        )) {
          const isVideo = f.type.startsWith('video/');
          selectedFiles.push({ type: isVideo ? 'video' : 'image', file: f });
        }
      });
      await updatePreviews();
      mediaInput.value = '';
    });
  }

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
      if (loginPopup) loginPopup.classList.add('active');
    });
  }
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginPopup) loginPopup.classList.add('active');
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
        alert(`Login failed: ${error.message}`);
      }
      loginForm.reset();
      if (loginPopup) loginPopup.classList.remove('active');
    });
  }

  // Add a new post to the DOM (for index.html and dashboard.html)
  function addNewPostToDOM(post, targetContainer) {
    if (!targetContainer) {
      console.error('No container (blog-card-group or post-list) found');
      return;
    }
    const maxLength = 200;
    let preview = post.content || '';
    if (preview.length > maxLength) {
      preview = preview.slice(0, maxLength).trimEnd().concat('…');
    }
    const fallbackImage = 'https://res.cloudinary.com/didhwj8j3/image/upload/v1750941449/front_logo_machu_k8wanc.png';
    const mediaSrc = getThumbnail(post); 
    const tagLabel = (post.tags && post.tags.length > 0) ? post.tags[0] : 'BLOG';

    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    blogCard.dataset.tags = (post.tags || []).join(',');
    blogCard.innerHTML = `
      <div class="blog-card-banner">
        <img src="${mediaSrc}" alt="${post.title}" width="250" class="blog-banner-img">
      </div>
      <div class="blog-content-wrapper">
        <button class="blog-topic text-tiny">${post.songUrl ? 'SONG' : (post.videos && post.videos.length > 0 ? 'VIDEO' : 'BLOG')}</button>      
        <button class="blog-topic text-tiny">${tagLabel}</button>
        <h3 class="h3"><a href="post.html?id=${post._id}">${post.title}</a></h3>
        <p class="blog-text">${preview}</p>
        <div class="wrapper-flex">
          <div class="wrapper">
            <p class="text-sm"><time datetime="${post.createdAt ? post.createdAt.split('T')[0] : ''}">${post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</time></p>
          </div>
        </div>
        ${targetContainer === postList ? `
          <button class="btn edit-post" data-id="${post._id}">Edit</button>
          <button class="btn delete-post" data-id="${post._id}">Delete</button>
        ` : ''}
      </div>
    `;
    targetContainer.appendChild(blogCard);
  }

  // Load single post for post.html with carousel
  async function loadSinglePost() {
    if (!blogPost) return;
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (!postId) {
      blogPost.innerHTML = '<p class="entry-content">Post not found.</p>';
      return;
    }
    try {
      const post = await api.getPost(postId);
      const media = [
        ...(post.images && Array.isArray(post.images) ? post.images.map(url => ({ type: 'image', url })) : []),
        ...(post.videos && Array.isArray(post.videos) ? post.videos.map(url => ({ type: 'video', url })) : [])
      ];
      blogPost.innerHTML = `
        ${media.length > 0 ? `
          <div class="post-carousel">
            <div class="carousel-inner">
              ${media.map((item, index) => `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                  <figure class="post-thumbnail">
                    ${item.type === 'video' ? `
                      <video class="entry-media" controls>
                        <source src="${item.url}" type="video/mp4">
                      </video>
                      <button class="play-button" aria-label="Play video">▶</button>
                    ` : `
                      <img src="${item.url}" alt="${post.title} media ${index + 1}" class="entry-media">
                    `}
                    <button class="fullscreen-button" aria-label="Toggle fullscreen">⤢</button>
                  </figure>
                </div>
              `).join('')}
            </div>
            ${media.length > 1 ? `
              <button class="carousel-control prev" aria-label="Previous media">❮</button>
              <button class="carousel-control next" aria-label="Next media">❯</button>
            ` : ''}
          </div>
        ` : ''}
        <h1 class="entry-title">${post.title}</h1>
        <div class="entry-content">
          ${post.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
        ${post.tags && post.tags.length > 0 ? `
          <div class="entry-tags">
            ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
        ${post.songUrl ? `
          <div class="song-preview-container">
            <a href="${post.songUrl}" target="_blank">
              <img src="https://img.youtube.com/vi/${extractYouTubeId(post.songUrl)}/maxresdefault.jpg" alt="Song preview" class="song-preview">
              <ion-icon name="play" class="play-icon"></ion-icon>
            </a>
          </div>
        ` : ''}
        <div class="entry-footer">
          <div class="space-post-footer"></div>
        </div>
      `;

      if (media.length > 1) {
        const carousel = blogPost.querySelector('.post-carousel');
        const items = carousel.querySelectorAll('.carousel-item');
        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        let currentIndex = 0;

        function showSlide(index) {
          items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
            const video = item.querySelector('video');
            if (video) video.pause();
          });
        }

        prevBtn.addEventListener('click', () => {
          currentIndex = (currentIndex - 1 + items.length) % items.length;
          showSlide(currentIndex);
        });

        nextBtn.addEventListener('click', () => {
          currentIndex = (currentIndex + 1) % items.length;
          showSlide(currentIndex);
        });
      }

      blogPost.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', () => {
          const video = button.previousElementSibling;
          if (video.tagName === 'VIDEO') {
            if (video.paused) {
              video.play();
              button.style.display = 'none';
            } else {
              video.pause();
              button.style.display = 'block';
            }
          }
        });
      });

      blogPost.querySelectorAll('.fullscreen-button').forEach(button => {
        button.addEventListener('click', () => {
          const media = button.parentElement.querySelector('.entry-media');
          if (media.requestFullscreen) {
            media.requestFullscreen();
          } else if (media.webkitRequestFullscreen) {
            media.webkitRequestFullscreen();
          } else if (media.msRequestFullscreen) {
            media.msRequestFullscreen();
          }
        });
      });

      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          blogPost.querySelectorAll('video').forEach(video => video.pause());
        }
      });
    } catch (error) {
      console.error('Error loading single post:', error);
      blogPost.innerHTML = `<p class="entry-content">Failed to load post: ${error.message}</p>`;
    }
  }

  // Dashboard: Post creation and editing
  if (blogEditorForm) {
    blogEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('post-title')?.value;
      const content = document.getElementById('post-content')?.value;
      const tags = document.getElementById('post-tags')?.value;
      const song = document.getElementById('song-link')?.value;

      if (!title || !content) {
        alert('Title and content are required');
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      selectedFiles.forEach(item => {
        if (item.url) {
          if (item.type === 'video') {
            formData.append('existingVideos', item.url);
          } else {
            formData.append('existingImages', item.url);
          }
        } else {
          formData.append('media', item.file);
        }
      });
      if (tags) formData.append('tags', tags);
      if (song) formData.append('song', song);

      try {
        const postId = params.get('id');
        if (postId) {
          await api.updatePost(postId, formData);
          alert('Post updated successfully!');
        } else {
          await api.createPost(formData);
          alert('Post created successfully!');
        }
        blogEditorForm.reset();
        selectedFiles.length = 0;
        updatePreviews();
        if (songPreview) songPreview.style.display = 'none';
        window.location.href = 'dashboard.html';
      } catch (error) {
        console.error('Error saving post:', error);
        alert(`Failed to save post: ${error.message}`);
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

  // Dashboard: Post listing, search, and delete/edit with pagination
  let dashboardPageNum = 1;
  async function loadDashboardPosts(query = '', page = 1) {
    if (!postList) return;
    try {
      const { posts, hasMore } = await api.getPosts(page);
      if (page === 1) {
        postList.innerHTML = '';
      }
      const filtered = query
        ? posts.filter(p =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.content.toLowerCase().includes(query.toLowerCase())
          )
        : posts;
      if (filtered.length === 0) {
        postList.innerHTML = '<p>No posts found.</p>';
        return;
      }
      filtered.forEach(post => addNewPostToDOM(post, postList));
      const dashboardLoadMoreBtn = document.querySelector('#post-list ~ .load-more');
      if (dashboardLoadMoreBtn) {
        dashboardLoadMoreBtn.disabled = !hasMore;
        dashboardLoadMoreBtn.textContent = hasMore ? 'Load more' : 'No more posts';
      }
    } catch (error) {
      console.error('Error loading dashboard posts:', error);
      postList.innerHTML = `<p>Failed to load posts: ${error.message}</p>`;
    }
  }

  if (postList && searchInput) {
    await loadDashboardPosts();
    searchInput.addEventListener('input', e => loadDashboardPosts(e.target.value, 1));
    postList.addEventListener('click', async e => {
      const id = e.target.dataset.id;
      if (e.target.classList.contains('edit-post')) {
        window.location.href = `new_post.html?id=${id}`;
      } else if (e.target.classList.contains('delete-post')) {
        if (confirm('Are you sure you want to delete this post?')) {
          try {
            await api.deletePost(id);
            await loadDashboardPosts(searchInput?.value || '');
          } catch (error) {
            console.error('Error deleting post:', error);
            alert(`Failed to delete post: ${error.message}`);
          }
        }
      }
    });
    const dashboardLoadMoreBtn = document.querySelector('#post-list ~ .load-more');
    if (dashboardLoadMoreBtn) {
      dashboardLoadMoreBtn.addEventListener('click', async () => {
        try {
          await loadDashboardPosts(searchInput?.value || '', dashboardPageNum + 1);
          dashboardPageNum++;
        } catch (error) {
          console.error('Error loading more dashboard posts:', error);
          dashboardLoadMoreBtn.textContent = `Error: ${error.message}`;
        }
      });
    }
  }

  // Extract YouTube video ID from URL
  function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Load initial posts for index.html
  async function loadInitialPosts(page = 1) {
    if (!blogCardGroup) {
      console.error('blog-card-group element not found');
      return;
    }
    try {
      const data = await api.getPosts(page, currentTag);
      if (page === 1) {
        blogCardGroup.innerHTML = '';
      }
      if (data.posts && data.posts.length > 0) {
        data.posts.forEach(post => addNewPostToDOM(post, blogCardGroup));
      } else if (page === 1) {
        blogCardGroup.innerHTML = '<p>No posts available.</p>';
      }
      if (loadMoreBtn) {
        loadMoreBtn.disabled = !data.hasMore;
        loadMoreBtn.textContent = data.hasMore ? 'Load more' : 'No more posts';
      }
    } catch (error) {
      console.error('Error while loading posts:', error);
      blogCardGroup.innerHTML = `<p>Failed to load posts: ${error.message}</p>`;
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
      selectedFiles.length = 0;
      updatePreviews();
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
    await loadInitialPosts();
    initializeTopicFilters();
  } else if (currentPage === 'post.html' && blogPost) {
    await loadSinglePost();
  } else if (currentPage === 'dashboard.html' && postList) {
    await loadDashboardPosts();
  }

  // Load more posts for index.html
  let currentPageNum = 1;
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      try {
        await loadInitialPosts(currentPageNum + 1);
        currentPageNum++;
      } catch (error) {
        console.error('Error loading more posts:', error);
        if (loadMoreBtn) {
          loadMoreBtn.textContent = `Error: ${error.message}`;
        }
      }
    });
  }
});