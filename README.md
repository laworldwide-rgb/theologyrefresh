# Theology RE-fresh

A standalone PWA theology app — three levels, one character.  
Built with Vite, React (createElement), deployed on Vercel.

---

## Project structure

```
theology-refresh/
├── api/
│   └── chat.js          ← Vercel serverless function (holds API key)
├── public/
│   ├── manifest.json    ← PWA manifest
│   └── sw.js            ← Service worker
├── index.html
├── main.js              ← Full React app, no JSX
├── vite.config.js
├── vercel.json
├── package.json
└── .gitignore
```

---

## First-time setup

### 1. Prerequisites
- Node.js 18+ installed
- Git installed
- Vercel CLI: `npm i -g vercel`
- A GitHub account and a new empty repo ready

### 2. Initialize the project

Open a terminal inside the `theology-refresh/` folder.

```bash
# Make sure you are INSIDE the theology-refresh folder first
cd theology-refresh

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/theology-refresh.git
git push -u origin main
```

### 3. Install dependencies locally (for dev only)

```bash
npm install
```

### 4. Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- Set up and deploy: **Y**
- Which scope: your account
- Link to existing project: **N**
- Project name: `theology-refresh`
- Directory: `.` (current directory — where package.json lives)
- Override settings: **N**

### 5. Add the API key in Vercel

Go to your Vercel dashboard → theology-refresh project → Settings → Environment Variables.

Add:
```
ANTHROPIC_API_KEY = sk-ant-...your key here...
```

Set it for **Production**, **Preview**, and **Development**.

Then redeploy:
```bash
vercel --prod
```

---

## Icons

You need two PNG icons for the PWA manifest:
- `public/icon-192.png` — 192×192px
- `public/icon-512.png` — 512×512px

Create these and drop them in the `public/` folder before deploying.  
A simple design: the letters "RF" or a cross on the slate blue background (#3d5a7a).

---

## Local development

```bash
npm run dev
```

Note: The `/api/chat.js` serverless function won't run locally with `vite dev`.  
To test the API locally, use `vercel dev` instead (requires Vercel CLI).

```bash
vercel dev
```

This runs both the frontend and the serverless function together locally.

---

## Syntax check before pushing

Always run before a push:
```bash
node --check main.js
node --check api/chat.js
```

---

## Adding a new level

1. Add the level key and config to the `LEVELS` object in `main.js`
2. Add the system prompt to the `SYSTEM_PROMPTS` object in `api/chat.js`
3. That's it — the UI and routing are driven by the LEVELS config

---

## Analytics

PostHog key is already wired in `main.js`. Tracked events:
- `level_selected` — first-load level choice
- `level_switched` — mid-conversation level change
- `message_sent` — user sends a message
- `message_received` — Prof. Lewis responds
- `pdf_exported` — user downloads conversation
- `about_opened` — user opens About modal
- `a2h_prompt` — install-to-home-screen prompt outcome

---

## Copyright

© 2025 Ellery Aguayo  
Theology RE-fresh is a ministry of Emerald City Sanctuary.

**API key rule:** Never put the key in any file. Vercel environment variables only.
