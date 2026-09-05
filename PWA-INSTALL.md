## Install as a Progressive Web App (PWA)

This project now includes PWA support on the `pwa/installable` branch. To enable installability you need to add two small snippets to `index.html` and deploy the branch (GitHub Pages/Netlify/Vercel).

1) In the <head> section of `index.html` add these lines (near the viewport meta):

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0369a1">
```

2) Before the closing `</body>` tag add this line to register the service worker and enable the install prompt helper:

```html
<script src="/pwa-register.js"></script>
```

3) Commit & push the branch, then enable GitHub Pages for the repository (Settings → Pages → deploy from branch `main` or the branch you merged into). GitHub Pages uses HTTPS so service workers and installability will work.

Testing locally:

- Serve the folder over a local server (e.g. `python -m http.server 8000`) and open in Chrome. Check DevTools → Application → Manifest and Service Workers.
- After deployment, Chrome/Edge will show an "Install" option in the address bar or you can call `promptInstall()` from the console or tie it to an Install button.

If you want I can update `index.html` directly on the `pwa/installable` branch for you — confirm and I will insert the lines above and open a PR.
