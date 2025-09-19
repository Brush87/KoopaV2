Deployment guide — KoopaV2
=========================

This document outlines a minimal, pragmatic deployment flow: MongoDB Atlas for DB, Render for the backend Node service, and Vercel for the frontend static site. It includes env vars and commands used in this repo.

1) Prepare environment
- Ensure the repo is on GitHub and accessible by Render/Vercel.

2) MongoDB Atlas
- Create a free Atlas cluster and a database user.
- Create a database name (e.g., `koopa`).
- Obtain the connection string (use the SRV string):
  - Example: mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/koopa?retryWrites=true&w=majority
- Note the full connection string for `MONGO_URI`.

3) Backend (Render recommended)
- Create a new Web Service on Render and connect to the GitHub repo.
- Select the `backend` folder as the service root.
- Set the start command: `node nhl-proxy.js` (or configure in package.json scripts).
- Environment variables:
  - MONGO_URI = <your Atlas URI>
  - PORT = 4000 (optional; Render provides one if omitted)
- Node version: ensure Node 18+ (set engines in package.json or choose on Render).
- Deploy and watch logs. The server logs: "Connected to MongoDB" and "NHL Proxy server running on http://..." when ready.

4) Frontend (Vercel recommended)
- Create a new Vercel project and connect the `draft-board` directory.
- Framework: Create React App
- Build command: `npm run build`
- Output directory: `build`
- Environment variables:
  - REACT_APP_API_URL = https://<your-backend-url>
- Deploy. Vercel serves the site on a CDN and provides a URL.

5) Seed data (optional)
- From local or any machine with network access to Atlas, run:
  - cd backend
  - MONGO_URI="<your-atlas-uri>" npm run seed:one-away

6) Smoke test
- Visit the frontend URL, open "Available Drafts", continue into the seeded draft, perform the final pick and confirm the results text file downloads.

7) Notes & production checklist
- Lock down CORS on backend to allow only your frontend origin (optional).
- Add monitoring/alerting: Render logs, Vercel analytics, Atlas backups.
- Consider using GitHub Actions for pre-deploy checks.

If you'd like, I can add a GitHub Actions skeleton for building the frontend and running lint checks before deploy, or I can implement a tiny `Makefile` with common commands.
