# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Warning: Next.js 16 Breaking Changes

This project uses Next.js 16.2.6. APIs, conventions, and file structure may differ from older versions. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

> **Important**: `npm run dev` must be run manually by the developer. Claude must never execute it.

```bash
npm install
# npm run dev     ← run manually; starts dev server on http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (core-web-vitals + TypeScript rules)
```

## Stack

- **Next.js 16.2.6** — App Router (server-first, file-based routing in `app/`)
- **React 19**
- **TypeScript 5** — strict mode enabled
- **Tailwind CSS 4** — via `@tailwindcss/postcss` plugin (no `tailwind.config.js`)
- **shadcn/ui** — component library (`components/ui/` — never hand-edit these files)
- **TanStack Query v5** — server state / data fetching
- **TanStack Table** — all data tables (via `DataTable` wrapper in `components/shared/`)
- **Axios** — HTTP client (singleton with JWT interceptor at `services/api.ts`)
- **Zustand v5** — client/UI state (auth store, UI store)
- **React Hook Form + Zod** — forms and validation (used with shadcn Form components)
- **sonner** — toast notifications

## Architecture

### Routing

App Router: all routes live under `app/`. Each route segment is a directory with `page.tsx`. Layouts in `layout.tsx` wrap child segments.

### Styling

Tailwind CSS 4 is imported via `@import "tailwindcss"` in `app/globals.css`. Design tokens go in a `@theme` block in that file using CSS custom properties — no `tailwind.config.js`.

### Path Alias

`@/*` resolves to the project root. Use `@/app/...`, `@/components/...`, etc.

### Route Structure

```
app/
  (auth)/         # Public pages — no sidebar, centered layout
    login/
    register/
  (dashboard)/    # Protected pages — AuthGuard + AppShell (sidebar + topbar)
    {module}/     # List, new, [id], [id]/edit per module
```

### State Architecture

| Layer | Tool | Location |
|-------|------|----------|
| Server state (API data) | TanStack Query | `hooks/{module}/` |
| Auth state | Zustand `useAuthStore` | `stores/auth.store.ts` |
| UI state (modals, transient) | Zustand `useUIStore` | `stores/ui.store.ts` |
| Filter/pagination state | URL (`useSearchParams`) | pages |

**Never use Context API for shared state.** Zustand only.

### Data Flow (SOLID)

```
Page → Component → Hook → Service → api.ts (Axios)
```

Each layer has one responsibility. Pages don't call services. Components don't call services.

### Coding Rules

- All pages under `(dashboard)/` are `"use client"` (TanStack Query requires client components)
- Decimal fields are `string` in TypeScript — never `parseFloat` before sending to API
- Filter/pagination lives in URL params (`?page=`, `?search=`, `?ordering=`, etc.)
- Zod for decimal: `z.string().regex(/^\d+(\.\d+)?$/)`
- Mutations: always `invalidateQueries` on success + `toast.success`. Always `toast.error` on failure.
- Extract API field errors from `error.response?.data?.error?.details` → `form.setError`
- `proxy.ts` at root (NOT `middleware.ts`) — Next.js 16 renamed it. Export function named `proxy`.

### Infrastructure Files (Pre-built — Do Not Recreate)

These are shared across all modules. Implement agent extends, never recreates:

| File | Purpose |
|------|---------|
| `services/api.ts` | Axios singleton + JWT interceptor (concurrent 401 queue) |
| `services/auth.ts` | Plain axios calls for login/register/refresh |
| `stores/auth.store.ts` | Zustand: accessToken (memory), user, initFromStorage |
| `stores/ui.store.ts` | Zustand: modal open/close state |
| `providers/QueryProvider.tsx` | QueryClientProvider wrapper |
| `lib/query-client.ts` | QueryClient factory (staleTime=2min, retry=1) |
| `lib/query-keys.ts` | Centralized key factories — ONLY APPEND, never remove |
| `lib/utils.ts` | `cn()` helper for Tailwind class merging |
| `types/api.ts` | `PaginatedResponse<T>`, `ApiError` |
| `components/shared/DataTable.tsx` | TanStack Table wrapper |
| `components/shared/PageHeader.tsx` | Title + action button |
| `components/shared/ConfirmDialog.tsx` | Delete confirmation modal |
| `components/shared/StatusBadge.tsx` | Colored badge for status/type fields |
| `components/shared/LoadingSpinner.tsx` | Spinner |
| `components/layout/AppShell.tsx` | Sidebar + Topbar + main |
| `components/layout/Sidebar.tsx` | Nav links per module |
| `components/layout/Topbar.tsx` | User info + sign out |
| `proxy.ts` | Route guard (checks `is_logged_in` cookie) |

### Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### shadcn Setup (run once manually)

```bash
npx shadcn@latest init
# style=Default, color=Neutral, CSS vars=Yes, alias=@/components/ui

npx shadcn@latest add button input label form select badge card table dialog sheet dropdown-menu avatar separator skeleton sonner
```

shadcn writes CSS vars into `globals.css`. Do not duplicate `@import "tailwindcss"`.

### Dev Tools Install (already done)

```bash
npm install -D @tanstack/react-query-devtools
```

---

## Backend API

**Backend:** Django 6 + DRF + SimpleJWT  
**Base URL:** `http://localhost:8000/api/`  
**Full API docs:** `docs/api-overview.md`

### Módulos (9 total)

| Módulo | Path | Doc |
|--------|------|-----|
| Auth | `/api/auth/` | `docs/modules/auth.md` |
| Customers | `/api/customers/` | `docs/modules/customers.md` |
| Suppliers | `/api/suppliers/` | `docs/modules/suppliers.md` |
| Warehouses | `/api/warehouses/` | `docs/modules/warehouses.md` |
| Products | `/api/products/` | `docs/modules/products.md` |
| Drivers | `/api/drivers/` | `docs/modules/drivers.md` |
| Transport | `/api/transport/` | `docs/modules/transport.md` |
| Routes | `/api/routes/` | `docs/modules/routes.md` |
| Shipments | `/api/shipments/` | `docs/modules/shipments.md` |

### Puntos clave

- **Auth:** JWT con access token (1h) + refresh token (7d). Header: `Authorization: Bearer <token>`
- **Paginación:** Todos los listados retornan `{ count, next, previous, results[] }` — 20 ítems/página
- **Errores:** Siempre `{ error: { code, message, details } }`
- **Decimales:** Se representan como strings en JSON (`"1299.99"`, `"15.500"`)
- **Shipment** es la entidad central; orquesta customers, products, transport y routes
- **Shipment workflow:** `pending` → `picked_up` → `delivered` | `cancelled`
- **Drivers:** Crear un driver crea automáticamente un usuario Django; eliminar driver elimina el usuario

---

## SDD Workflow (Spec-Driven Development)

All module development follows a strict cycle via 4 custom agents in `.claude/agents/`.

### Entry Point

Invoke the **orchester** agent to start or continue module work:

```
# Start next module (auto-detects from docs/mvp.md)
Use agent: orchester

# After reviewing the spec and approving it:
Say: "approve {module_name}"
```

### Cycle

```
orchester → spec agent → [HUMAN REVIEWS & APPROVES] → implement agent → validator agent → orchester updates mvp.md
```

### Agent Responsibilities

| Agent | File | Role |
|-------|------|------|
| orchester | `.claude/agents/orchester.md` | Coordinates cycle, reads/updates `docs/mvp.md` |
| spec | `.claude/agents/spec.md` | Produces `docs/specs/{module}-spec.md` (human must approve) |
| implement | `.claude/agents/implement.md` | Builds all module code from approved spec |
| validator | `.claude/agents/validator.md` | Marks spec tasks ✅/❌, never edits source code |

### Module Order (dependency-driven)

See `docs/mvp.md` for current status and full descriptions.

| # | Module | Depends on |
|---|--------|-----------|
| 1 | auth | — |
| 2 | warehouses | auth |
| 3 | suppliers | auth |
| 4 | customers | auth |
| 5 | products | warehouses, suppliers |
| 6 | drivers | auth |
| 7 | transport | drivers |
| 8 | routes | warehouses |
| 9 | shipments | customers, products, transport, routes |

### Spec Files

Location: `docs/specs/{module}-spec.md`

Spec files are the contract between agents. Structure: Types → Service → Query Keys → Hooks → Pages → Components → Edge Cases. Each item is a checkbox. Validator marks `[x] ✅` or `[x] ❌ reason (file:line)`.

**Never edit spec files outside the SDD workflow.**
