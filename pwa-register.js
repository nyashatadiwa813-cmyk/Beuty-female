// Register service worker and expose an install helper
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('Service worker registered', reg);
    } catch (err) {
      console.error('Service worker registration failed', err);
    }
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Notify the page that install is available
  document.dispatchEvent(new CustomEvent('pwa:install-available'));
});

window.promptInstall = async () => {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  const accepted = choice.outcome === 'accepted';
  deferredPrompt = null;
  return accepted;
};

// Show a friendly welcome when the app is opened.
(() => {
  function showWelcome() {
    if (!document.body || document.getElementById('anash-welcome')) return;

    const style = document.createElement('style');
    style.textContent = `
      #anash-welcome{position:fixed;inset:0;z-index:11000;display:grid;place-items:center;padding:20px;background:rgba(23,37,84,.72);backdrop-filter:blur(8px);animation:anash-fade-in .25s ease-out}
      #anash-welcome .welcome-card{width:min(440px,100%);padding:32px 26px;text-align:center;border-radius:28px;background:linear-gradient(145deg,#fff,#fff1f7);color:#1f2937;box-shadow:0 24px 70px rgba(15,23,42,.35)}
      #anash-welcome .welcome-flower{font-size:2rem;color:#ec4899}
      #anash-welcome h2{margin:10px 0;font:800 clamp(1.7rem,5vw,2.25rem)/1.15 Inter,Segoe UI,Tahoma,sans-serif;color:#172554}
      #anash-welcome p{margin:0 0 22px;color:#475569;line-height:1.55}
      #anash-welcome button{border:0;border-radius:999px;padding:13px 22px;background:linear-gradient(135deg,#ec4899,#fb7185);color:white;font:800 1rem Inter,Segoe UI,Tahoma,sans-serif;cursor:pointer;box-shadow:0 10px 24px rgba(236,72,153,.28)}
      #anash-welcome button:focus-visible{outline:3px solid #172554;outline-offset:3px}
      @keyframes anash-fade-in{from{opacity:0}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){#anash-welcome{animation:none}}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'anash-welcome';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'anash-welcome-title');
    overlay.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-flower" aria-hidden="true">✿</div>
        <h2 id="anash-welcome-title">Everyone is good-looking</h2>
        <p>Beauty is personal, and everyone has their own glow. Welcome to Anash — a space for self-care, confidence, and kindness.</p>
        <button type="button" id="anash-welcome-continue">Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#anash-welcome-continue').addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', function handleEscape(event) {
      if (event.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handleEscape);
      }
    });
    overlay.querySelector('#anash-welcome-continue').focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showWelcome, { once: true });
  } else {
    showWelcome();
  }
})();
