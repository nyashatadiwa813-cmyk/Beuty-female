// Register service worker and expose an install helper.
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

// Preference banner only: this demo currently does not load optional analytics
// or advertising cookies. A preference is stored in localStorage.
(() => {
  const preferenceKey = 'anash-cookie-preference';
  const readPreference = () => {
    try { return localStorage.getItem(preferenceKey); } catch { return null; }
  };
  const savePreference = (value) => {
    try { localStorage.setItem(preferenceKey, value); } catch { /* storage may be disabled */ }
  };

  function addConsentUi() {
    if (!document.body || document.getElementById('anash-cookie-banner')) return;
    const style = document.createElement('style');
    style.textContent = `
      #anash-cookie-banner{position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;max-width:920px;margin:auto;padding:18px;background:#fff;color:#1f2937;border:1px solid #dbe4f0;border-radius:18px;box-shadow:0 14px 40px #0f172a40;font:14px/1.5 Inter,Segoe UI,Tahoma,sans-serif}
      #anash-cookie-banner p{margin:0 0 12px}#anash-cookie-banner a{color:#0369a1;text-decoration:underline}
      #anash-cookie-banner .actions{display:flex;gap:8px;flex-wrap:wrap}
      #anash-cookie-banner button,#anash-cookie-settings{border:0;border-radius:999px;padding:10px 15px;font-weight:700;cursor:pointer}
      #anash-cookie-accept{background:#0369a1;color:#fff}#anash-cookie-reject,#anash-cookie-manage{background:#e2e8f0;color:#1f2937}
      #anash-cookie-banner button:focus-visible,#anash-cookie-settings:focus-visible{outline:3px solid #f472b6;outline-offset:2px}
      #anash-cookie-settings{position:fixed;z-index:9998;right:14px;bottom:14px;background:#fff;color:#1f2937;border:1px solid #cbd5e1;box-shadow:0 4px 16px #0f172a30}
      @media(max-width:520px){#anash-cookie-banner{left:10px;right:10px;bottom:10px}.actions button{flex:1}}
    `;
    document.head.appendChild(style);

    const settings = document.createElement('button');
    settings.id = 'anash-cookie-settings';
    settings.type = 'button';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-label', 'Open cookie settings');
    settings.hidden = !readPreference();
    settings.addEventListener('click', showBanner);
    document.body.appendChild(settings);

    function closeBanner() {
      document.getElementById('anash-cookie-banner')?.remove();
      settings.hidden = false;
    }
    function choose(value) {
      savePreference(value);
      closeBanner();
    }
    function showBanner() {
      let banner = document.getElementById('anash-cookie-banner');
      if (!banner) {
        banner = document.createElement('section');
        banner.id = 'anash-cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Cookie preferences');
        banner.innerHTML = '<p><strong>Your privacy matters.</strong> This site uses browser storage for basic features. Optional analytics or advertising cookies are not currently enabled. Read our <a href="./cookies.html">Cookie &amp; Storage Notice</a> and <a href="./terms.html">Terms of Use</a>.</p><div class="actions"><button type="button" id="anash-cookie-accept">Accept optional cookies</button><button type="button" id="anash-cookie-reject">Reject optional cookies</button><button type="button" id="anash-cookie-manage">Essential only</button></div>';
        document.body.appendChild(banner);
        banner.querySelector('#anash-cookie-accept').addEventListener('click', () => choose('accepted'));
        banner.querySelector('#anash-cookie-reject').addEventListener('click', () => choose('rejected'));
        banner.querySelector('#anash-cookie-manage').addEventListener('click', () => choose('essential-only'));
      }
      banner.hidden = false;
      settings.hidden = true;
      banner.querySelector('#anash-cookie-accept').focus();
    }

    if (!readPreference()) showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addConsentUi, { once: true });
  } else {
    addConsentUi();
  }
})();
