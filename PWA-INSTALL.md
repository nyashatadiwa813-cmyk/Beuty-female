# Installing the Beauty App (PWA)

This repository now includes a minimal Progressive Web App setup (manifest + service worker) so you can install the app on supporting browsers.

How it works

- manifest.json describes the app (icons, start_url, colors)
- sw.js provides a basic cache-first service worker so your shell can load offline
- pwa-register.js registers the service worker and exposes `window.promptInstall()` to trigger the browser install prompt

Testing locally

1. Serve the repository using a static server (you can use Python):
   ```bash
   python -m http.server 8000
   ```
2. Visit `http://localhost:8000` and open DevTools → Application to inspect the manifest and service worker.

Testing on GitHub Pages

- Make sure Pages is enabled and serving from `main` branch (Settings → Pages).
- Open your Pages URL (https://nyashatadiwa813-cmyk.github.io/Beuty-female/).
- Open DevTools → Application:
  - Manifest should load and show icons
  - Service worker should be registered
  - You may see an install prompt in the address bar or call `window.promptInstall()` from the console

If you run into issues, tell me the exact console errors and I will help fix them.
