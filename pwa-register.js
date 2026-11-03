// Register the service worker and provide the PWA install helper.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service worker registered', registration);
    } catch (error) {
      console.error('Service worker registration failed', error);
    }
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  document.dispatchEvent(new CustomEvent('pwa:install-available'));
});

window.promptInstall = async () => {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome === 'accepted';
};

// Welcome overlay and social feed enhancements.
(() => {
  function showWelcome() {
    if (!document.body || document.getElementById('anash-welcome')) return;
    const style = document.createElement('style');
    style.textContent = '#anash-welcome{position:fixed;inset:0;z-index:11000;display:grid;place-items:center;padding:20px;background:rgba(23,37,84,.72);backdrop-filter:blur(8px)}#anash-welcome .welcome-card{width:min(440px,100%);padding:32px 26px;text-align:center;border-radius:28px;background:linear-gradient(145deg,#fff,#fff1f7);color:#1f2937;box-shadow:0 24px 70px rgba(15,23,42,.35)}#anash-welcome .welcome-flower{font-size:2rem;color:#ec4899}#anash-welcome h2{margin:10px 0;font:800 clamp(1.7rem,5vw,2.25rem)/1.15 Inter,Segoe UI,Tahoma,sans-serif;color:#172554}#anash-welcome p{margin:0 0 22px;color:#475569;line-height:1.55}#anash-welcome button{border:0;border-radius:999px;padding:13px 22px;background:linear-gradient(135deg,#ec4899,#fb7185);color:white;font-weight:800;cursor:pointer}#anash-welcome button:focus-visible{outline:3px solid #172554;outline-offset:3px}';
    document.head.appendChild(style);
    const overlay = document.createElement('div');
    overlay.id = 'anash-welcome';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'anash-welcome-title');
    overlay.innerHTML = '<div class="welcome-card"><div class="welcome-flower" aria-hidden="true">✿</div><h2 id="anash-welcome-title">Everyone is good-looking</h2><p>Beauty is personal, and everyone has their own glow. Welcome to Anash — a space for self-care, confidence, and kindness.</p><button type="button" id="anash-welcome-continue">Continue</button></div>';
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#anash-welcome-continue').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    document.addEventListener('keydown', function handleEscape(event) {
      if (event.key === 'Escape') { close(); document.removeEventListener('keydown', handleEscape); }
    });
    overlay.querySelector('#anash-welcome-continue').focus();
  }
  function loadSocialFeatures() {
    if (document.querySelector('script[data-community-social]')) return;
    const script = document.createElement('script');
    script.src = './community-social.js';
    script.defer = true;
    script.dataset.communitySocial = 'true';
    document.body.appendChild(script);
  }
  function init() { showWelcome(); loadSocialFeatures(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
