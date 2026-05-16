import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, whitelistedUsersTable, userRolesTable, rolePermissionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "spark-lead-hub-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing token" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
}

/**
 * Permission middleware factory.
 * Admins bypass all checks. For every other role the permission row is
 * fetched live from the DB so changes made in the admin UI take effect
 * on the very next request — no restart or re-login required.
 *
 * Missing row  → DENY (safe default)
 * allowed=false → DENY
 * allowed=true  → pass through
 */
export function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (req.user.role === "admin") {
      next();
      return;
    }
    try {
      const [perm] = await db
        .select()
        .from(rolePermissionsTable)
        .where(
          and(
            eq(rolePermissionsTable.roleName, req.user.role as any),
            eq(rolePermissionsTable.resource, resource),
            eq(rolePermissionsTable.action, action),
          )
        )
        .limit(1);

      if (!perm?.allowed) {
        res.status(403).json({ message: `Permission denied: ${resource}.${action}` });
        return;
      }
      next();
    } catch (err) {
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

export async function getPermissionsForRole(role: string): Promise<Record<string, Record<string, boolean>>> {
  if (role === "admin") {
    // Admin has unrestricted access to every resource and action
    const resources = ["leads", "companies", "services", "pipeline", "reports", "settings", "team", "audit"];
    const actions   = ["create", "read", "update", "delete", "export"];
    const perms: Record<string, Record<string, boolean>> = {};
    for (const r of resources) {
      perms[r] = {};
      for (const a of actions) {
        perms[r][a] = true;
      }
    }
    return perms;
  }

  const rows = await db
    .select()
    .from(rolePermissionsTable)
    .where(eq(rolePermissionsTable.roleName, role as any));

  const perms: Record<string, Record<string, boolean>> = {};
  for (const row of rows) {
    if (!perms[row.resource]) perms[row.resource] = {};
    perms[row.resource][row.action] = row.allowed;
  }
  return perms;
}

export async function getUserWithRole(userId: string) {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) return null;

  const wl = await db.select().from(whitelistedUsersTable).where(eq(whitelistedUsersTable.email, user[0].email)).limit(1);
  const roleRow = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, userId)).limit(1);

  return {
    user: user[0],
    whitelist: wl[0] || null,
    role: roleRow[0]?.role || "member",
  };
}
