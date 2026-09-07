# MIUCC 2026 CHAMPIONS CUP — FULL-STACK TOURNAMENT MANAGEMENT PLATFORM

> **BEYOND BORDERS, UNITED BY FOOTBALL.**  
> Official University Football Tournament Management System for **Marwadi Inter-University Champions Cup 2026**, hosted at **Marwadi University Campus** (26 September – 10 October 2026).

---

## 🏆 Highlights & Key Features

- **Approved Visual Design**: Pixel-perfect implementation of the approved **Google Stitch UI** design using Black (`#0f1115`), Gold/Yellow (`#facc15`), and White with Montserrat & Inter typography.
- **Official MIUCC Logo**: Cleaned transparent WebP/PNG logo assets embedded across headers, footers, player cards, QR verification badges, and login screens.
- **Single Admin System**: Authenticated single administrator dashboard (`admin@miucc2026.org` / `AdminPassword2026!`). No public user accounts or public registration.
- **Public Team Registration**: Public teams can register and receive a unique reference code (`MIUCC-TEAM-0001`) with a live status tracker (`Submitted`, `Under Review`, `Approved`, `Changes Required`, `Rejected`).
- **Player Approval & QR Verification**: Admin reviews player submissions. Upon approval, system securely generates a unique Player ID (`MIUCC-PLY-0001`), verified player card, and QR code pointing to public verification page (`/player/MIUCC-PLY-0001`).
- **Data Privacy**: Strictly omits student IDs, date of birth, emergency contacts, and personal email addresses from public APIs and public verification pages.
- **Match Days & Live Result Engine**: Admin logs live goals, cards, POTM awards, and executes **Confirm Result** which automatically calculates group standings (Points -> GD -> GF), team statistics, and player statistics.
- **Tournament Draw & Knockout Bracket**: Supports Random, Seeded, or Manual draws with audit logging and draw locking before populating Quarter-Finals, Semi-Finals, Third Place, and Grand Final matches.
- **Public Predict & Win (Atomic 20-Entry Limit)**: Public visitors make match day predictions without login. Enforces a strict server-side transaction lock of **maximum 20 entries per Match Day** and single-email rule. Automatically closes prediction form (`🔒 PREDICTIONS CLOSED`) when limit is reached.
- **Data Backup & CSV Export**: Admin can export complete CSV spreadsheets for Teams, Players, Predictions, Matches, and Statistics.

---

## 🛠️ Collaborator & Developer Guides

- 📘 **[Developer Notes & Onboarding Guide](DEVELOPER_NOTES.md)**: Comprehensive guide for co-developers to understand folder structures, local execution, environment setup, database re-seeding, and adding new endpoints.
- 🤝 **[Contributing Guidelines](CONTRIBUTING.md)**: Git branching strategy, commit message standards, and PR workflows.
- 📚 **System Architecture**: Detailed docs in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATABASE.md`](docs/DATABASE.md), and [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md).

---

## 🚀 Quick Start & Development Setup

### 1. Prerequisites
- Node.js v18+
- npm v9+

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/ElimuKiazolu/FootballWebApp.git
cd FootballWebApp

# Install dependencies in all three locations.
# The root install only pulls `concurrently` — it is NOT sufficient on its own.
npm install
npm --prefix backend install
npm --prefix frontend install

# Copy the environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Process official logo assets
npm run process-logo
```

### 3. Run Development Server
```bash
npm run dev
```
- **Public Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Single Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### 4. Admin Credentials
- **Email**: ``
- **Password**: ``

---

## 🧪 Running Automated Tests
```bash
npm test
```
ExecutesVitest test suite validating prediction limit locks, duplicate email rejection, player ID sequence, and standings calculations.

---

## 📦 Production Build
```bash
npm run build
```
Compiles TypeScript and bundles Vite production assets to `dist/`.

---

## 📁 Project Architecture
```text
MULSU_ICC/
├── .env.example             # Template for local environment variables
├── DEVELOPER_NOTES.md       # Full developer handbook & local setup instructions
├── CONTRIBUTING.md          # Git workflow & collaboration guide
├── backend/                 # Node.js + Express + TypeScript Backend
│   ├── local.db             # Local libSQL database file (gitignored)
│   ├── server/              # Server entry point & API router
│   │   ├── db.ts            # libSQL client, async query wrapper & one-time seed
│   │   ├── schema.sql       # Database master schema
│   │   └── routes/          # Modular RESTful API endpoints
│   └── tests/               # Vitest automated test suite
├── frontend/                # React 18 + Vite + Tailwind CSS Frontend
│   ├── index.html           # HTML entry point with Montserrat & Inter fonts
│   └── src/
│       ├── components/      # Stitch UI layout & reusable components
│       ├── lib/api.ts       # Centralized API service layer
│       └── pages/           # Public & Admin dashboard pages
├── docs/                    # Architectural & admin manuals
├── scripts/                 # Asset processing & logo tools
└── ui-design/               # Source-of-truth Google Stitch design export
```
