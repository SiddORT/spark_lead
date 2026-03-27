# Spark Lead Hub — LeadFlow CRM

## Overview

Production-grade closed-circuit CRM system built as a pnpm monorepo. Features a dark cyberpunk/neon theme with full-stack TypeScript.

## Admin Credentials (Seeded)

- **Email**: admin@sparkleadhub.com
- **Password**: Admin@123!

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + custom CSS design system
  - Fonts: **Syne** (display/headings) + **DM Sans** (body)
  - Theme: dark cyberpunk, teal primary (`hsl(172 75% 48%)`), purple accent
  - Design system: semantic CSS variables + utility classes (stat-card, badge-*, nav-item, kanban-*, sheet-tab, data-table, etc.)
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL
- **Auth**: JWT (HS256) with whitelist-gating + 15-min inactivity timeout
- **API Layer**: OpenAPI spec → Orval codegen → React Query hooks (Zod schemas)
- **Database**: PostgreSQL (Drizzle Kit schema push)
- **Email**: Nodemailer (SMTP, non-blocking)

## Design System (index.css)

Custom CSS design tokens — NOT relying on shadcn defaults for layout:
- `--teal` / `--teal-dim` / `--teal-glow` — primary brand color
- `--purple` / `--purple-dim` — accent
- `--bg-base`, `--bg-elevated`, `--bg-overlay`, `--bg-subtle`, `--bg-muted` — background hierarchy
- `--text-primary`, `--text-secondary`, `--text-muted` — text hierarchy
- Utility classes: `.page`, `.page-header`, `.page-title`, `.stat-card`, `.chart-card`, `.badge-*`, `.nav-item.active`, `.kanban-column`, `.kanban-card`, `.sheet-tab`, `.data-table`, `.table-toolbar`, `.btn`, `.btn-primary`, `.btn-secondary`

## Features

1. **Dashboard** — Stats, area/bar charts, leads table with search/filter
2. **Kanban Board** — Drag-and-drop 4-stage pipeline (discovery → qualification → strategy → resolution)
3. **Lead Detail Sheet** — Full pipeline progression with stage locking, notes, activities
4. **Analytics** — Win rate, conversion trends, weekly charts, kill reasons
5. **Team Management** — Invite users, set roles, approve/reject access requests
6. **Permissions** — Granular RBAC per resource/action per role
7. **Audit Log** — Full system audit trail with actor names
8. **Companies** — Company CRUD with industry/notes
9. **Services** — Service catalog with company associations
10. **New Lead Form** — Multi-field lead creation with service/company linking

## Architecture

```
artifacts/
  api-server/        # Express 5 API (PORT=8080)
  spark-lead-hub/    # React+Vite frontend (PORT from env, proxies /api → :8080)
  mockup-sandbox/    # Component preview server

lib/
  db/                # Drizzle schema (13 tables, 9 enums) + DB connection
  api-spec/          # OpenAPI 3.1 spec + Orval codegen config
  api-client-react/  # Generated React Query hooks + custom-fetch
  api-zod/           # Generated Zod schemas

scripts/
  src/seed.ts        # Admin user + permissions + sample data seeder
```

## Database Schema

13 tables: users, whitelisted_users, user_roles, role_permissions, password_reset_tokens, access_requests, companies, services, company_services, leads, lead_companies, lead_notes, lead_activities, audit_log

9 enums: app_role, lead_stage, lead_type, lead_outcome, emotional_state, decision_role, strategic_tier, kill_reason, friction_point

## Key Files

- `artifacts/spark-lead-hub/src/App.tsx` — React Router (wouter) with ProtectedRoute
- `artifacts/spark-lead-hub/src/components/auth-provider.tsx` — AuthContext, ProtectedRoute, PermissionCheck
- `artifacts/spark-lead-hub/src/components/layout.tsx` — Collapsible sidebar + navigation
- `artifacts/spark-lead-hub/src/components/lead-detail-sheet.tsx` — Core lead detail panel
- `artifacts/spark-lead-hub/src/components/ui/index.tsx` — Custom UI component library
- `artifacts/spark-lead-hub/src/index.css` — Cyberpunk neon CSS variables + glassmorphism
- `artifacts/api-server/src/routes/` — All backend routes
- `artifacts/api-server/src/lib/auth.ts` — JWT + middleware
- `artifacts/api-server/src/lib/email.ts` — Nodemailer
- `lib/db/src/schema/schema.ts` — Complete Drizzle schema

## Running the Seed

```bash
pnpm --filter @workspace/scripts run seed
```

Optional env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## RBAC Roles

- **admin** — Full access to everything (always)
- **manager** — Leads CRUD, analytics, team view
- **lead_owner** — Own leads only (create, read, update, export)
- **deal_handler** — Assigned leads only (read, update)
- **member** — Read-only leads + analytics

## API Proxy

The Vite dev server proxies `/api/*` to `http://localhost:8080` (the Express API server).

## TypeScript

All packages use `composite: true`. Run typechecks from root: `pnpm run typecheck`
