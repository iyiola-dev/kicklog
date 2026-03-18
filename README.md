# ⚽ KickLog — AI Match Analyser

Extract frames from your football match videos, tag players, and export labeled screenshots for AI-powered action analysis.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

## What It Does

KickLog is a client-side web app that turns raw match footage into organized, player-tagged frame exports — ready to feed into an AI chat (like Claude) for tactical breakdown.

### Workflow

1. **Upload** your match video (MP4, MOV, WebM)
2. **Extract frames** at a configurable interval (1s, 2s, 3s, 5s, or 10s)
3. **Tag players** — add names with color labels, then click frames where each player appears
4. **Export** — download tagged frames as JPEGs and a text summary, then bring them into an AI conversation for analysis

## Features

- **Client-side processing** — video never leaves your browser
- **Configurable frame interval** — balance between detail and volume
- **Multi-player tagging** — color-coded player labels on a visual frame grid
- **Frame preview** — click any frame to view full-size
- **Batch export** — download all tagged frames organized by player
- **Summary export** — text file with player names, frame counts, and timestamps
- **Player review view** — per-player frame strips for quick review before export
- **Responsive design** — works on desktop and mobile

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/iyiola-dev/kicklog.git
cd kicklog

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/`.

## Tech Stack

- **React 19** — UI
- **Vite 8** — build tooling & dev server
- **Canvas API** — frame extraction from video
- **DM Sans + JetBrains Mono** — typography

## Project Structure

```
kicklog/
├── index.html          # Entry HTML
├── src/
│   ├── main.jsx        # React mount point
│   └── KickLog.jsx     # Main app component
├── vite.config.js      # Vite config with Netlify proxy
├── netlify.toml        # Netlify build & redirect config
└── package.json
```

## Deployment

Configured for **Netlify** out of the box:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* → /index.html` (200)

## License

ISC
