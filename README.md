# UniMatch — Campus Student Collaboration & Directory Platform

UniMatch is a full-stack campus collaboration platform connecting university students for academic partnerships, group projects, and study spaces based on department, coursework, and shared interests.

---

## Architecture & Technology Stack

- **Frontend**: React 19, Vite, React Router, CSS Modules
- **Backend**: Node.js (ES Modules), Express
- **Database**: PostgreSQL with connection pooling (`pg`)
- **Security & Cryptography**:
  - `bcrypt` with work factor 12 for password hashing
  - Signed JSON Web Tokens (JWT) for student and administrator authorization
  - Rate limiting on authentication and support endpoints via `express-rate-limit`
  - Constant-time password verification preventing timing analysis attacks
  - Strict payload size limits (100kb) and CORS origin filtering

---

## Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # PostgreSQL pool and schema migrations
│   │   ├── middleware/
│   │   │   └── authMiddleware.js      # JWT verification & role validation
│   │   ├── features/
│   │   │   ├── admin/                 # Admin authentication and dashboard routes
│   │   │   ├── auth/                  # Student registration & login
│   │   │   ├── domains/               # Custom campus domain DNS verification
│   │   │   ├── messages/              # Persistent direct messaging
│   │   │   ├── support/               # Student & institutional support requests
│   │   │   └── user/                  # User profiles and matching algorithm
│   │   └── server.js                  # Express app, middleware, and lifecycle
│   ├── .env.example
│   └── package.json
├── src/
│   ├── components/                    # Core UI component library
│   ├── features/
│   │   ├── about/                     # About UniMatch
│   │   ├── admin/                     # Admin console (Metrics, Users, Domains, Support)
│   │   ├── auth/                      # Student sign in & registration
│   │   ├── cafe/                      # Campus Study Spots & Google Maps locator
│   │   ├── home/                      # Directory search and discovery
│   │   ├── matches/                   # Direct messaging interface
│   │   └── support/                   # Campus support & domain inquiries
│   ├── App.jsx                        # App shell and routing
│   └── main.jsx                       # React 19 entrypoint
├── .env.example
├── package.json
└── vite.config.js
```

---

## Quick Start & Setup

### Prerequisites

- Node.js 18+ (tested with Node.js 20+)
- PostgreSQL 14+ running locally or remotely

### 1. Database Configuration

Create a database named `UniMatch` (or your preferred name) in PostgreSQL:

```sql
CREATE DATABASE "UniMatch";
```

The database tables (`unimatch_users`, `unimatch_messages`, `unimatch_campus_domains`, and `unimatch_support_requests`) are automatically created on backend startup without dropping or overwriting existing data.

### 2. Backend Environment Setup

Create `backend/.env` (refer to `backend/.env.example`):

```bash
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/UniMatch
PORT=5001
JWT_SECRET=your_student_jwt_secret
ADMIN_ID=uni-admin
ADMIN_PASSWORD_HASH=$2b$12$gjAZir.Yh6HeTvHucPFd3O8Y6GwAbrxBRB4SvRobbSHjUuBRGT4LG
ALLOWED_EMAIL_DOMAINS=connect.cuchd.in,cuchd.in
CORS_ORIGIN=http://localhost:5173
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

> **Initial Admin Credentials**: The pre-configured bcrypt hash corresponds to password `AdminPass123!`. Change this in production.

Install backend dependencies and start the server:

```bash
cd backend
npm install
npm run dev
```

The backend starts on port 5001 and provides a health check at:
`http://localhost:5001/api/health`

### 3. Frontend Setup

Create `.env` in the root project folder (refer to `.env.example`):

```bash
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

Install frontend dependencies and start Vite dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Key Features & Security Implementation

### 1. Campus Email Registration Enforcement

- Registration (`/api/auth/signup`) verifies that student email addresses belong to allowed campus domains defined in `ALLOWED_EMAIL_DOMAINS`.
- If `ALLOWED_EMAIL_DOMAINS` is not defined or empty, open registration is allowed (development mode).

### 2. Role-Based Administration & Hardened Auth

- Admin endpoints (`/api/admin/*`, `/api/domains/*`, `/api/support` GET/PATCH, `/api/users/admin/*`) require cryptographically signed JWTs with `role: admin`.
- Admin user creation bypasses campus domain restrictions, enabling administrative provisioning.
- Rate limiting prevents brute force attacks:
  - `/api/auth/*` & `/api/admin/*`: 20 attempts per 15 minutes
  - `/api/support`: 10 requests per 15 minutes

### 3. Custom Institutional Domains & DNS Challenge

Universities can link custom campus subdomains (e.g. `connect.cuchd.in`):

1. The administrator registers the domain in the Admin Console.
2. A unique crypto random token (e.g. `unimatch-verify=...`) is generated.
3. Campus IT adds the following DNS records:
   - **TXT**: `_unimatch-verify` with the challenge token
   - **CNAME**: Subdomain mapped to UniMatch ingress
4. The administrator validates the record to activate the domain.

### 4. Campus Study Spots & Google Maps

- Interactive study spot locator located at `/cafes`.
- If `VITE_GOOGLE_MAPS_KEY` is configured in `.env`, Google Maps JavaScript API is initialized with markers for all study spots and automated centering.
- If the key is not set, a graceful configuration notice is shown while allowing users to browse spaces, view amenities, and copy details.

### 5. Persistent Direct Messaging

- Direct messages between matched students are persisted to PostgreSQL (`unimatch_messages`).
- Optimistic updates with send-burst polling suppression ensure seamless chat responsiveness without lost messages or flicker.

---

## Production Build

To build the client application bundle:

```bash
npm run build
```

The compiled assets are output to `dist/`.
