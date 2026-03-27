import { db } from "@workspace/db";
import {
  usersTable,
  whitelistedUsersTable,
  userRolesTable,
  rolePermissionsTable,
  companiesTable,
  servicesTable,
  companyServicesTable,
  leadsTable,
  leadNotesTable,
  auditLogTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const { v4: uuidv4 } = await import("uuid");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sparkleadhub.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123!";

async function seed() {
  console.log("🌱 Starting seed...");

  // Create admin user
  const existingAdmin = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, ADMIN_EMAIL))
    .limit(1);

  let adminId: string;

  if (!existingAdmin[0]) {
    adminId = uuidv4();
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await db.insert(usersTable).values({
      id: adminId,
      email: ADMIN_EMAIL,
      passwordHash: hash,
      displayName: "Admin",
    });
    console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
  } else {
    adminId = existingAdmin[0].id;
    console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
  }

  // Whitelist admin
  const existingWl = await db
    .select()
    .from(whitelistedUsersTable)
    .where(eq(whitelistedUsersTable.email, ADMIN_EMAIL))
    .limit(1);

  if (!existingWl[0]) {
    await db.insert(whitelistedUsersTable).values({
      id: uuidv4(),
      email: ADMIN_EMAIL,
      status: "active",
      assignedRole: "admin",
    });
    console.log("✅ Admin whitelisted");
  }

  // Set admin role
  const existingRole = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, adminId))
    .limit(1);

  if (!existingRole[0]) {
    await db.insert(userRolesTable).values({
      id: uuidv4(),
      userId: adminId,
      role: "admin",
    });
    console.log("✅ Admin role assigned");
  }

  // Seed default permissions
  const permissionsToSeed = [
    // lead_owner
    { roleName: "lead_owner", resource: "leads", action: "create", allowed: true },
    { roleName: "lead_owner", resource: "leads", action: "read", allowed: true },
    { roleName: "lead_owner", resource: "leads", action: "update", allowed: true },
    { roleName: "lead_owner", resource: "leads", action: "delete", allowed: false },
    { roleName: "lead_owner", resource: "leads", action: "export", allowed: true },
    { roleName: "lead_owner", resource: "reports", action: "read", allowed: true },
    { roleName: "lead_owner", resource: "settings", action: "read", allowed: false },
    { roleName: "lead_owner", resource: "settings", action: "update", allowed: false },
    { roleName: "lead_owner", resource: "team", action: "read", allowed: false },
    { roleName: "lead_owner", resource: "team", action: "update", allowed: false },
    { roleName: "lead_owner", resource: "team", action: "create", allowed: false },
    { roleName: "lead_owner", resource: "audit", action: "read", allowed: false },
    // deal_handler
    { roleName: "deal_handler", resource: "leads", action: "create", allowed: false },
    { roleName: "deal_handler", resource: "leads", action: "read", allowed: true },
    { roleName: "deal_handler", resource: "leads", action: "update", allowed: true },
    { roleName: "deal_handler", resource: "leads", action: "delete", allowed: false },
    { roleName: "deal_handler", resource: "leads", action: "export", allowed: false },
    { roleName: "deal_handler", resource: "reports", action: "read", allowed: false },
    { roleName: "deal_handler", resource: "settings", action: "read", allowed: false },
    { roleName: "deal_handler", resource: "settings", action: "update", allowed: false },
    { roleName: "deal_handler", resource: "team", action: "read", allowed: false },
    { roleName: "deal_handler", resource: "team", action: "update", allowed: false },
    { roleName: "deal_handler", resource: "team", action: "create", allowed: false },
    { roleName: "deal_handler", resource: "audit", action: "read", allowed: false },
    // manager
    { roleName: "manager", resource: "leads", action: "create", allowed: true },
    { roleName: "manager", resource: "leads", action: "read", allowed: true },
    { roleName: "manager", resource: "leads", action: "update", allowed: true },
    { roleName: "manager", resource: "leads", action: "delete", allowed: false },
    { roleName: "manager", resource: "leads", action: "export", allowed: true },
    { roleName: "manager", resource: "reports", action: "read", allowed: true },
    { roleName: "manager", resource: "settings", action: "read", allowed: false },
    { roleName: "manager", resource: "settings", action: "update", allowed: false },
    { roleName: "manager", resource: "team", action: "read", allowed: true },
    { roleName: "manager", resource: "team", action: "update", allowed: false },
    { roleName: "manager", resource: "team", action: "create", allowed: false },
    { roleName: "manager", resource: "audit", action: "read", allowed: false },
    // member
    { roleName: "member", resource: "leads", action: "create", allowed: false },
    { roleName: "member", resource: "leads", action: "read", allowed: true },
    { roleName: "member", resource: "leads", action: "update", allowed: false },
    { roleName: "member", resource: "leads", action: "delete", allowed: false },
    { roleName: "member", resource: "leads", action: "export", allowed: false },
    { roleName: "member", resource: "reports", action: "read", allowed: true },
    { roleName: "member", resource: "settings", action: "read", allowed: false },
    { roleName: "member", resource: "settings", action: "update", allowed: false },
    { roleName: "member", resource: "team", action: "read", allowed: false },
    { roleName: "member", resource: "team", action: "update", allowed: false },
    { roleName: "member", resource: "team", action: "create", allowed: false },
    { roleName: "member", resource: "audit", action: "read", allowed: false },
  ];

  const existingPerms = await db.select().from(rolePermissionsTable);
  if (existingPerms.length === 0) {
    await db.insert(rolePermissionsTable).values(
      permissionsToSeed.map((p) => ({ id: uuidv4(), ...p })) as any
    );
    console.log("✅ Default permissions seeded");
  } else {
    console.log("ℹ️  Permissions already seeded");
  }

  // Seed sample companies
  const existingCompanies = await db.select().from(companiesTable);
  if (existingCompanies.length === 0) {
    const company1Id = uuidv4();
    const company2Id = uuidv4();
    const company3Id = uuidv4();

    await db.insert(companiesTable).values([
      { id: company1Id, name: "TechNova Solutions", industry: "Technology", notes: "Enterprise software company", createdBy: adminId },
      { id: company2Id, name: "GlobalBridge Consulting", industry: "Consulting", notes: "Strategy and management consulting", createdBy: adminId },
      { id: company3Id, name: "FinEdge Partners", industry: "Finance", notes: "Investment and wealth management", createdBy: adminId },
    ]);

    const service1Id = uuidv4();
    const service2Id = uuidv4();
    const service3Id = uuidv4();

    await db.insert(servicesTable).values([
      { id: service1Id, name: "CRM Implementation", category: "Software", description: "Full CRM system setup and training", createdBy: adminId },
      { id: service2Id, name: "Digital Transformation", category: "Consulting", description: "End-to-end digital strategy and execution", createdBy: adminId },
      { id: service3Id, name: "Data Analytics", category: "Analytics", description: "Business intelligence and reporting solutions", createdBy: adminId },
    ]);

    await db.insert(companyServicesTable).values([
      { id: uuidv4(), companyId: company1Id, serviceId: service1Id },
      { id: uuidv4(), companyId: company1Id, serviceId: service3Id },
      { id: uuidv4(), companyId: company2Id, serviceId: service2Id },
      { id: uuidv4(), companyId: company3Id, serviceId: service3Id },
    ]);

    console.log("✅ Sample companies and services seeded");
  } else {
    console.log("ℹ️  Companies already exist, skipping");
  }

  // Seed sample leads
  const existingLeads = await db.select().from(leadsTable);
  if (existingLeads.length === 0) {
    const companies = await db.select().from(companiesTable);
    const services = await db.select().from(servicesTable);
    const c1 = companies[0];
    const c2 = companies[1];
    const c3 = companies[2];
    const s1 = services[0];
    const s2 = services[1];
    const s3 = services[2];

    const sampleLeads = [
      {
        id: uuidv4(),
        leadName: "Rajesh Kumar",
        company: c1?.name || "TechNova Solutions",
        phone: "+91-9876543210",
        contactEmail: "rajesh@technova.com",
        leadType: "hot" as const,
        stage: "qualification" as const,
        serviceId: s1?.id,
        leadOwner: adminId,
        dealValue: "250000",
        emotionalState: "enthusiastic" as const,
        decisionRole: "economic_buyer" as const,
        strategicTier: "high" as const,
        sourceContext: "referral",
        createdBy: adminId,
      },
      {
        id: uuidv4(),
        leadName: "Priya Sharma",
        company: c2?.name || "GlobalBridge Consulting",
        phone: "+91-9123456789",
        contactEmail: "priya@globalbridge.com",
        leadType: "warm" as const,
        stage: "strategy" as const,
        serviceId: s2?.id,
        leadOwner: adminId,
        dealValue: "500000",
        emotionalState: "skeptical" as const,
        decisionRole: "gatekeeper" as const,
        strategicTier: "med" as const,
        sourceContext: "linkedin",
        createdBy: adminId,
      },
      {
        id: uuidv4(),
        leadName: "Amit Patel",
        company: c3?.name || "FinEdge Partners",
        phone: "+91-9988776655",
        contactEmail: "amit@finedge.com",
        leadType: "cold" as const,
        stage: "discovery" as const,
        serviceId: s3?.id,
        leadOwner: adminId,
        dealValue: "150000",
        sourceContext: "website",
        createdBy: adminId,
      },
      {
        id: uuidv4(),
        leadName: "Sunita Reddy",
        company: "IndiaFirst Bank",
        phone: "+91-9345678901",
        contactEmail: "sunita@indiafirst.com",
        leadType: "hot" as const,
        stage: "resolution" as const,
        serviceId: s1?.id,
        leadOwner: adminId,
        dealValue: "750000",
        emotionalState: "enthusiastic" as const,
        decisionRole: "economic_buyer" as const,
        strategicTier: "high" as const,
        outcome: "closed" as const,
        resolvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        sourceContext: "cold_call",
        createdBy: adminId,
      },
      {
        id: uuidv4(),
        leadName: "Vikram Singh",
        company: "Bharat Enterprises",
        phone: "+91-9456789012",
        contactEmail: "vikram@bharat.com",
        leadType: "ghosted" as const,
        stage: "resolution" as const,
        serviceId: s2?.id,
        leadOwner: adminId,
        dealValue: "80000",
        outcome: "lost" as const,
        killReason: "price" as const,
        resolvedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        sourceContext: "referral",
        createdBy: adminId,
      },
      {
        id: uuidv4(),
        leadName: "Meera Nair",
        company: "Kerala Spices Ltd",
        phone: "+91-9567890123",
        contactEmail: "meera@keralaspices.com",
        leadType: "warm" as const,
        stage: "qualification" as const,
        serviceId: s3?.id,
        leadOwner: adminId,
        dealValue: "320000",
        emotionalState: "enthusiastic" as const,
        decisionRole: "champion" as const,
        sourceContext: "website",
        createdBy: adminId,
      },
    ];

    const leadIds = sampleLeads.map(l => l.id);
    await db.insert(leadsTable).values(sampleLeads as any);

    // Add sample notes to first lead
    await db.insert(leadNotesTable).values([
      {
        id: uuidv4(),
        leadId: leadIds[0],
        userId: adminId,
        content: "Initial call went well — Rajesh is very interested in CRM implementation. Follow up next week with demo.",
      },
      {
        id: uuidv4(),
        leadId: leadIds[0],
        userId: adminId,
        content: "Sent proposal for ₹2,50,000. Awaiting internal approval from their finance team.",
      },
    ]);

    // Add audit log entries
    await db.insert(auditLogTable).values([
      {
        id: uuidv4(),
        userId: adminId,
        action: "lead.created",
        resource: "leads",
        resourceId: leadIds[0],
        details: { leadName: "Rajesh Kumar", company: "TechNova Solutions" },
      },
      {
        id: uuidv4(),
        userId: adminId,
        action: "lead.created",
        resource: "leads",
        resourceId: leadIds[1],
        details: { leadName: "Priya Sharma", company: "GlobalBridge Consulting" },
      },
      {
        id: uuidv4(),
        userId: adminId,
        action: "lead.closed",
        resource: "leads",
        resourceId: leadIds[3],
        details: { leadName: "Sunita Reddy", outcome: "closed", dealValue: "750000" },
      },
    ] as any);

    console.log("✅ Sample leads and notes seeded");
  } else {
    console.log("ℹ️  Leads already exist, skipping");
  }

  console.log("✨ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
