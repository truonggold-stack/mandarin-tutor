# Mandarin Tutor - Requirements Audit

## Scope

This audit reflects the current repository state and implemented functionality as of the latest balloon shooter updates.

## Requirements Verification

### ✅ Requirement 1: English-to-Mandarin Translation
Status: Implemented
- `js/translation.js` manages translation workflow and dictionary/API paths.
- `api/translate.js` and `netlify/functions/translate.js` provide serverless translator endpoints.
- `js/main.js` wires UI translate actions.

### ✅ Requirement 2: Save to Lessons or Games
Status: Implemented
- `js/lessons.js` provides lesson CRUD and import/export.
- `js/storage.js` persists lessons, translations, and progress.
- `js/main.js` supports creating lessons/games from saved translations.

### ✅ Requirement 3: Pronunciation Practice + Assessment
Status: Implemented
- `js/practice.js` handles reference playback, recording flow, and assessment handling.
- `api/speech-assessment.js` and `netlify/functions/speech-assessment.js` provide deployment options.
- `server.js` supports local development endpoints and demo fallback without Azure credentials.

### ✅ Requirement 4: Game Experience
Status: Implemented

Classic matching:
- `js/game.js` + `js/ui.js` support drag/drop matching, timer, and stats.

Balloon shooter (new):
- Cross-language audible recall mode (prompt spoken in opposite language of displayed balloons).
- Max 5 balloons per round.
- Bow hold/aim/release interaction with moving balloon targets.
- Lesson-based fixed phrase set support.
- Hit/miss sound effects in `js/audio.js`.
- Main orchestration in `js/main.js`, rendering in `js/ui.js`, styling in `styles.css`.

### ✅ Requirement 5: Progress Tracking
Status: Implemented
- `js/storage.js` and `js/ui.js` maintain game/practice history views.
- `js/main.js` saves and displays game outcomes and practice progress.

### ✅ Requirement 6: Deployment Readiness
Status: Implemented
- Vercel path configured via `vercel.json` and `api/`.
- Netlify path configured via `netlify.toml` and `netlify/functions/`.
- GitHub push to `main` used to trigger Netlify sync/deploy workflow.

## Current Repository Notes

- Documentation and structure now align with modular ES module architecture.
- No stale file cleanup list is included here, since previous list referenced files not present in the current repo.

## Conclusion

All primary product requirements for translation, practice, lesson management, and gameplay are implemented.
The balloon shooter feature set requested in recent updates is now included in the shipped code path.
