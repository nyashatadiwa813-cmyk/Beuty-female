// Adds local profile photos, likes, and comments to the community feed.
(() => {
  const POSTS_KEY = 'anash-posts';
  const PROFILE_KEY = 'anash-profile-photo';
  const USER_KEY = 'anash-social-user-id';
  const userId = localStorage.getItem(USER_KEY) || (() => {
    const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(USER_KEY, id);
    return id;
  })();

  const defaults = [
    { author: 'Amina', handle: '@amandaleah', text: 'A simple 3-step routine that helps my skin feel calm and glowing before bed. Cleanse, hydrate, and sleep early.', image: '', date: 'Today' },
    { author: 'Nia', handle: '@nataliewellness', text: 'My favorite gentle body ritual is warm water, soft towels, and a small stretch before bed. It helps me reset after a busy day.', image: '', date: '2h ago' }
  ];

  function readPosts() {
    try {
      const stored = JSON.parse(localStorage.getItem(POSTS_KEY) || 'null');
      const posts = Array.isArray(stored) && stored.length ? stored : defaults;
      let changed = false;
      posts.forEach((post) => {
        if (!post.id) { post.id = `post-${Date.now()}-${Math.random().toString(36).slice(2)}`; changed = true; }
        if (!Array.isArray(post.comments)) { post.comments = []; changed = true; }
        if (!Array.isArray(post.likedBy)) { post.likedBy = []; changed = true; }
        if (!Number.isFinite(post.likes)) { post.likes = 0; changed = true; }
      });
      if (changed || !localStorage.getItem(POSTS_KEY)) localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      return posts;
    } catch {
      localStorage.setItem(POSTS_KEY, JSON.stringify(defaults));
      return readPosts();
    }
  }

  function savePosts(posts) { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function safeImageUrl(value) {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value, location.href);
      return ['https:', 'http:', 'data:'].includes(url.protocol) ? value : '';
    } catch { return ''; }
  }
  function addAvatar(container, name, image, size = 42) {
    const photo = safeImageUrl(image);
    if (photo) {
      const img = node('img', 'avatar post-avatar');
      img.src = photo;
      img.alt = `${name || 'User'} profile picture`;
      img.loading = 'lazy';
      img.style.cssText = `width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;`;
      container.appendChild(img);
    } else {
      const avatar = node('div', 'avatar', (name || 'A').trim().charAt(0).toUpperCase() || 'A');
      avatar.style.cssText = `width:${size}px;height:${size}px;font-size:${Math.max(14, size * .4)}px;border-radius:50%;`;
      container.appendChild(avatar);
    }
  }

  function renderSocialFeed() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    const posts = readPosts();
    feed.replaceChildren();
    posts.forEach((post) => {
      const card = node('article', 'post-card');
      const header = node('div', 'post-header');
      const authorWrap = node('div', 'post-author');
      addAvatar(authorWrap, post.author, post.profileImage, 42);
      const authorDetails = node('div');
      authorDetails.appendChild(node('div', '', post.author || 'Community member'));
      authorDetails.appendChild(node('small', '', post.handle || '@community'));
      authorDetails.lastChild.style.color = 'rgba(255,255,255,.7)';
      authorWrap.appendChild(authorDetails);
      header.append(authorWrap, node('div', 'post-date', post.date || 'Now'));
      card.appendChild(header);
      card.appendChild(node('div', 'post-text', post.text || ''));

      const postImage = safeImageUrl(post.image);
      if (postImage) {
        const image = node('img', 'post-image');
        image.src = postImage;
        image.alt = 'Community post';
        image.loading = 'lazy';
        card.appendChild(image);
      }

      const actions = node('div', 'social-actions');
      actions.style.cssText = 'display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;';
      const liked = post.likedBy.includes(userId);
      const like = node('button', `social-action like-button${liked ? ' liked' : ''}`, `${liked ? '♥' : '♡'} Like · ${post.likes}`);
      like.type = 'button';
      like.dataset.action = 'like';
      like.dataset.postId = post.id;
      like.setAttribute('aria-pressed', String(liked));
      const commentCount = post.comments.length;
      const commentLabel = node('span', 'comment-count', `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`);
      commentLabel.style.cssText = 'color:rgba(255,255,255,.75);font-size:.9rem;';
      actions.append(like, commentLabel);
      card.appendChild(actions);

      const comments = node('div', 'comments-list');
      comments.style.cssText = 'display:grid;gap:8px;margin-top:12px;';
      post.comments.slice(-5).forEach((comment) => {
        const item = node('p', 'post-text', `${comment.author || 'Community member'}: ${comment.text || ''}`);
        item.style.cssText = 'margin:0;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.06);font-size:.9rem;';
        comments.appendChild(item);
      });
      card.appendChild(comments);

      const form = node('form', 'comment-form');
      form.dataset.postId = post.id;
      form.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
      const input = node('input', 'comment-input');
      input.type = 'text';
      input.name = 'comment';
      input.maxLength = 280;
      input.placeholder = 'Write a kind comment…';
      input.setAttribute('aria-label', 'Write a comment');
      input.required = true;
      input.style.cssText = 'flex:1;min-width:0;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:10px 14px;background:rgba(255,255,255,.95);';
      const submit = node('button', 'secondary', 'Comment');
      submit.type = 'submit';
      submit.style.padding = '10px 16px';
      form.append(input, submit);
      card.appendChild(form);
      feed.appendChild(card);
    });
    savePosts(posts);
  }

  function ensureProfilePicker() {
    const form = document.getElementById('postForm');
    const author = document.getElementById('postAuthor');
    if (!form || !author || document.getElementById('profilePhotoFile')) return;
    const field = node('div', 'field full');
    const label = node('label', '', 'Profile picture (optional)');
    label.htmlFor = 'profilePhotoFile';
    const picker = node('input');
    picker.id = 'profilePhotoFile';
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.setAttribute('aria-describedby', 'profilePhotoHelp');
    const help = node('small', '', 'Choose an image. It is resized and stored only in this browser.');
    help.id = 'profilePhotoHelp';
    help.style.color = '#64748b';
    const preview = node('img');
    preview.id = 'profilePhotoPreview';
    preview.alt = 'Profile picture preview';
    preview.hidden = true;
    preview.style.cssText = 'width:64px;height:64px;border-radius:50%;object-fit:cover;';
    field.append(label, picker, help, preview);
    author.closest('.field').after(field);

    const savedPhoto = localStorage.getItem(PROFILE_KEY) || '';
    if (savedPhoto) { preview.src = savedPhoto; preview.hidden = false; }
    picker.addEventListener('change', () => {
      const file = picker.files && picker.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); picker.value = ''; return; }
      if (file.size > 8 * 1024 * 1024) { alert('Choose an image smaller than 8 MB.'); picker.value = ''; return; }
      const reader = new FileReader();
      reader.onerror = () => alert('Could not read that image. Please try another file.');
      reader.onload = () => {
        const source = new Image();
        source.onerror = () => alert('That image could not be opened.');
        source.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 256 / Math.max(source.width, source.height));
          canvas.width = Math.max(1, Math.round(source.width * scale));
          canvas.height = Math.max(1, Math.round(source.height * scale));
          canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
          const photo = canvas.toDataURL('image/jpeg', 0.78);
          try {
            localStorage.setItem(PROFILE_KEY, photo);
            preview.src = photo;
            preview.hidden = false;
            renderSocialFeed();
          } catch { alert('The image could not be saved in browser storage. Try a smaller picture.'); }
        };
        source.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function installFeedActions() {
    const feed = document.getElementById('communityFeed');
    if (!feed || feed.dataset.socialReady) return;
    feed.dataset.socialReady = 'true';
    feed.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="like"]');
      if (!button) return;
      const posts = readPosts();
      const post = posts.find(item => item.id === button.dataset.postId);
      if (!post) return;
      if (post.likedBy.includes(userId)) {
        post.likedBy = post.likedBy.filter(id => id !== userId);
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedBy.push(userId);
        post.likes += 1;
      }
      savePosts(posts);
      renderSocialFeed();
    });
    feed.addEventListener('submit', (event) => {
      const form = event.target.closest('.comment-form');
      if (!form) return;
      event.preventDefault();
      const input = form.elements.comment;
      const text = input.value.trim();
      if (!text) return;
      const posts = readPosts();
      const post = posts.find(item => item.id === form.dataset.postId);
      if (!post) return;
      post.comments.push({ author: document.getElementById('postAuthor')?.value.trim() || 'You', text, createdAt: new Date().toISOString() });
      savePosts(posts);
      renderSocialFeed();
    });
  }

  function init() {
    const feed = document.getElementById('communityFeed');
    if (!feed) return;
    ensureProfilePicker();
    installFeedActions();
    // Replace the demo renderer so user-provided post text is inserted as text,
    // not interpreted as HTML.
    window.renderPosts = renderSocialFeed;
    renderSocialFeed();

    const postForm = document.getElementById('postForm');
    postForm?.addEventListener('submit', () => {
      // The app's existing submit handler creates the post first; enrich it after.
      setTimeout(() => {
        const posts = readPosts();
        if (posts[0]) {
          posts[0].profileImage = localStorage.getItem(PROFILE_KEY) || '';
          savePosts(posts);
          renderSocialFeed();
        }
      }, 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
