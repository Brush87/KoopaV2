# 🏒 KoopaV2 — Fantasy Hockey Draft Board & Management Platform

Welcome to **KoopaV2**, a modern, web-based fantasy hockey draft board application. This repository provides a real-time, responsive draft experience supporting custom league setups, automated timer controls, player statistical deep dives via the official NHL API, undraft/undo capabilities, and plain-text draft summary exports.

---

## 🏗️ Architecture & Technology Stack

* **Frontend**: React (TypeScript, Create React App)
  * **Styling**: Modern CSS3 with glassmorphism, responsive grid layouts, sticky navigation bars, and custom HSL position badge theme.
  * **State & Communication**: React Hooks, REST API calls (`fetch`), custom search/select input, modal overlays.
* **Backend**: Node.js & Express
  * **API Layer**: REST endpoints handling draft creation, pick updates, undraft requests, results exports, and NHL proxy calls.
  * **Database Driver**: Official MongoDB Node.js Driver with automated fallback to `mongodb-memory-server` for zero-config local development.
* **Database**: MongoDB Atlas (Cloud) / Local MongoDB
  * **Collections**: `players` (master player pool) and `drafts` (live draft states and manager rosters).
* **External Integrations**:
  * **NHL Stats & Roster APIs**: Fetches active team rosters and merges `/skater/summary` and `/skater/realtime` statistical data on demand.
* **Deployment**:
  * **Backend**: Render (Node.js Web Service)
  * **Frontend**: Vercel (Create React App Static Build)

---

## ⭐ Core Features

1. **Flexible League Setup**:
   * Create drafts with 2 to 20 teams and custom team names.
   * View, resume, or delete active drafts from the landing dashboard.

2. **Snake-Draft Board Engine**:
   * Auto-calculates overall pick numbers and active team turn order across 18 rounds.
   * Highlights the current team "on the clock" with active glowing column indicators.
   * Supports responsive horizontal scrolling with a sticky round indicator sidebar for wide draft boards.

3. **Timer & Auto-Draft (Kyle Wellwood `💩` Tradition)**:
   * 90-second countdown timer per pick with visual circular progress ring.
   * Plays animated "BEATS" indicator during overtime.
   * Automatically drafts the special Kyle Wellwood `💩` placeholder at -30s if time expires.

4. **Player Stats Deep-Dive Modal**:
   * Click any drafted card to view full season-by-season career statistics.
   * Merges skater summary metrics (Goals, Assists, Points, +/-, ToI, STG, STP) with physical metrics (Hits, Blocks).
   * Supports goalie-specific statistics (Wins, Saves, Shutouts, Save Percentage).

5. **Undraft / Undo Capabilities**:
   * Easily undo the previous pick at any time to return the player to the available pool.

6. **On-Demand Draft Results Download**:
   * Header `Download Draft` button lights up green upon draft completion.
   * Downloads a formatted `.txt` text file breaking down every round and manager roster.

7. **Custom Player Addition**:
   * Add custom players on-the-fly with position, team abbreviation, and emoji avatars.

---

## 🛠️ Summary of Recent Refactoring & Improvements

### 1. Backend & Persistence Fixes
* **Safe ObjectId & String Lookup**: Refactored `findDraftDoc(id)` in `backend/nhl-proxy.js` to safely attempt `new ObjectId(id)` within `try/catch` guards. Eliminates 500 server crashes for string or UUID draft IDs.
* **Exact Undraft Logic**: Replaced MongoDB `$pull` with array splice manipulation in `PATCH /drafts/:id/undraft`. Undrafting now targets the exact last pick at the specified manager index without purging duplicate players.
* **In-Memory Fallback & Auto-Seeding**: Added `mongodb-memory-server` fallback and an automated roster seeder. If local MongoDB is unreachable, the backend boots an in-memory database and populates 850+ NHL players automatically.
* **Washington Capitals (`WSH`) Inclusion**: Corrected `NHL_TEAM_ABBRS` across all files to include all 32 NHL teams (fixing missing Washington Capitals players).

### 2. NHL Stats Proxy & Modal Enhancements
* **Hits & Blocks Data Merge**: Updated `GET /stats/:playerId` to fetch `/skater/summary` and `/skater/realtime` concurrently using `Promise.all` and join metrics by `seasonId`. Fixed "NO DATA" for Hits and Blocks.
* **Time on Ice (ToI) Formatting**: Normalized raw seconds into clean `MM:SS` minute-second strings.
* **Goalie Metric Mapping**: Properly mapped `savePct` / `savePctg`, `wins`, `saves`, and `shutouts`.

### 3. Frontend & UI/UX Upgrade
* **Sticky Glass Navbar**: Replaced fixed top-right overlay controls with a sticky, blurred glass navigation bar (`backdrop-filter: blur(16px)`).
* **Position Badges & Typography**: Added vibrant HSL gradient styling for position badges (`C`, `D`, `G`, `LW`, `RW`, `POOP`) and integrated Google's *Outfit* and *Plus Jakarta Sans* typography.
* **On-Demand Results Download**: Removed automatic pop-up downloads on completion (which were blocked by browser pop-up blockers) and added a dedicated `Download Draft` button in the navbar.
* **Auto-Draft Loop Resolution**: Fixed dependency arrays and flags in `App.tsx` so auto-drafting Kyle Wellwood at -30s triggers once without infinite loops.

---

## 🗄️ Database Schema Reference

### `players` Collection
```json
{
  "_id": "66f07e5b...",
  "id": 8478402,
  "firstName": { "default": "Connor" },
  "lastName": { "default": "McDavid" },
  "team": "EDM",
  "position": "forwards",
  "positionCode": "C",
  "sweaterNumber": 97,
  "headshot": "https://assets.nhle.com/mugs/nhl/20242025/EDM/8478402.png",
  "heightInInches": 73,
  "weightInPounds": 193
}
```

### `drafts` Collection
```json
{
  "_id": "66f07f1a...",
  "name": "2024 League Draft",
  "completed": false,
  "started": "2026-09-22T17:20:19.000Z",
  "managers": [
    {
      "name": "Ice Titans",
      "position": 1,
      "players": [
        {
          "id": 8478402,
          "firstName": { "default": "Connor" },
          "lastName": { "default": "McDavid" },
          "positionCode": "C",
          "team": "EDM"
        }
      ]
    }
  ]
}
```

---

## 🚀 Deployment Environment Variables

### Backend (Render)
* **Start Command**: `node nhl-proxy.js`
* **Environment Variables**:
  * `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/koopa?retryWrites=true&w=majority`
  * `PORT`: `4000`

### Frontend (Vercel)
* **Framework**: Create React App
* **Build Command**: `npm run build`
* **Output Directory**: `build`
* **Environment Variables**:
  * `REACT_APP_API_URL`: `https://<your-render-backend-service>.onrender.com`

---

## 💻 Local Development Commands

### Start Backend API Server
```bash
cd backend
npm install
node nhl-proxy.js
```

### Start Frontend React App
```bash
cd draft-board
npm install
npm start
```

### Run Unit Tests & Production Build
```bash
cd draft-board
npm test -- --watchAll=false
npm run build
```

---

*KoopaV2 is maintained and updated for modern fantasy hockey draft management.* 🏒🏆