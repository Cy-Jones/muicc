# 🛠️ DEVELOPER NOTES & COLLABORATION GUIDE
## MULSU_ICC / MIUCC 2026 Champions Cup — Full-Stack Tournament Management Platform

> **Welcome to the team!**  
> This document is designed specifically for co-developers and collaborators who have cloned this repository from GitHub. It contains everything you need to understand the architecture, run the application locally on your machine, navigate the codebase, make updates, and contribute effectively.

---

## 📌 1. Project Snapshot & Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript | SPA with React Router v6, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js + Express + TypeScript | RESTful API server with modular route handlers |
| **Database** | libSQL via `@libsql/client` | Turso in production; a local file (`local.db`) in development — same client, same code path |
| **Hosting** | Render | Static Site (frontend) + Web Service (backend) |
| **Auth** | JWT (JSON Web Tokens) + bcryptjs | Single-administrator authentication system |
| **Styling & UI** | Google Stitch Design Tokens | Custom theme palette (`#0f1115` Dark, `#facc15` Gold) |
| **Testing** | Vitest | Automated unit and integration test suite |

---

## 🚀 2. Local Setup & Execution Guide

Follow these step-by-step instructions to get the application running on your local machine.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured

---

### Step 1: Environment Variables Setup
Copy the example environment files for the root, backend, and frontend directories:

```bash
# In the project root directory
cp .env.example .env

# Create backend env file
cp backend/.env.example backend/.env

# Create frontend env file
cp frontend/.env.example frontend/.env
```

> **Note for Windows PowerShell**: If `cp` is not recognized, use `copy .env.example .env`.

Default local environment values inside `.env`:
```env
PORT=5000
NODE_ENV=development
TURSO_DATABASE_URL=file:./local.db
TURSO_AUTH_TOKEN=
ADMIN_EMAIL=admin@miucc2026.org
ADMIN_PASSWORD=AdminPassword2026!
JWT_SECRET=miucc_2026_champions_cup_secret_jwt_key_987654321
VITE_API_URL=http://localhost:5000
```

---

### Step 2: Install Dependencies
You can install dependencies across the entire project from the root folder:

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### Step 3: Process Logo Assets
Run the image utility script to process transparent WebP/PNG logo assets for headers, cards, and QR codes:

```bash
npm run process-logo
```

---

### Step 4: Launch Development Server
Start both the backend API server and frontend Vite server concurrently with one command:

```bash
npm run dev
```

This starts:
- **Frontend App**: `http://localhost:3000` (or `http://localhost:5173`)
- **Backend REST API**: `http://localhost:5000/api`
- **Backend Health Check**: `http://localhost:5000/api/health`

---

### Step 5: Admin Login Credentials
To access the Admin Management Panel, navigate to:  
👉 `http://localhost:3000/admin/login`

- **Email**: `admin@miucc2026.org` (or `admin@mulsu-icc2026.org`)
- **Password**: `AdminPassword2026!`

---

## 📁 3. Workspace Directory Map & Structure

Understanding where files live will help you make changes quickly and cleanly.

```text
MULSU_ICC/
├── .env                         # Root environment variables (local, gitignored)
├── .env.example                 # Example environment template
├── package.json                 # Root script runner (concurrently)
├── README.md                    # Public overview & system documentation
├── DEVELOPER_NOTES.md           # 👈 You are here! Collaborator guide
├── CONTRIBUTING.md              # Git workflow and pull request guidelines
│
├── backend/                     # Express Backend Application
│   ├── local.db                 # Local libSQL database file (gitignored)
│   ├── package.json             # Backend dependencies & scripts
│   ├── tsconfig.json            # Backend TypeScript configuration
│   ├── public/                  # Uploaded team logos, player photos, assets
│   ├── scripts/                 # Asset processing (process-logo.js, remove-bg)
│   ├── server/                  # Core Server Code
│   │   ├── index.ts             # Express app setup, CORS, static mounts, route setup
│   │   ├── db.ts                # libSQL client, async query wrapper & one-time seed
│   │   ├── schema.sql           # Database table DDL schema
│   │   ├── middleware/          # Auth middleware (JWT verification)
│   │   └── routes/              # REST API Route Handlers
│   │       ├── admin.ts         # Admin operations (CSV exports, system reset)
│   │       ├── auth.ts          # Admin login & JWT issue
│   │       ├── draw.ts          # Knockout draw & group generator
│   │       ├── matches.ts       # Fixtures, live events, score locking & standings recalculation
│   │       ├── players.ts       # Player applications, card & QR code generator
│   │       ├── predictions.ts   # Public predict & win (atomic 20-entry limit)
│   │       ├── standings.ts     # Public standings table reader
│   │       ├── teams.ts         # Team registrations & approval workflows
│   │       └── tournament.ts    # Global tournament configuration
│   └── tests/                   # Vitest unit & integration test suite
│
├── frontend/                    # React 18 + Vite Frontend SPA
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vite.config.ts           # Vite server & proxy settings
│   ├── tailwind.config.js       # Stitch Gold & Dark color theme tokens
│   ├── index.html               # Main HTML entry point with Google Fonts
│   └── src/
│       ├── main.tsx             # React DOM root render
│       ├── App.tsx              # React Router v6 route definitions
│       ├── styles/              # Global CSS & Tailwind utilities
│       ├── lib/
│       │   └── api.ts           # Centralized API service layer (fetch client)
│       ├── components/          # Reusable UI Components
│       │   ├── layout/          # Header, Footer, Admin Navigation
│       │   └── ui/              # Buttons, Cards, Badges, Modals
│       └── pages/               # Application Page Components
│           ├── HomePage.tsx               # Main tournament landing page
│           ├── TeamsPage.tsx              # Public team list & details
│           ├── TeamRegistrationPage.tsx   # Public team application form
│           ├── PlayersPage.tsx            # Public player directory & cards
│           ├── PlayerVerificationPage.tsx # Public QR verification page
│           ├── MatchesStandingsPage.tsx   # Group standings & fixtures
│           ├── DrawBracketPage.tsx        # Tournament draw & knockout tree
│           ├── PredictWinPage.tsx         # Public Predict & Win submission
│           ├── AdminLoginPage.tsx         # Admin login screen
│           └── admin/
│               └── AdminDashboard.tsx     # Comprehensive Admin Panel
│
├── docs/                        # Architectural & Schema Documentation
│   ├── ARCHITECTURE.md          # System architecture breakdown
│   ├── DATABASE.md              # Database schema & field reference
│   └── ADMIN_GUIDE.md           # Admin workflows manual
│
└── ui-design/                   # Design specifications & Stitch assets
```

---

## 🛠️ 4. Developer Workflows — How to Make Updates

### A. Adding a New API Endpoint (Backend -> Frontend)
If you need to add a new feature (e.g. adding a "Sponsor List" or custom feature):

1. **Update DB Schema** *(if new tables/columns are needed)*:
   - Edit [backend/server/schema.sql](backend/server/schema.sql).
   - Add default seed logic in `seedDatabase()` inside [backend/server/db.ts](backend/server/db.ts).

2. **Create Route Handler**:
   - Create a file in `backend/server/routes/myFeature.ts`.
   - Export an Express `Router()`.

```typescript
import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM my_table').all();
  res.json(items);
});

export default router;
```

3. **Mount Route in Express App**:
   - Import and register in [backend/server/index.ts](backend/server/index.ts):
```typescript
import myFeatureRoutes from './routes/myFeature.js';
app.use('/api/my-feature', myFeatureRoutes);
```

4. **Add Method to Frontend API Client**:
   - Open [frontend/src/lib/api.ts](frontend/src/lib/api.ts) and add a call function:
```typescript
export async function getMyFeatures() {
  const res = await fetch(`${API_URL}/api/my-feature`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

5. **Consume in React Page/Component**:
   - Call `getMyFeatures()` inside `useEffect` or state handler.

---

### B. Styling Guidelines (Stitch Theme)
The application adheres strictly to the approved **Google Stitch UI** design:
- **Background**: `#0f1115` (Deep Black / Charcoal)
- **Primary / Accent**: `#facc15` (Stitch Yellow / Gold)
- **Card Fill**: `#181b20` / `#1f232b`
- **Borders**: `border-yellow-500/20` or `border-zinc-800`
- **Typography**: Montserrat (Headings, uppercase, tracking-wider) & Inter (Body)

When writing Tailwind CSS classes, prefer:
```tsx
<div className="bg-[#181b20] border border-yellow-500/20 rounded-xl p-6 shadow-xl">
  <h2 className="font-montserrat font-bold text-yellow-400 tracking-wider text-xl uppercase">
    Card Header
  </h2>
</div>
```

---

### C. Resetting or Re-seeding the Database
If you make changes to `schema.sql` or want to clear local test data:

1. Stop the backend server.
2. Delete the `backend/local.db` file.
3. Restart the backend server (`npm run dev`).
4. The schema is reapplied and reference data is seeded once, on first initialization only.

> **Note:** seeding is deliberately one-time and additive. Restarting the backend never
> deletes or resets tournament data. A `seeded_at` marker in the `system_meta` table
> records that the initial seed has run. This is why deleting the database file is the
> only way to get a clean slate.

---

## 🧪 5. Testing & Verification

### Running Automated Tests
Run the Vitest backend test suite:

```bash
# From root directory
npm test

# Or inside backend directory
cd backend && npm test
```

The test suite validates:
- Predict & Win 20-entry limit enforcement & transaction locking.
- Duplicate email prediction rejection.
- Unique Player ID generation (`MIUCC-PLY-XXXX`).
- Team reference code format (`MIUCC-TEAM-XXXX`).
- Group standings math (Points = W*3 + D*1, GD = GF - GA).

---

## 🤝 6. Git Collaboration Guidelines

To work smoothly together without merge conflicts:

1. **Never commit `.env`, `local.db`, or your Turso auth token**:
   Both are gitignored. Always update `.env.example` if you add a new environment variable.

2. **Branching Model**:
   - Keep `main` stable.
   - Create feature branches for new work: `git checkout -b feature/your-feature-name` or `fix/bug-description`.

3. **Before Pushing to GitHub**:
   ```bash
   # 1. Run tests to ensure nothing broken
   npm test

   # 2. Test production build
   npm run build

   # 3. Commit and push
   git add .
   git commit -m "feat: add sponsor logo upload functionality"
   git push origin feature/your-feature-name
   ```

4. **Pull Requests**:
   Open a PR on GitHub and notify your co-developer before merging into `main`.

---

## ❓ 7. Troubleshooting & FAQ

| Problem | Cause | Solution |
|---|---|---|
| **Port 5000 already in use** | Another Node process is running on port 5000 | Kill process or change `PORT=5001` in `.env` and `VITE_API_URL=http://localhost:5001` in `frontend/.env` |
| **`local.db` locked or corrupt** | Concurrent writes or crash | Delete `backend/local.db` and restart `npm run dev` to rebuild |
| **Frontend cannot connect to Backend** | `VITE_API_URL` missing or wrong port | Ensure `frontend/.env` has `VITE_API_URL=http://localhost:5000` |
| **TypeScript compile errors in build** | Strict mode or missing types | Run `npm --prefix backend run build` and `npm --prefix frontend run build` to inspect exact lines |

---

## 📞 Need Help?
- Check the detailed architectural documentation in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Check the database design in [`docs/DATABASE.md`](docs/DATABASE.md).
- Contact your co-developer via Git issue or direct message.

*Happy Coding & Let's Build a Great Champions Cup Platform! ⚽🏆*
