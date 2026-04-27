# Spark Lead Hub — Authentication & Access Guide

**Version:** 1.0 | **Last updated:** April 2026
**Admin credentials:** `admin@sparkleadhub.com` / `Admin@123!`
**Token storage key:** `slh_token` (localStorage)
**API base:** `http://localhost:8080/api`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Login Page & Sign-In Flow](#2-login-page--sign-in-flow)
3. [Whitelist Gating](#3-whitelist-gating)
4. [JWT Tokens & Session Management](#4-jwt-tokens--session-management)
5. [Idle Timeout & Session Warning](#5-idle-timeout--session-warning)
6. [Roles & Permissions (RBAC)](#6-roles--permissions-rbac)
7. [Access Request Flow (Public)](#7-access-request-flow-public)
8. [Admin: Reviewing Access Requests](#8-admin-reviewing-access-requests)
9. [Admin: Direct Invite Flow](#9-admin-direct-invite-flow)
10. [Account Activation (Set Password)](#10-account-activation-set-password)
11. [Access Denied States](#11-access-denied-states)
12. [Profile Management](#12-profile-management)
13. [Email Notifications](#13-email-notifications)
14. [Multi-Tab Sync](#14-multi-tab-sync)
15. [API Endpoint Reference](#15-api-endpoint-reference)
16. [Environment Variables & Secrets](#16-environment-variables--secrets)
17. [Database Tables Involved](#17-database-tables-involved)
18. [Full Workflow Diagrams](#18-full-workflow-diagrams)

---

## 1. System Overview

Spark Lead Hub uses a **whitelist-gated JWT authentication** system. Every user must appear in the `whitelisted_users` table with `status = 'active'` before they can log in — even if they have a valid user record. This prevents unauthorised sign-ups and ensures every team member is explicitly added by an admin.

**Key components:**

| Layer | Technology |
|---|---|
| Frontend auth state | React context (`AuthProvider`) + `localStorage` |
| Token type | HS256 JWT (signed with `JWT_SECRET`) |
| Token lifetime | Configurable via `JWT_EXPIRES_IN` (default: **7 days**) |
| Idle auto-logout | **15 minutes** of inactivity |
| Password hashing | bcrypt (cost factor 12) |
| Role model | DB-driven RBAC (`role_permissions` table) |
| Email delivery | SMTP via Nodemailer (`SMTP_USER` / `SMTP_PASS`) |

---

## 2. Login Page & Sign-In Flow

### URL
`/auth` (or root `/` redirects here if unauthenticated)

### What the user sees
- **LeadFlow** logo with cyberpunk neon glow
- Email address field
- Password field with show/hide eye toggle
- **Sign In** button (neon teal, with animated spinner while loading)
- Error banner (red) for invalid credentials or deactivated accounts
- "Don't have access? **Request Access**" link at the bottom

### Step-by-step sign-in flow

```
1. User enters email + password → clicks Sign In
2. Frontend POSTs to POST /api/auth/login
3. Backend checks whitelisted_users table for the email
   a. Not found → 403 "Access Denied. You are not on the whitelist."
   b. Found with status = 'disabled' → 403 code:"deactivated"
                                       → frontend redirects to /access-denied?reason=deactivated
4. Backend looks up users table, compares bcrypt hash
   → Mismatch → 401 "Invalid credentials"
5. Backend reads user_roles table for the role
6. Backend signs a JWT: { userId, email, role }
7. Backend reads permissions for role from role_permissions table
8. Response: { token, user: { id, email, displayName, avatarUrl, role, isWhitelisted, createdAt }, permissions }
9. Frontend stores token in localStorage key 'slh_token'
10. Frontend calls setToken() → AuthProvider updates all context consumers
11. Frontend redirects to /  (dashboard)
```

### Error codes & messages

| Scenario | HTTP | Message shown |
|---|---|---|
| Not on whitelist | 403 | "Access Denied. You are not on the whitelist." |
| Account disabled | 403 | Redirected to /access-denied?reason=deactivated |
| Wrong password | 401 | "Invalid credentials" |
| Email not found | 401 | "Invalid credentials" |
| Server error | 500 | "Login failed. Please check your credentials." |

---

## 3. Whitelist Gating

The `whitelisted_users` table is the **primary access control gate**. A user record in `users` table alone is not sufficient to log in.

### Whitelist record fields

| Field | Description |
|---|---|
| `id` | UUID |
| `email` | Lowercased email address |
| `status` | `'active'` or `'disabled'` |
| `assignedRole` | Role assigned at invite time (default: `deal_handler`) |
| `invitedBy` | UUID of the admin who added them |
| `createdAt` | Timestamp |

### How a user gets whitelisted

1. **Access Request approved** by admin → auto-added to whitelist with `deal_handler` role
2. **Direct invite** by admin on the Team page → added to whitelist with chosen role
3. **Manual DB insert** (admin only, direct SQL)

### Disabling a user

Admin can toggle a team member's whitelist status to `disabled` from the **Team** page. On next login attempt, they receive the deactivated error and are redirected to `/access-denied`.

---

## 4. JWT Tokens & Session Management

### Token signing
```
Algorithm: HS256
Secret: JWT_SECRET environment variable (default: "spark-lead-hub-secret-change-me")
Expiry: JWT_EXPIRES_IN environment variable (default: "7d")
Payload: { userId, email, role }
```

### Token storage
- Stored in `localStorage` under key **`slh_token`**
- Read on page load by `AuthProvider` to restore session
- Sent as `Authorization: Bearer <token>` header on all API requests

### Token refresh
Endpoint: `POST /api/auth/refresh`
- Requires a **valid current token** (not expired)
- Verifies user is still active on the whitelist
- Issues a **new JWT** with a fresh expiry
- Frontend calls this automatically when the user clicks "Stay Logged In" during the idle timeout warning
- Returns: `{ token: string, expiresIn: number (ms) }`

### /me endpoint
`GET /api/auth/me` — used on every page load (if a token exists) to:
- Validate the token is still accepted
- Fetch latest user data (role, whitelist status, permissions)
- If this call returns 401 → `signOut()` is called automatically

---

## 5. Idle Timeout & Session Warning

The `AuthProvider` tracks user activity and auto-logs out idle sessions.

### Timings

| Setting | Value |
|---|---|
| Idle timeout | **15 minutes** of no activity |
| Warning shown | **1 minute before** logout (at 14 min mark) |
| Countdown | 60-second countdown displayed in a popup |
| Countdown turns red | At ≤ 10 seconds remaining |

### Tracked events
`mousemove`, `mousedown`, `keydown`, `scroll`, `touchstart`, `click`
Also resets on `visibilitychange` (switching back to the tab).

### Warning popup behaviour
- Blurred overlay appears with a countdown ring
- **"Stay Logged In"** button → calls `POST /api/auth/refresh`, updates token, resets timer
- **"Logout"** button → immediate sign out
- If countdown reaches 0 → automatic `signOut()`

### Sign-out actions
1. Token removed from `localStorage`
2. `slh_logout` written to localStorage (triggers multi-tab sync)
3. User redirected to `/auth`
4. All idle timers cleared

---

## 6. Roles & Permissions (RBAC)

### Built-in roles

| Role | Description | Default for |
|---|---|---|
| `admin` | Full access to everything. Bypasses all permission checks. | Initial super-admin seed |
| `manager` | Broad access; can read reports, manage team | Direct invite (manager option) |
| `deal_handler` | Sales team member; manages leads, limited to own scope | Access request approvals, default invite |
| `member` | Read-only, basic access | Fallback if no role row exists |

### How permissions work

- **Admin** always has full permissions (`create/read/update/delete/export` on all resources).
- All other roles have their permissions stored in the **`role_permissions`** DB table.
- Permissions are loaded after login and after every `/me` call.
- The frontend `hasPermission(resource, action)` helper checks the in-memory list.
- Backend middleware `requireAdmin` blocks non-admins from admin-only endpoints.

### Resources and actions

| Resource | Actions |
|---|---|
| `leads` | create, read, update, delete, export |
| `reports` | create, read, update, delete, export |
| `settings` | create, read, update, delete, export |
| `team` | create, read, update, delete, export |
| `audit` | create, read, update, delete, export |

### Frontend permission guard

```tsx
<PermissionCheck resource="leads" action="delete">
  <DeleteButton />
</PermissionCheck>
```
If the user lacks the permission, nothing renders (or the optional `fallback` prop renders instead).

---

## 7. Access Request Flow (Public)

Anyone can request access without being logged in.

### URL
`/request-access`

### Form fields

| Field | Required | Description |
|---|---|---|
| Full Name | Yes | Stored as `name` |
| Email Address | Yes | Lowercased; must be unique (duplicate → 409 error) |
| Department | No | Optional organisational context |
| Reason | No | Why they need access |

### What happens after submission

1. Record inserted into `access_requests` table with `status = 'pending'`
2. User sees a success confirmation: "Your request has been submitted. An admin will review it shortly."
3. Admin sees the new request on the **Team page → Access Requests tab** (badge count updates)

### Duplicate request
If the same email submits twice → 409 Conflict → "You have already submitted an access request with this email."

---

## 8. Admin: Reviewing Access Requests

### Where
**Team page** (`/team`) → **Access Requests** tab (visible to admins only)

### What admins see per request

| Field | Description |
|---|---|
| Name | Requester's full name |
| Email | Requester's email |
| Department | (if provided) |
| Reason | (if provided) |
| Status badge | `pending` / `approved` / `rejected` |
| Reviewed by | Admin who actioned it |
| Reviewed at | Timestamp |

### Approve action (`POST /api/access-requests/:id/approve`)

Full approval flow (executed server-side):

```
1. Find the access request record
2. If user already has an account → mark request approved, stop (no duplicate user)
3. Upsert whitelisted_users with status='active', assignedRole='deal_handler'
4. Create users record with displayName = requester's name, tempHash password
5. Create user_roles record with role='deal_handler'
6. Create a 24-hour password_reset_tokens record (one-time use setup token)
7. Build set-password URL: {frontendUrl}/set-password?token={uuid}
8. Send "Access Approved" email (if SMTP configured) with the set-password link
9. Update access_request status → 'approved', reviewedBy, reviewedAt
10. Write audit log: action='access_request_approved'
11. Return: { success, emailSent, setPasswordUrl, message }
```

If email is **not configured** (no SMTP secrets), `emailSent = false` and the admin sees a **"Copy Setup Link"** button to manually share the set-password URL.

### Reject action (`POST /api/access-requests/:id/reject`)

```
1. Update access_request status → 'rejected', reviewedBy, reviewedAt
2. Write audit log: action='access_request_rejected'
3. Return: { success, message }
```

No email is sent on rejection. The requester is not notified automatically.

---

## 9. Admin: Direct Invite Flow

Admins can invite users directly without waiting for an access request.

### Where
**Team page** (`/team`) → **"Invite User"** button (top-right, admin only)

### Invite form fields

| Field | Options |
|---|---|
| Email | Free text email |
| Role | `manager` or `deal_handler` |

### What happens (`POST /api/team/invite`)

```
1. Upsert whitelisted_users: status='active', assignedRole=chosen role
2. Create users record with display name derived from email prefix, tempHash password
3. Create user_roles record with chosen role
4. Create a 24-hour password_reset_tokens record
5. Build set-password URL
6. Send "You've been invited" email (if SMTP configured)
7. Return: { success, emailSent, setPasswordUrl }
```

If email sending fails or SMTP is unconfigured → admin can **copy the setup link** from the modal and share it directly.

---

## 10. Account Activation (Set Password)

New users activate their account by visiting the set-password link.

### URL
`/set-password?token={uuid}`

### Page features
- **Display Name** field (min 2 chars, max 60) — sets how they appear to the team
- **New Password** field (min 8 chars) with show/hide toggle
- **Password strength bar** — 4 segments: Weak / Fair / Good / Strong
- **Confirm Password** field with real-time match indicator (green ✓ or red ✗)
- **Progress bar** animation during submission
- Submit button disabled until all fields are valid

### Validation rules

| Rule | Constraint |
|---|---|
| Display name | Min 2 chars, max 60 chars |
| Password | Min 8 characters |
| Passwords match | Must be equal |
| Token | Must be present in URL |

### Token validation (`POST /api/auth/set-password`)

```
1. Find password_reset_tokens record: matching token + used=false + expiresAt > now()
2. Hash new password with bcrypt (cost 12)
3. Update users.passwordHash + users.displayName (if provided) + users.updatedAt
4. Mark token as used=true
5. Return { success: true }
```

After success:
- User sees a green ✓ "Password Set!" confirmation
- After 2.2 seconds, auto-redirect to `/auth` to log in

### Token expiry
- Tokens expire **24 hours** after creation
- Expired tokens → "Invalid or expired token" error
- Admin must re-invite the user to generate a new token

---

## 11. Access Denied States

### /access-denied page

Shown when:
1. `?reason=deactivated` — user's whitelist status is `disabled`
2. `isWhitelisted === false` returned from `/me` (shouldn't normally happen post-login)

What the user sees:
- Large lock icon
- "Access Denied" heading
- Reason-specific message explaining their account is disabled
- "Contact your administrator" guidance
- "Back to Login" link

### ProtectedRoute behaviour

Every page inside the app is wrapped with `<ProtectedRoute>`. It checks:
1. If no token → redirect to `/auth`
2. If token exists but `isWhitelisted === false` → redirect to `/access-denied`
3. If loading → show full-page spinner
4. Otherwise → render the page normally

---

## 12. Profile Management

### Where
User avatar menu (top-right) → **Profile** option

### Editable fields (`PATCH /api/auth/profile`)

| Field | Notes |
|---|---|
| `displayName` | Min 1 char after trim; cannot be set to empty |
| `avatarUrl` | URL string; pass `null` or `""` to clear |

The email address and role cannot be changed via profile — admin must update these directly.

---

## 13. Email Notifications

Two automated emails are sent in the access workflow:

### Email 1: Access Approved
- **Trigger:** Admin approves an access request
- **To:** Requester's email
- **Subject:** "You've been granted access to Spark Lead Hub"
- **Content:** Welcome message from the approving admin + set-password button link
- **Template:** Branded HTML with LeadFlow logo, neon teal CTA button

### Email 2: Direct Invite
- **Trigger:** Admin uses "Invite User" on the Team page
- **To:** Invited user's email
- **Subject:** "You've been invited to Spark Lead Hub"
- **Content:** Invite from admin + set-password button link

### SMTP configuration

| Secret Key | Description |
|---|---|
| `SMTP_USER` | Gmail (or other) sending address |
| `SMTP_PASS` | App password (not the account password) |
| `SMTP_HOST` | Default: `smtp.gmail.com` |
| `SMTP_PORT` | Default: `587` |

If `SMTP_USER` and `SMTP_PASS` are not set, email sending is **silently skipped**. The admin still receives the `setPasswordUrl` in the API response and can copy it manually from the UI.

---

## 14. Multi-Tab Sync

The `AuthProvider` listens to `localStorage` storage events to keep all open tabs in sync:

| Event | Action |
|---|---|
| `slh_logout` key written | All other tabs sign out immediately |
| `slh_token` set to null in another tab | All tabs sign out |
| `slh_token` updated with new value | All tabs update their token reference |

This ensures that:
- Logging out in one tab logs out all tabs
- Token refresh in one tab is available to all tabs

---

## 15. API Endpoint Reference

### Auth routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Sign in with email + password |
| GET | `/api/auth/me` | Yes | Get current user + permissions |
| POST | `/api/auth/set-password` | No | Activate account via token |
| POST | `/api/auth/refresh` | Yes | Refresh JWT, get new token |
| PATCH | `/api/auth/profile` | Yes | Update display name / avatar |

### Access request routes (`/api/access-requests`)

| Method | Endpoint | Auth Required | Admin Only | Description |
|---|---|---|---|---|
| POST | `/api/access-requests` | No | No | Submit an access request |
| GET | `/api/access-requests` | Yes | Yes | List all requests (optional `?status=pending`) |
| POST | `/api/access-requests/:id/approve` | Yes | Yes | Approve a request, create user, send email |
| POST | `/api/access-requests/:id/reject` | Yes | Yes | Reject a request |

### Team / invite routes (`/api/team`)

| Method | Endpoint | Auth Required | Admin Only | Description |
|---|---|---|---|---|
| GET | `/api/team` | Yes | Yes | List all team members |
| POST | `/api/team/invite` | Yes | Yes | Directly invite a user |
| PATCH | `/api/team/:id/status` | Yes | Yes | Enable / disable whitelist status |
| PATCH | `/api/team/:id/role` | Yes | Yes | Change a team member's role |
| DELETE | `/api/team/:id` | Yes | Yes | Remove a team member |

---

## 16. Environment Variables & Secrets

| Variable | Where set | Default | Purpose |
|---|---|---|---|
| `JWT_SECRET` | Secrets | `"spark-lead-hub-secret-change-me"` | JWT signing key — **must be changed in production** |
| `JWT_EXPIRES_IN` | Secrets | `"7d"` | Token lifetime (e.g. `"1d"`, `"8h"`, `"30m"`) |
| `SMTP_USER` | Secrets | (none) | SMTP username for sending emails |
| `SMTP_PASS` | Secrets | (none) | SMTP password/app password |
| `SMTP_HOST` | Env | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | Env | `587` | SMTP port |
| `FRONTEND_URL` | Env | (auto-detected from request) | Base URL for set-password links in emails |
| `DATABASE_URL` | Secrets | (auto-set by Replit) | PostgreSQL connection string |

---

## 17. Database Tables Involved

| Table | Purpose |
|---|---|
| `users` | Core user records (id, email, passwordHash, displayName, avatarUrl) |
| `whitelisted_users` | Access gate — only status='active' rows can log in |
| `user_roles` | Maps userId → role name |
| `role_permissions` | Stores per-role, per-resource, per-action allowed flags |
| `access_requests` | Public access requests (name, email, department, reason, status) |
| `password_reset_tokens` | One-time 24-hour tokens for account activation |
| `audit_log` | Records every approve/reject action with who did it |

---

## 18. Full Workflow Diagrams

### A. New user via Access Request

```
[Visitor]
  │
  └─ visits /request-access
       │  fills name, email, department, reason
       ▼
  POST /api/access-requests
       │  → inserted with status='pending'
       ▼
  [Admin sees badge on Team page]
       │  clicks Approve
       ▼
  POST /api/access-requests/:id/approve
       │  → upsert whitelisted_users (active, deal_handler)
       │  → insert users (tempHash)
       │  → insert user_roles (deal_handler)
       │  → insert password_reset_tokens (24h, one-time)
       │  → send "Access Approved" email with set-password link
       │  → update access_request status='approved'
       │  → write audit log
       ▼
  [User receives email]
       │  clicks "Set Your Password" link
       ▼
  /set-password?token={uuid}
       │  fills display name + password + confirm
       ▼
  POST /api/auth/set-password
       │  → validates token (unused, not expired)
       │  → bcrypt hash new password
       │  → update users.passwordHash + displayName
       │  → mark token used=true
       ▼
  Redirect → /auth
       │  user logs in normally
       ▼
  POST /api/auth/login  (standard sign-in flow)
```

---

### B. New user via Direct Invite

```
[Admin]
  │  clicks "Invite User" on /team
  │  enters email + role
  ▼
POST /api/team/invite
  │  → upsert whitelisted_users (active, chosen role)
  │  → insert users
  │  → insert user_roles
  │  → insert password_reset_tokens (24h)
  │  → send invite email (or return URL if no SMTP)
  ▼
[If email sent] → user gets email with set-password link
[If no SMTP]   → admin copies link from modal, shares manually
  ▼
/set-password?token={uuid}  →  same flow as above
```

---

### C. Standard Login (returning user)

```
User visits /auth
  │  enters email + password
  ▼
POST /api/auth/login
  ├─ whitelist check   → not found / disabled → error
  ├─ user lookup       → not found → 401
  ├─ bcrypt verify     → mismatch → 401
  └─ success:
       sign JWT  → store in localStorage
       load permissions
       redirect to /
  ▼
App renders (ProtectedRoute passes)
AuthProvider → GET /api/auth/me on load
Idle timer starts (15 min)
```

---

### D. Idle Timeout & Refresh

```
[14 min of no activity]
  ▼
Warning popup appears (60-second countdown)

  If "Stay Logged In" clicked:
    POST /api/auth/refresh
    → new JWT issued
    → localStorage updated
    → idle timer resets to 15 min

  If "Logout" clicked or countdown hits 0:
    token removed from localStorage
    slh_logout written to localStorage
    all tabs sign out
    redirect to /auth
```

---

*This document covers every login, access, session, and permission mechanism in Spark Lead Hub as of April 2026.*
