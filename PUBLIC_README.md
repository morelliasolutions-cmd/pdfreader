Public folder preparation

This repository includes a PowerShell helper `prepare_public.ps1` that assembles a deployable `public/` folder containing the minimal files to upload to your static host (Hostinger).

Usage (Windows / PowerShell):

1. Open a PowerShell terminal in the project root (where `prepare_public.ps1` is located).
2. Run:

```powershell
.\prepare_public.ps1
```

What the script copies (if present):
- HTML pages: `index.html`, `mandats.html`, `planif.html`, `vue-generale.html`, `dashboard.html`, `production.html`, `personnel.html`, `parametres.html`
- Static folders: `js/`, `assets/`, `images/`, `fonts/`
- PWA and support files: `manifest.json`, `sw.js`, `favicon.ico`, `robots.txt`, `sitemap.xml`

What the script WILL NOT copy (explicit exclusions):
- Files matching `*.env*`
- `ssh-credentials.json`, `ssh-config.txt`, or other secret files

After running the script, upload the `public/` folder content to Hostinger.

Notes:
- The script uses simple Copy-Item operations and skips missing files.
- Verify `js/config.js` does not contain any service role or admin keys before uploading (only the `anon` key is expected).
- If you need the script adapted for Linux/macOS (bash), tell me and I will add a shell version.
