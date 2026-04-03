# Spark Lead Hub — LeadFlow CRM

## Overview

Production-grade closed-circuit CRM system built as a pnpm monorepo. Features a dark cyberpunk/neon theme with full-stack TypeScript.

## Key Features

- **JWT auth** with whitelist gating, 15-min idle timeout + warning modal
- **4-stage Kanban pipeline** (DB-driven stages, drag-and-drop)
- **Lead management** with new lead form, service on-the-fly creation
- **Analytics** — closure performance trend chart (7d/30d), pipeline funnel, win-rate widgets
- **Team management** — invite flow with email/copy-link, role assignment, RBAC
- **Profile management** — display name edit, avatar upload (canvas-resized, base64 JPEG), clickable sidebar user section
- **Master data** — companies, services, pipeline stage configuration
- **Admin** — granular permissions, full audit trail
- **Set-password flow** — collects display name + password on first activation

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
- **Email**: Nodemailer (SMTP, non-blocking); when SMTP not configured, set-password URLs are returned in API responses and shown in admin UI copy-link dialog

## Design System (index.css)

Custom CSS design tokens — NOT relying on shadcn defaults for layout:
- `--teal` / `--teal-dim` / `--teal-glow` — primary brand color
- `--purple` / `--purple-dim` — accent
- `--bg-base`, `--bg-elevated`, `--bg-overlay`, `--bg-subtle`, `--bg-muted` — background hierarchy
- `--text-primary`, `--text-secondary`, `--text-muted` — text hierarchy
- Utility classes: `.page`, `.page-header`, `.page-title`, `.stat-card`, `.chart-card`, `.badge-*`, `.nav-item.active`, `.kanban-column`, `.kanban-card`, `.sheet-tab`, `.data-table`, `.table-toolbar`, `.btn`, `.btn-primary`, `.btn-secondary`

## Features

1. **Dashboard** — Stats, area/bar charts, leads table with dynamic pipeline stage badges; lead company shown as subtitle under lead name
2. **Kanban Board** — Dynamic pipeline columns from DB-driven stages (usePipelineStages hook), status badges on cards; lead company shown under lead name
3. **Lead Detail Sheet** — 3 tabs: Details, Notes, Timeline; Pipeline progress bar, StageStatusSelect, Lead Company editable field
4. **Analytics** — Win rate, conversion trends, weekly charts, kill reasons, closure breakdown pie chart
5. **Team Management** — Invite users, set roles, approve/reject access requests
6. **Permissions** — Granular RBAC per resource/action per role
7. **Audit Log** — Full system audit trail with actor names
8. **Companies** — Company CRUD with industry/notes
9. **Services** — Service catalog with company associations
10. **New Lead Form** — Multi-field lead creation with pipeline stage/status selectors, service/company linking
11. **Pipeline Master** — Admin CRUD for pipeline stages and statuses at /master/pipeline

## Pipeline System

Dynamic 4-stage pipeline replacing the old hardcoded discovery/qualification/strategy/resolution enum:

- **DB Tables**: `pipeline_stages` + `pipeline_statuses` (seeded with 4 stages: Lead Initiation, Qualification & Analysis, Proposal & Negotiation, Closure; 9 statuses)
- **Backend Routes**: `GET/POST /api/pipeline/stages`, `PUT/DELETE /api/pipeline/stages/:id`, same for statuses
- **Lead fields**: `pipelineStageId`, `pipelineStatusId` FKs with join data (`stageName`, `stageColor`, `statusName`, `statusColor`, `statusIsWon`, `statusIsLost`)
- **Analytics**: `/api/analytics/closure-breakdown` returns per-status counts for Won/Lost statuses
- **Stage distribution**: `/api/analytics/stage-distribution` returns `stageName` + `stageColor` from pipeline tables
- **Frontend hooks**: `usePipelineStages()`, `useCreateStage()`, `useUpdateStage()`, `useDeleteStage()` etc. in `hooks/use-pipeline.ts`
- **Components**: `StageStatusSelect` (2-column stage+status dropdowns), `PipelineProgressBar` (animated stage track)

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
