# ⚽ KickLog — AI Match Analyser

Extract frames from your football match videos, tag players, and export labeled screenshots for AI-powered action analysis.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

## What It Does

KickLog is a web app that turns raw match footage into organized, player-tagged frame exports with built-in AI analysis. Uses Gemini Flash for vision-based player identification and Claude Sonnet for tactical summaries.

### Workflow

1. **Upload** your match video (MP4, MOV, WebM)
2. **Extract frames** at a configurable interval (1s, 2s, 3s, 5s, or 10s)
3. **Tag players** — manually add names, or hit **Auto-Tag with AI** to let Gemini identify and tag players automatically
4. **Review & Analyze** — view per-player frame strips and generate **AI tactical summaries** powered by Claude
5. **Export** — download tagged frames as JPEGs and a text summary

## Features

- **AI Auto-Tagging** — Gemini 2.0 Flash identifies distinct players and tags them across all frames
- **AI Player Summaries** — Claude 3.5 Sonnet generates tactical analysis per player from their tagged frames
- **Client-side frame extraction** — video never leaves your browser
- **Configurable frame interval** — balance between detail and volume
- **Multi-player tagging** — color-coded player labels on a visual frame grid (manual or AI)
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
- **Gemini 2.0 Flash** — vision-based player identification & frame tagging
- **Claude 3.5 Sonnet** — tactical player analysis & summaries
- **Netlify Functions** — serverless API proxy for AI calls
- **DM Sans + JetBrains Mono** — typography

## Project Structure

```
kicklog/
├── index.html                        # Entry HTML
├── src/
│   ├── main.jsx                      # React mount point
│   └── KickLog.jsx                   # Main app component
├── netlify/
│   └── functions/
│       ├── identify-players.js       # Gemini: player identification
│       ├── tag-frames.js             # Gemini: batch frame tagging
│       └── generate-summary.js       # Claude: player tactical summary
├── vite.config.js                    # Vite config with Netlify proxy
├── netlify.toml                      # Netlify build, functions & redirect config
├── .env.example                      # Required environment variables
└── package.json
```

## Environment Variables

The AI features require two API keys, set as environment variables (in Netlify dashboard or `.env` for local dev):

| Variable | Purpose | Get it at |
|---|---|---|
| `GOOGLE_AI_API_KEY` | Gemini Flash — player ID & frame tagging | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `ANTHROPIC_API_KEY` | Claude Sonnet — player tactical summaries | [Anthropic Console](https://console.anthropic.com/) |

Copy `.env.example` to `.env` and fill in your keys for local development.

## Deployment

Configured for **Netlify** out of the box:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- SPA redirect: `/* → /index.html` (200)
- Set `GOOGLE_AI_API_KEY` and `ANTHROPIC_API_KEY` in Netlify → Site settings → Environment variables

## License

ISC
