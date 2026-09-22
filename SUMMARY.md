🏒 KoopaV2 Application Overview
===========================

Hello Bronco 👋,

This document provides a comprehensive summary of the KoopaV2 application, including its purpose, architecture, technology stack, deployment, and usage. ✨

---

## Purpose 🎯

KoopaV2 is a web-based fantasy hockey draft board and management tool. It enables users to create, manage, and complete fantasy drafts, track player selections, and download final draft results. The app is designed for real-time draft sessions and supports custom player additions, undo/redo, and a responsive, user-friendly interface. 🧩

---

## Architecture 🏗️

- **Frontend:** React (TypeScript, Create React App) ⚛️
  - Handles all user interactions, draft logic, and UI rendering 🖥️
  - Communicates with backend via REST API 🔁
  - Responsive design for desktop and mobile 📱💻
- **Backend:** Node.js (Express) 🚀
  - Provides REST endpoints for drafts, players, and NHL stats proxy 🔌
  - Connects to MongoDB for persistence 🗄️
  - Handles draft completion and returns downloadable results 📥
- **Database:** MongoDB (Atlas or local) 🌩️
  - Stores player pool, draft state, and manager data 📚

---

## Technology Stack 🧰

- **Frontend:**
  - React, TypeScript, CSS Modules ⚛️📝
  - Environment variable: `REACT_APP_API_URL` for backend base URL 🌐
- **Backend:**
  - Node.js, Express, MongoDB driver 🟢
  - Environment variable: `MONGO_URI` for database connection 🔒
  - NHL stats proxy fetches live data for player stats modal 📊
- **Deployment:**
  - MongoDB Atlas (cloud DB) ☁️
  - Render (backend hosting) 🚢
  - Vercel (frontend hosting) 🚀

---

## Key Features ⭐

- Create and join fantasy drafts with custom team names 🏷️
- Add new players to the draft pool ➕🧑‍💼
- Real-time draft board with pick timer and auto-draft ⏱️🤖
- Undo/redo last pick ↩️↪️
- Player stats modal with live NHL data 📈🏒
- Downloadable plain-text results at draft completion (includes player team info) 📄⬇️
- Responsive, modern UI with centered landing page and form 🎨🖼️

---

## File/Folder Structure 📁

- `draft-board/` — Frontend React app ⚛️
  - `src/App.tsx` — Main app logic, landing page, draft board 🧭
  - `src/AddPlayerModal.tsx` — Modal for adding new players ➕
  - `src/PlayerStatsModal.tsx` — Modal for viewing player stats 📊
  - `src/App.css` — Styles for landing, form, and board 🎨
- `backend/` — Node.js API server 🛠️
  - `nhl-proxy.js` — Express server, REST endpoints, NHL stats proxy 🔁
  - `mongo-init.js` — Script to seed player data from NHL API 🌍
  - `seed_one_away_draft.js` — Script to create a draft with one pick left 🕹️
  - `package.json` — Backend dependencies and scripts 📦

---

## Deployment & Configuration 🚦

1. **MongoDB Atlas:** 🗄️
  - Create a cluster and user, get the connection string for `MONGO_URI`. 🔑
2. **Backend (Render):** 🚢
  - Deploy `backend/` folder, set `MONGO_URI` and (optionally) `PORT`.
  - Start command: `node nhl-proxy.js`. ▶️
3. **Frontend (Vercel):** 🌍
  - Deploy `draft-board/` folder, set `REACT_APP_API_URL` to backend URL.
  - Build command: `npm run build`, output: `build/`.
4. **Seeding:** 🧪
  - Run `mongo-init.js` to populate players: 
    ```sh
    cd backend
    MONGO_URI="<your-atlas-uri>" node mongo-init.js
    ```
  - Or run `npm run seed:one-away` for a test draft. 🧾

---

## Usage 🚀

1. Visit the deployed frontend URL. 🌐
2. Create a new draft or join an existing one. 👥
3. Enter team names and start the draft. 🏁
4. Make picks, view player stats, and add new players as needed. 📝
5. When the draft is complete, download the results as a `.txt` file. 📥

---

## Notes 📝

- All API endpoints are environment-configurable for flexible deployment. ⚙️
- The app is designed for easy local development and cloud deployment. 🧰
- For more details, see `DEPLOY.md` in the repo. 📄

---

Thank you, Bronco, for using KoopaV2! 🙏🏆