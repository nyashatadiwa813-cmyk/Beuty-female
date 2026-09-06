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
