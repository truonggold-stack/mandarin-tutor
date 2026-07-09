# Mandarin Tutor

Interactive Mandarin learning app with translation, pronunciation practice, lessons, and two game modes: classic matching and a cross-language balloon shooter.

## Features

### Translation
- English to Mandarin translation with Chinese characters and pinyin
- Save translated phrases for later use
- Create lessons and games from saved translations

### Practice
- Play reference pronunciation audio
- Record learner speech
- Azure Speech assessment via serverless endpoint (or demo fallback)
- Tone/clarity scoring and progress tracking

### Game Modes
- Matching Cards:
  - Drag Chinese cards to matching targets
  - Difficulty levels: easy (3), medium (6), hard (9)
- Balloon Shooter:
  - Fixed max of 5 balloon targets on screen per round
  - Cross-language recall: prompt is spoken in the opposite language from balloon text
  - Hold/aim/release bow interaction with moving balloon targets
  - Lesson-based fixed phrase sets or random dictionary sets
  - Kid-friendly hit/miss sound effects

### Lessons and Sync
- Create, import, export, and delete lessons
- Local publish button writes `data/shared-lessons.json` (localhost only)
- GitHub push + Netlify deploy can share lesson updates via `data/shared-lessons.json`

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
```

### Run locally
```bash
# Demo mode (no Azure credentials)
npm start

# Real Azure pronunciation scoring
AZURE_SPEECH_KEY="your_key" AZURE_SPEECH_REGION="westus3" npm start
```

Open `http://localhost:8000`.

## Azure Setup (Optional)

To enable real pronunciation assessment:
1. Create an Azure Speech resource.
2. Set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.
3. Restart the local server.

Without Azure credentials, the app uses demo scoring so practice still works.

## Deploy and Netlify Sync

The project includes both Vercel and Netlify deployment configs.

For GitHub-to-Netlify lesson sync:
1. In the app, go to Translate -> My Lessons.
2. On localhost, click Publish Lessons (Local) to write `data/shared-lessons.json`.
3. Commit and push to GitHub.
4. Netlify deploy picks up the updated shared lesson file.

Alternative:
1. Export Lessons JSON from the UI.
2. Replace `data/shared-lessons.json` in the repo.
3. Commit and push.

## Project Structure

```text
mandarin-tutor/
|-- index.html
|-- styles.css
|-- server.js
|-- package.json
|-- netlify.toml
|-- vercel.json
|-- data/
|   `-- shared-lessons.json
|-- api/
|   |-- speech-assessment.js
|   `-- translate.js
|-- netlify/functions/
|   |-- speech-assessment.js
|   `-- translate.js
`-- js/
    |-- audio.js
    |-- config.js
    |-- game.js
    |-- lessons.js
    |-- main.js
    |-- practice.js
    |-- storage.js
    |-- translation.js
    `-- ui.js
```

## Data Storage

Local browser storage keys:
- `mandarinLessons`
- `savedTranslations`
- `progressData`

## Notes

- Speech synthesis quality depends on browser/device voices.
- Modern browser required (ES modules, media APIs).
- Microphone permission is needed for pronunciation recording.

## License

Educational use.
