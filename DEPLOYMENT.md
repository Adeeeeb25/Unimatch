# UniMatch — Deployment Guide

This guide details how to deploy UniMatch live on the internet using free cloud hosting platforms.

---

## Architecture Overview

- **Frontend:** React 19 + Vite SPA (Client-side routing via React Router)
- **Backend:** Node.js + Express REST API with JWT authentication
- **Database:** PostgreSQL (with automatic schema creation on startup)

---

## Option 1: 1-Click Blueprint on Render (Recommended — Free Tier)

Render can automatically provision the **PostgreSQL database**, **Backend API**, and **Frontend Static Site** in a single flow using the included `render.yaml` blueprint.

### Steps:
1. Go to **[dashboard.render.com](https://dashboard.render.com)** and sign in (using GitHub).
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your repository: `Adeeeeb25/Unimatch`.
4. Render will read `render.yaml` and display the 3 resources to create:
   - **`unimatch-db`** (Managed PostgreSQL Database)
   - **`unimatch-api`** (Node.js Backend Web Service)
   - **`unimatch-web`** (React Static Site Frontend)
5. Click **Apply**.
6. Render will automatically:
   - Provision your PostgreSQL database.
   - Inject the database URL into the backend.
   - Build and start the backend service.
   - Build the frontend with the backend URL linked.
7. Once finished, open the URL provided by `unimatch-web` (e.g., `https://unimatch-web.onrender.com`).

---

## Option 2: Vercel (Frontend) + Render / Railway (Backend & Database)

If you prefer hosting the frontend on Vercel and the backend on Render or Railway:

### Step A: Deploy Backend on Render or Railway
1. **Database:**
   - On Render: Create a new **PostgreSQL** database (name: `unimatch`). Copy the **Internal Database URL** (or External URL).
   - Alternatively, create a free database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. **Backend Web Service:**
   - In Render or Railway, create a new **Web Service** connecting `Adeeeeb25/Unimatch`.
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `JWT_SECRET`: Any secure random 32+ character string.
     - `ADMIN_JWT_SECRET`: Any secure random 32+ character string.
     - `ADMIN_ID`: `admin`
     - `ADMIN_PASSWORD_HASH`: A bcrypt hash for your admin password.
     - `CORS_ORIGIN`: `*` (or your Vercel frontend URL once deployed).
3. Note your backend URL (e.g. `https://unimatch-api.onrender.com`).

### Step B: Deploy Frontend on Vercel
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import `Adeeeeb25/Unimatch`.
4. Configure Project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Environment Variables:**
     - `VITE_API_URL`: Your backend URL from Step A (e.g., `https://unimatch-api.onrender.com`).
     - `VITE_GOOGLE_MAPS_KEY`: *(Optional)* Your Google Maps API key for campus cafe locations.
5. Click **Deploy**.
6. Thanks to `vercel.json`, all client-side routes (`/students`, `/messages`, `/profile`) will resolve seamlessly without 404 errors.

---

## Option 3: Single-Container Unified Deployment (Render / Railway / Fly.io)

UniMatch's Express server is configured to serve the production Vite frontend bundle (`dist/`) directly when both are built together.

- **Build Command:** `npm install && npm run build && cd backend && npm install`
- **Start Command:** `node backend/src/server.js`
- **Port:** Configured by host (`PORT` environment variable).
- **Environment Variables:**
  - `DATABASE_URL`: PostgreSQL connection string.
  - `JWT_SECRET`: Random 32+ character string.
  - `NODE_ENV`: `production`

---

## Verifying the Live Deployment

1. Visit your live frontend URL.
2. Test user signup with any institutional email (e.g. `alex@cuchd.in`).
3. Complete the onboarding wizard (profile photo, major, year, interests).
4. Verify directory browsing, search filters, and messaging.
5. Access `/admin/login` using the configured administrator credentials.
