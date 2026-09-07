# Contributing to MULSU_ICC / MIUCC 2026 Champions Cup

Thank you for contributing to the official **Marwadi Inter-University Champions Cup 2026** platform! This document outlines our development workflow and code standards.

---

## 🚀 Quick Setup for Developers

Before starting work, please read the complete [Developer Notes](DEVELOPER_NOTES.md).

```bash
# 1. Clone repository
git clone https://github.com/ElimuKiazolu/FootballWebApp.git
cd FootballWebApp

# 2. Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Start local development server
npm run dev
```

---

## 🌿 Git Branching Strategy

- **`main`**: Production-ready code. Direct pushes to `main` should be reserved for approved fixes.
- **`feature/<short-name>`**: New feature development (e.g., `feature/live-ticker`, `feature/pdf-export`).
- **`fix/<bug-name>`**: Bug fixes (e.g., `fix/qr-code-canvas`, `fix/standings-sort`).

---

## 📝 Commit Message Conventions

We follow clean commit message standards:

- `feat: add player search and filtering on public directory`
- `fix: correct goal difference calculation when goals against is zero`
- `docs: update developer notes with API route creation guide`
- `refactor: clean up admin dashboard tab rendering`
- `test: add unit test for atomic prediction lock`

---

## 🧪 Testing Guidelines

Always run automated tests before creating a pull request:

```bash
# Run backend vitest suite
npm test

# Test production build compilation
npm run build
```

---

## 🎨 Code Style & Design Rules

1. **TypeScript**: Use explicit types wherever possible. Avoid `any` unless working with legacy third-party objects.
2. **UI Palette**: Stick strictly to Google Stitch tokens:
   - Primary Accent: Gold (`#facc15` / `yellow-400`)
   - Surface / Dark Background: Charcoal (`#0f1115` / `#181b20`)
   - Font Families: `font-montserrat` for headings, `font-sans` (Inter) for body.
3. **Security & Privacy**: Never output athlete personal identifiers (DOB, Student ID, emergency phone) in public API endpoints or UI components.

---

## 📬 Submitting a Pull Request (PR)

1. Ensure your branch is up to date with `main`: `git rebase main`
2. Push your feature branch: `git push origin feature/your-feature`
3. Create a Pull Request on GitHub with a description of changes and visual screenshots if UI was modified.
4. Request review from your co-developer.
