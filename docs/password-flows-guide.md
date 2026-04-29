# Spark Lead Hub — Password Setting & Reset Guide

**Version:** 1.0 | **Last updated:** April 2026
**API base:** `/api`
**Token storage:** `password_reset_tokens` table
**Token lifetime:** 24 hours (one-time use)

---

## Table of Contents

1. [Overview](#1-overview)
2. [How Passwords Work in the System](#2-how-passwords-work-in-the-system)
3. [The Set-Password Page (User side)](#3-the-set-password-page-user-side)
4. [Way 1 — Admin invites a new user directly](#4-way-1--admin-invites-a-new-user-directly)
5. [Way 2 — Admin approves an access request](#5-way-2--admin-approves-an-access-request)
6. [Way 3 — Admin generates a reset link for an existing user](#6-way-3--admin-generates-a-reset-link-for-an-existing-user)
7. [Way 4 — Admin resends reset link via email](#7-way-4--admin-resends-reset-link-via-email)
8. [Way 5 — Direct database reset (emergency)](#8-way-5--direct-database-reset-emergency)
9. [Token Lifecycle & Security Rules](#9-token-lifecycle--security-rules)
10. [Email Templates](#10-email-templates)
11. [What happens when SMTP is not configured](#11-what-happens-when-smtp-is-not-configured)
12. [API Endpoint Reference](#12-api-endpoint-reference)
13. [Database Tables Involved](#13-database-tables-involved)
14. [Full Flow Diagrams](#14-full-flow-diagrams)
15. [Common Issues & Fixes](#15-common-issues--fixes)

---

## 1. Overview

There is **no "forgot password" self-service** in this system. Password management is fully admin-controlled. Every password-related action produces a **one-time, 24-hour token** that links to the `/set-password` page. The user clicks the link, sets their display name and password, and the token is immediately invalidated.

There are **5 ways** an admin can give a user access to set or reset their password:

| # | Method | When to use |
|---|---|---|
| 1 | Direct invite (Team page) | Brand new user, never had an account |
| 2 | Approve an access request | User submitted a request from the login page |
| 3 | Generate link (no email) | User locked out, admin copies and shares link manually |
| 4 | Resend link via email | User lost their invite email, SMTP is configured |
| 5 | Direct DB hash update | Emergency — no app access, direct server/SQL access |

---

## 2. How Passwords Work in the System

### Hashing
All passwords are hashed using **bcrypt** with a cost factor of **12** before being stored. The original password is never stored anywhere.

```
User types: "MyPassword@123"
Stored in DB: "$2b$12$buVe9OI3nJTPxqI4GZm3v.2zy1rcqmipmLP3MF4CA1QeFRMOMXNB6"
```

- The hash **cannot be reversed**. There is no way to see what the original password was.
- On login, bcrypt compares the entered password against the stored hash without decrypting it.

### Temporary password at account creation
When a new user is created (via invite or access approval), they are assigned a **random UUID as a temporary password hash**. This means they cannot log in until they complete the set-password flow. Their account exists, but it is locked until they set a real password.

### The `password_reset_tokens` table
Every time a setup/reset link is generated:
- A new UUID token is inserted into `password_reset_tokens`
- It has a 24-hour expiry
- It is marked `used = false`
- When the user sets their password, it is immediately marked `used = true`
- Any existing unused tokens for that user are **invalidated** (marked `used = true`) whenever a new one is generated

---

## 3. The Set-Password Page (User side)

### URL
```
/set-password?token={uuid}
```

### What the user sees
- **Display Name** field — how they appear to the team (min 2 chars)
- **New Password** field with show/hide toggle
- **Password strength bar** — 4 levels: Weak / Fair / Good / Strong
- **Confirm Password** field with real-time match indicator
- Submit button (disabled until all fields are valid)
- Progress bar animation while submitting
- Success screen with green checkmark, then auto-redirect to login

### Validation rules

| Field | Rule |
|---|---|
| Display Name | Min 2 characters, max 60 characters |
| Password | Minimum 8 characters |
| Confirm Password | Must exactly match Password |
| Token | Must be present in URL, unused, and not expired |

### Password strength scoring

The strength bar scores the password across 5 criteria:
- Length ≥ 8 characters (+1)
- Length ≥ 12 characters (+1)
- Contains uppercase AND lowercase letters (+1)
- Contains a number (+1)
- Contains a special character (+1)

Scores 1–2 = Weak, 3 = Fair, 4 = Good, 5 = Strong

### What happens on submit (`POST /api/auth/set-password`)

```
1. Find token in password_reset_tokens where:
   - token matches
   - used = false
   - expires_at > NOW()
2. Hash new password with bcrypt (cost 12)
3. Update users table:
   - password_hash = new hash
   - display_name = entered name (if provided)
   - updated_at = now()
4. Mark token as used = true
5. Return { success: true }
6. Frontend shows success screen → redirects to /auth after 2.2 seconds
```

### Token error states

| Error | Cause | Fix |
|---|---|---|
| "Invalid or expired token" | Token used, expired, or doesn't exist | Admin generates a new link |
| "Invalid or missing token" | URL opened without `?token=` | Share the correct full link |

---

## 4. Way 1 — Admin invites a new user directly

### Where in the app
**Team page** (`/team`) → **"Invite User"** button (top-right corner, visible to admins only)

### Steps

1. Admin clicks **Invite User**
2. A modal opens with two fields:
   - **Email address** — the user's email
   - **Role** — `Manager` or `Deal Handler`
3. Admin clicks **Send Invite**

### What the backend does (`POST /api/team/invite`)

```
1. Normalize email to lowercase
2. Check whitelisted_users table:
   - Not found → INSERT new record (status='active', assignedRole=chosen role)
   - Found → UPDATE to status='active', update role
3. Check users table:
   - Not found → INSERT new user with:
       - id = new UUID
       - email = normalized email
       - password_hash = bcrypt(random UUID, 12)  ← locked account
       - display_name = email prefix (e.g. "smit" from "smit@onerooftech.com")
   - Found → UPDATE existing role
4. INSERT password_reset_tokens:
       - token = new UUID
       - expires_at = NOW() + 24 hours
       - used = false
5. Build set-password URL: {frontendUrl}/set-password?token={uuid}
6. Send invite email (if SMTP configured)
7. Write audit log: action="user_invited"
8. Return: { success, emailSent, setPasswordUrl }
```

### After inviting

- **If SMTP is configured** → email is sent automatically, admin sees a green "Invitation email sent" message
- **If SMTP is not configured** → admin sees a copy-link modal with the full set-password URL to share manually

### Audit trail
Every invite is recorded in `audit_log` with:
- `action: "user_invited"`
- `details: { email, role, emailSent }`
- `userId`: the admin who sent it

---

## 5. Way 2 — Admin approves an access request

### Where in the app
**Team page** (`/team`) → **Access Requests tab** → click **Approve** on any pending request

### What the backend does (`POST /api/access-requests/:id/approve`)

```
1. Find the access_request record by ID
2. Check if user already has an account:
   - Yes → mark request approved, stop (skip creating duplicate)
3. Upsert whitelisted_users: status='active', assignedRole='deal_handler'
4. INSERT user: tempHash password, displayName = requester's name
5. INSERT user_roles: role='deal_handler'
6. INSERT password_reset_tokens: 24-hour token
7. Build set-password URL
8. Get reviewer's display name for the email
9. Send "Access Approved" email (different template from invite)
10. UPDATE access_request: status='approved', reviewed_by, reviewed_at
11. Write audit log: action="access_request_approved"
12. Return: { success, emailSent, setPasswordUrl }
```

### Difference from direct invite

| Aspect | Direct Invite | Access Request Approval |
|---|---|---|
| Default role | Chosen by admin (manager / deal_handler) | Always `deal_handler` |
| Display name | Derived from email prefix | From the request form (requester's real name) |
| Email template | "You've been invited" | "Your access has been approved" |
| Audit action | `user_invited` | `access_request_approved` |

---

## 6. Way 3 — Admin generates a reset link for an existing user

Use this when a user **forgets their password** and you want to share the link manually (chat, WhatsApp, etc.) without sending an email.

### Where in the app
**Team page** → find the user → actions menu (⋯) → **"Generate Password Link"**

### What the backend does (`POST /api/team/members/:id/generate-password-link`)

```
1. Find user by ID
2. Call generateFreshToken(userId, origin):
   a. Mark ALL existing tokens for this user as used = true (invalidate old ones)
   b. INSERT new password_reset_tokens: new UUID, expires_at = NOW() + 24h, used = false
   c. Build set-password URL
3. Write audit log: action="password_link_generated"
4. Return: { success: true, setPasswordUrl }
```

### What admin sees
A modal appears with the full URL, e.g.:
```
https://your-app.replit.app/set-password?token=7d7d057c-9e8d-4d46-98cf-b6311a5a8213
```
Admin can click **Copy Link** and share it directly with the user.

### Key behaviour
- Any **previous unused reset tokens** for that user are invalidated before the new one is created
- This means only **one active token** can exist per user at any time
- The new token expires in exactly **24 hours** from generation

---

## 7. Way 4 — Admin resends reset link via email

Use this when SMTP is configured and you want to send the reset link directly to the user's email.

### Where in the app
**Team page** → find the user → actions menu (⋯) → **"Resend Password Link"**

### What the backend does (`POST /api/team/members/:id/resend-password-link`)

```
1. Find user by ID
2. Call generateFreshToken(userId, origin):
   a. Invalidate all existing tokens for this user
   b. Create new 24-hour token
   c. Build set-password URL
3. Get user's current role from user_roles
4. Get admin's display name
5. Send "You've been invited" email with the new set-password URL
6. Write audit log: action="password_link_resent", emailSent: true/false
7. Return: { success, emailSent, setPasswordUrl }
```

### Email sent
Same invite email template. Subject: `"You've been invited to Spark Lead Hub — Set your password"`
Content includes:
- Who invited them (admin's display name)
- Their role
- Their account email displayed prominently
- A large teal "Set Your Password →" button
- The full URL as plain text below the button

If the email fails (SMTP misconfigured), the link is still returned and shown in the UI so admin can copy it manually.

---

## 8. Way 5 — Direct database reset (emergency)

Use only when you have no app access (e.g. the server is down).

### Step 1 — Generate a new bcrypt hash

Run this from the API server directory:

```bash
node -e "const b = require('bcryptjs'); b.hash('NewPassword@123!', 12).then(h => console.log(h));"
```

Copy the output hash (starts with `$2b$12$...`)

### Step 2 — Update the database directly

```sql
UPDATE users
SET password_hash = '$2b$12$PASTE_HASH_HERE',
    updated_at = NOW()
WHERE email = 'smit@onerooftech.com';
```

### Step 3 — Tell the user their temporary password

Share `NewPassword@123!` with the user securely. They can log in and (if a profile page is added) change it themselves.

### Important notes on this method
- This bypasses the set-password flow entirely
- No audit log is created
- The user will be using a password that the admin knows — not ideal for security
- Recommended only as an emergency last resort
- Always ask the user to change it after logging in

---

## 9. Token Lifecycle & Security Rules

### Token flow

```
Admin action (invite / approve / generate / resend)
  │
  ├─ Invalidate all existing unused tokens for this user
  │   UPDATE password_reset_tokens SET used=true WHERE user_id = ?
  │
  └─ INSERT new token:
       id = UUID
       user_id = user's UUID
       token = UUID (this is what goes in the URL)
       expires_at = NOW() + 24 hours
       used = false
              │
              ▼
         User opens /set-password?token={uuid}
              │
              ├─ Token valid (used=false AND expires_at > NOW()) → proceed
              │
              └─ Token invalid → "Invalid or expired token" error
                      │
                      ▼
                 Admin must generate a new link
```

### Security properties

| Property | Detail |
|---|---|
| One-time use | Token is marked `used=true` immediately on successful password set |
| Expiry | 24 hours from generation — expired tokens are rejected |
| Invalidation on re-issue | Any new token generation for a user invalidates all their previous tokens |
| Unpredictable | Tokens are UUID v4 — cryptographically random, not guessable |
| Single active token | Only one valid token per user at any time |

---

## 10. Email Templates

### Template 1 — Invite / Password Setup email
**Trigger:** Direct invite OR resend password link
**Subject:** `You've been invited to Spark Lead Hub — Set your password`

**Content:**
- "You've been invited! 🎉"
- "{AdminName} has invited you to join Spark Lead Hub as a {Role}"
- Account email displayed prominently
- "This link expires in **24 hours**"
- Large teal **"Set Your Password →"** button
- Plain-text URL below the button

### Template 2 — Access Approved email
**Trigger:** Admin approves an access request
**Subject:** `Your access to Spark Lead Hub has been approved`

**Content:**
- Green "✅ Access Approved" banner
- "Welcome to Spark Lead Hub!"
- "Hi {Name}, your access request has been approved by {AdminName}"
- "This link expires in **24 hours**"
- Large teal **"Set Password & Get Started →"** button
- Plain-text URL below

Both emails are sent **from:** `"Spark Lead Hub" <{SMTP_USER}>`

---

## 11. What happens when SMTP is not configured

If `SMTP_USER` and `SMTP_PASS` secrets are not set:

- The server logs: `"Email service not configured — SMTP_USER / SMTP_PASS missing in Secrets. Emails will be skipped."`
- `emailSent` in all API responses will be `false`
- The `setPasswordUrl` is **always returned** in the API response regardless
- The app UI shows a **"Copy Link"** modal so the admin can share it manually
- No error is thrown — the system degrades gracefully

### To enable email
Set these two secrets in the Replit Secrets panel:
- `SMTP_USER` — your Gmail address (e.g. `sparkleadhub@gmail.com`)
- `SMTP_PASS` — your Gmail **App Password** (not your account password)
  - Generate at: Google Account → Security → 2-Step Verification → App Passwords

Optional (defaults to Gmail):
- `SMTP_HOST` — default: `smtp.gmail.com`
- `SMTP_PORT` — default: `587`

---

## 12. API Endpoint Reference

### Password / invite endpoints

| Method | Endpoint | Auth | Admin | Description |
|---|---|---|---|---|
| POST | `/api/auth/set-password` | No | No | User sets their password using a token |
| POST | `/api/team/invite` | Yes | Yes | Invite a new user, creates account + sends email |
| POST | `/api/team/members/:id/generate-password-link` | Yes | Yes | Generate reset link only (no email) |
| POST | `/api/team/members/:id/resend-password-link` | Yes | Yes | Generate reset link AND send via email |
| POST | `/api/access-requests/:id/approve` | Yes | Yes | Approve request, create user, send email |

### Request/response examples

**Generate link only:**
```http
POST /api/team/members/{userId}/generate-password-link
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "setPasswordUrl": "https://your-app.replit.app/set-password?token=7d7d057c-...",
  "message": "Link generated"
}
```

**Resend via email:**
```http
POST /api/team/members/{userId}/resend-password-link
Authorization: Bearer {adminToken}

Response:
{
  "success": true,
  "emailSent": true,
  "setPasswordUrl": "https://your-app.replit.app/set-password?token=abc123...",
  "message": "Password setup link sent successfully"
}
```

**Set password (user flow):**
```http
POST /api/auth/set-password
Content-Type: application/json

{
  "token": "7d7d057c-9e8d-4d46-98cf-b6311a5a8213",
  "password": "MyNewPassword@123!",
  "displayName": "Smit Lalai"
}

Response:
{
  "success": true,
  "message": "Password set successfully"
}
```

---

## 13. Database Tables Involved

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | varchar | Unique, lowercased |
| `password_hash` | text | bcrypt hash (cost 12) |
| `display_name` | varchar | Set during activation |
| `updated_at` | timestamp | Updated when password changes |

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users.id |
| `token` | UUID | The value in the URL (`?token=xxx`) |
| `expires_at` | timestamp | Created + 24 hours |
| `used` | boolean | Default false; true after use or invalidation |

### `audit_log` (relevant entries)
| `action` value | When |
|---|---|
| `user_invited` | Admin invites a user |
| `access_request_approved` | Admin approves a request |
| `access_request_rejected` | Admin rejects a request |
| `password_link_generated` | Admin generates link (no email) |
| `password_link_resent` | Admin resends link via email |

---

## 14. Full Flow Diagrams

### A. New user — Direct Invite

```
Admin (Team page)
  │  clicks "Invite User"
  │  fills email + role → clicks Send Invite
  ▼
POST /api/team/invite
  │
  ├─ upsert whitelisted_users (active, role)
  ├─ create users (tempHash, display_name from email)
  ├─ create user_roles
  ├─ create password_reset_tokens (24h, used=false)
  ├─ build set-password URL
  │
  ├─ [SMTP configured] → send invite email → emailSent=true
  │       └─ admin sees "Invitation email sent" toast
  │
  └─ [No SMTP] → emailSent=false
          └─ admin sees "Copy Link" modal → shares URL manually
  │
  ▼
User opens: /set-password?token={uuid}
  │  enters display name + password + confirm
  ▼
POST /api/auth/set-password
  │  validates token → hashes password → updates users → marks token used
  ▼
Success screen → redirect to /auth
  │
  ▼
User logs in normally via POST /api/auth/login
```

---

### B. Existing user — Password Reset

```
Admin (Team page)
  │  finds user → clicks ⋯ → "Generate Password Link"
  ▼
POST /api/team/members/:id/generate-password-link
  │
  ├─ mark all existing tokens for this user as used=true
  ├─ INSERT new token (24h)
  ├─ build set-password URL
  ├─ write audit log
  └─ return { setPasswordUrl }
  │
  ▼
Admin copies URL → shares with user (WhatsApp, email, Slack, etc.)
  │
  ▼
User opens: /set-password?token={new-uuid}
  │  (old token is invalidated — only this new one works)
  ▼
[same set-password flow as above]
```

---

### C. Admin resends via email

```
Admin (Team page)
  │  finds user → clicks ⋯ → "Resend Password Link"
  ▼
POST /api/team/members/:id/resend-password-link
  │
  ├─ generateFreshToken (invalidates old, creates new 24h token)
  ├─ fetch user's current role
  ├─ fetch admin's display name
  ├─ send invite email to user's email address
  ├─ write audit log (emailSent: true/false)
  └─ return { success, emailSent, setPasswordUrl }
  │
  ▼
[SMTP configured] → User receives email with "Set Your Password" button
[No SMTP]        → Admin sees copy-link modal
```

---

### D. Access Request → Approval

```
Public visitor
  │  visits /request-access
  │  fills name, email, department, reason
  ▼
POST /api/access-requests  (no auth required)
  │  INSERT access_requests (status='pending')
  ▼
Admin sees new request on Team → Access Requests tab
  │  clicks Approve
  ▼
POST /api/access-requests/:id/approve
  │
  ├─ upsert whitelisted_users (active, deal_handler)
  ├─ INSERT users (requester's real name, tempHash)
  ├─ INSERT user_roles (deal_handler)
  ├─ INSERT password_reset_tokens (24h)
  ├─ send "Access Approved" email
  ├─ UPDATE access_requests (approved, reviewed_by, reviewed_at)
  └─ write audit log
  │
  ▼
[same set-password flow as above]
```

---

### E. Emergency — Direct DB hash update

```
Admin has server/DB access
  │
  ├─ Step 1: Run in terminal:
  │   node -e "const b=require('bcryptjs'); b.hash('TempPass@123',12).then(h=>console.log(h));"
  │   → copies hash output
  │
  ├─ Step 2: Run SQL:
  │   UPDATE users SET password_hash='$2b$12$...' WHERE email='user@example.com';
  │
  └─ Step 3: Share temp password with user securely
             Ask them to change it after first login
```

---

## 15. Common Issues & Fixes

| Problem | Likely cause | Fix |
|---|---|---|
| "Invalid or expired token" on set-password page | Token is > 24 hours old or already used | Admin generates a new link from Team page |
| User says they didn't get the email | SMTP not configured, or email went to spam | Admin copies the link from the UI and shares manually; check spam folder |
| User set password but still can't log in | Whitelist status might be disabled | Admin checks Team page — toggle whitelist status to Active |
| Admin can't see "Invite User" button | Not logged in as admin role | Check role in Team page — only admin role can invite |
| Set-password link shows "missing token" | User opened `/set-password` without the token in the URL | Make sure the full URL including `?token=...` was shared |
| Multiple reset emails sent — which link works? | Each new link invalidates all previous ones | Only the **most recently generated** link is valid |
| Need to reset password but no SMTP | No email configured | Use Way 3 (generate link, copy manually) or Way 5 (direct DB) |

---

*This document covers every method for setting and resetting passwords in Spark Lead Hub as of April 2026.*
