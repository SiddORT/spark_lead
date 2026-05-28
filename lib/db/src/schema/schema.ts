import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  integer,
  date,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const appRoleEnum = pgEnum("app_role", [
  "admin",
  "manager",
  "member",
  "lead_owner",
  "deal_handler",
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "discovery",
  "qualification",
  "strategy",
  "resolution",
]);

export const leadTypeEnum = pgEnum("lead_type", [
  "hot",
  "warm",
  "cold",
  "ghosted",
]);

export const leadOutcomeEnum = pgEnum("lead_outcome", [
  "closed",
  "lost",
  "wip",
  "delayed",
]);

export const emotionalStateEnum = pgEnum("emotional_state", [
  "skeptical",
  "enthusiastic",
  "frustrated",
]);

export const decisionRoleEnum = pgEnum("decision_role", [
  "champion",
  "gatekeeper",
  "economic_buyer",
]);

export const strategicTierEnum = pgEnum("strategic_tier", ["high", "med", "low"]);

export const killReasonEnum = pgEnum("kill_reason", [
  "feature_gap",
  "price",
  "ghosted",
]);

export const frictionPointEnum = pgEnum("friction_point", [
  "scaling",
  "tech_debt",
  "budget",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const whitelistedUsersTable = pgTable("whitelisted_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  assignedRole: appRoleEnum("assigned_role").notNull().default("member"),
  invitedBy: uuid("invited_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userRolesTable = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  role: appRoleEnum("role").notNull().default("member"),
});

export const rolePermissionsTable = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleName: appRoleEnum("role_name").notNull(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  allowed: boolean("allowed").notNull().default(true),
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
});

export const accessRequestsTable = pgTable(
  "access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    department: text("department"),
    reason: text("reason"),
    status: text("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.email)]
);

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry"),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const servicesTable = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companyServicesTable = pgTable("company_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => servicesTable.id, { onDelete: "cascade" }),
});

// ─── Pipeline master tables ───────────────────────────
export const pipelineStagesTable = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6b7a9a"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isTerminal: boolean("is_terminal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pipelineStatusesTable = pgTable("pipeline_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  stageId: uuid("stage_id")
    .notNull()
    .references(() => pipelineStagesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6b7a9a"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isWon: boolean("is_won").notNull().default(false),
  isLost: boolean("is_lost").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leadsTable = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadName: text("lead_name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  pipelineStageId: uuid("pipeline_stage_id").references(() => pipelineStagesTable.id),
  pipelineStatusId: uuid("pipeline_status_id").references(() => pipelineStatusesTable.id),
  stage: leadStageEnum("stage").notNull().default("discovery"),
  leadType: leadTypeEnum("lead_type"),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  serviceId: uuid("service_id").references(() => servicesTable.id),
  company: text("company"),
  leadOwner: text("lead_owner"),
  dealHandler: text("deal_handler"),
  dealValue: text("deal_value"),
  value: text("value"),
  followUpDate: date("follow_up_date"),
  nextAction: text("next_action"),
  sourceContext: text("source_context"),
  emotionalState: emotionalStateEnum("emotional_state"),
  decisionRole: decisionRoleEnum("decision_role"),
  strategicTier: strategicTierEnum("strategic_tier"),
  customHook: text("custom_hook"),
  objection: text("objection"),
  outcome: leadOutcomeEnum("outcome"),
  killReason: killReasonEnum("kill_reason"),
  leadKillReason: text("lead_kill_reason"),
  internalRating: integer("internal_rating"),
  resolvedAt: timestamp("resolved_at"),
  frictionPoint: frictionPointEnum("friction_point"),
  finalValue: text("final_value"),
  valueUpdatedAt: timestamp("value_updated_at"),
  valueUpdatedBy: text("value_updated_by"),
  closureNote: text("closure_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leadDocumentsTable = pgTable("lead_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: uuid("uploaded_by").references(() => usersTable.id),
  stage: text("stage"),
  status: text("status"),
  noteId: uuid("note_id").references(() => leadNotesTable.id, { onDelete: "set null" }),
});

export const leadValueHistoryTable = pgTable("lead_value_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: uuid("changed_by").references(() => usersTable.id),
  reason: text("reason"),
});

export const leadCompaniesTable = pgTable("lead_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companiesTable.id, { onDelete: "cascade" }),
});

export const leadNotesTable = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  content: text("content").notNull(),
  stageContext: text("stage_context"),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leadActivitiesTable = pgTable("lead_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leadsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  action: text("action").notNull(),
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  noteContent: text("note_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leadFollowersTable = pgTable(
  "lead_followers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    leadUserUnique: unique("lead_followers_lead_user_unique").on(t.leadId, t.userId),
  }),
);

export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type WhitelistedUser = typeof whitelistedUsersTable.$inferSelect;
export type UserRole = typeof userRolesTable.$inferSelect;
export type RolePermission = typeof rolePermissionsTable.$inferSelect;
export type Lead = typeof leadsTable.$inferSelect;
export type LeadNote = typeof leadNotesTable.$inferSelect;
export type LeadActivity = typeof leadActivitiesTable.$inferSelect;
export type Company = typeof companiesTable.$inferSelect;
export type Service = typeof servicesTable.$inferSelect;
export type AuditLog = typeof auditLogTable.$inferSelect;
export type AccessRequest = typeof accessRequestsTable.$inferSelect;
export type PipelineStage = typeof pipelineStagesTable.$inferSelect;
export type PipelineStatus = typeof pipelineStatusesTable.$inferSelect;
export type LeadDocument = typeof leadDocumentsTable.$inferSelect;
export type LeadValueHistory = typeof leadValueHistoryTable.$inferSelect;
export type LeadFollower = typeof leadFollowersTable.$inferSelect;
