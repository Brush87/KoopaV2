---
applyTo: '**'
---

# User Memory

## User Preferences
- Programming languages: TypeScript, JavaScript, Node.js
- Code style preferences: follow existing project conventions
- Development environment: VS Code on macOS
- Communication style: concise, actionable

## Project Context
- Current project type: web app (React + TypeScript)
- Tech stack: React, Node/Express backend, Mongo-like persistence
- Architecture patterns: client-side state in React, backend REST endpoints for persistence

## Coding Patterns
- Memoize focus-sensitive components to avoid remounts
- Use ResizeObserver to compute responsive CSS variables

## Context7 Research History
- (none recorded)

## Deployment & Config Notes
- Frontend uses REACT_APP_API_URL to point to backend (defaults to http://localhost:4000 when unset).
- Backend requires MONGO_URI environment variable (MongoDB connection string).
- Backend seed script available: `backend/seed_one_away_draft.js` and npm script `seed:one-away` in `backend/package.json`.


## Conversation History
- Added Pause/Resume control to `src/App.tsx` to pause timer and prevent auto-draft; Draft button disabled while paused.

## Notes
- Pause/Resume state stored in `paused` in `src/App.tsx`. Timer and auto-draft effects are gated by this flag.
