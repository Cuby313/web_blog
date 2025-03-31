/* 
Handles DOM (document object model) manipulation and event listeners. Connect API
calls to user interactions.
*/ 

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const result = await api.login({ username, password });
      console.log(result);
    });
  }

  const createPostForm = document.getElementById('createPostForrm');
  if (createPostForm) {
    createPostForm.addEventListener('submit', async(e) => {
      e.preventDefault();
      const title = document.getElemenyById('title').value;
      const content = document.getElemenyById('content').value;
      const result = await api.createPost({ title, content });
      console.log(result);
    });
  }
});

// navbar variables
const nav = document.querySelector('.mobile-nav');
const navMenuBtn = document.querySelector('.nav-menu-btn');
const navCloseBtn = document.querySelector('.nav-close-btn');

// navToggle function
const navToggleFunc = function () { nav.classList.toggle('active'); }

navMenuBtn.addEventListener('click', navToggleFunc);
navCloseBtn.addEventListener('click', navToggleFunc);

