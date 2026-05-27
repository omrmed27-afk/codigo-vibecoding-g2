# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This monorepo contains two related projects:

```
codigo-vibecoding-g2/
├── task-manager-backend/   # Node.js/Express REST API
└── task-manager-frontend/  # React/Vite SPA
```

---

## Backend (`task-manager-backend`)

**Stack**: Node.js · Express 4 · PostgreSQL (Neon) · Prisma 7 · bcryptjs · ES Modules

### Commands

> **Important**: `npm run dev` must always be run manually by the developer. Claude must never execute it.

```bash
cd task-manager-backend
npm install
# npm run dev            ← run this manually to start server on http://localhost:3000
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Sync schema without migrations (dev only)
```

### Environment Variables

Requires a `.env` file (see `.env.example`):
```
DATABASE_URL=postgresql://...   # Neon PostgreSQL connection string
JWT_SECRET=...                  # Used in custom token generation
PORT=3000                       # Optional, defaults to 3000
```

### Architecture

Entry point is `server.js` → `src/app.js` (Express setup, middleware, route mounting).

Each domain (`users`, `tasks`) follows a 4-layer pattern:
- `routes` → `controller` → `service` → `repository` (Prisma queries)

**Prisma client** is initialized in `src/lib/prisma.js` using `@prisma/adapter-pg` (connection pool via `pg`). The generated client lives in `src/generated/prisma/` (gitignored — run `db:generate` after cloning).

**Authentication** uses a custom token: SHA256 hash of `userId + email + JWT_SECRET`, not a standard JWT. There is no expiry or signature verification — the token is stored as-is and compared.

**OpenAPI docs** are served at `/api-docs` (swagger-ui-express).

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/register` | `{name, lastname, email, password}` → user object |
| POST | `/users/login` | `{email, password}` → `{token}` |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | `{title, description?, status?}` → task object |
| GET | `/tasks/:id` | Get one task |
| PUT | `/tasks/:id` | `{title?, description?, status?}` → updated task |
| DELETE | `/tasks/:id` | 204 No Content |

### Database Schema

```
User: id, name, lastname, email (unique), password, created_at
Task: id, title, description, status (default "pending"), created_at, userId (FK → User, nullable)
```

---

## Frontend (`task-manager-frontend`)

**Stack**: React 18 · Vite 6 · React Router 6 · Tailwind CSS 4 · Heroicons · Lucide

### Commands

> **Important**: `npm run dev` must always be run manually by the developer. Claude must never execute it.

```bash
cd task-manager-frontend
npm install
# npm run dev     ← run this manually to start dev server on http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

### Architecture

Entry: `index.html` → `src/main.jsx` → `RouterProvider` from `src/router/index.jsx`.

**Routes**:
- `/` → `TaskListPage` — main task management UI
- `/login` → `LoginPage` — form UI only (not connected to backend auth)
- `/tasks/:id` → `TaskDetailPage`

**Data flow**: Pages use custom hooks (`hooks/useTasks.js`, `hooks/useTask.js`) which call `services/taskService.js`. The service module is the only place that makes `fetch` calls.

**API base URL** is hardcoded in `taskService.js` as `http://localhost:3000`. There is no `.env` wiring on the frontend yet.

**Styling**: Tailwind CSS 4 with custom design tokens defined in `src/index.css` using CSS `@theme` variables (`--color-brand-*`, `--color-success-*`, `--color-danger-*`, font: Inter).

---

## How the Projects Connect

- Frontend calls the backend directly at `http://localhost:3000`
- Backend CORS allows all origins with GET/POST/PUT/DELETE methods
- No proxy is configured in Vite — requests go directly to the backend

### Known Gaps (future work areas)

- **Auth is not wired up**: `LoginPage` has no API call; tokens are never stored or sent
- **Tasks have no user association**: `userId` is nullable and the frontend never sets it
- **No environment config on frontend**: hardcoded localhost URL must be changed for deployment
- **No tests or linters** in either project

---

## Adding a New Feature

When implementing a feature that spans both projects:

1. **Backend first**: define the route → add controller/service/repository → update the Prisma schema if needed (`db:migrate` or `db:push`) → verify via `/api-docs`
2. **Frontend second**: add/update the call in `taskService.js` → update or create the hook → wire it into the page/component

Keep domain logic in the `service` layer (backend) and data-fetching in the `hooks` layer (frontend). Controllers and repositories should stay thin.
