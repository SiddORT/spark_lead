import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import {
  leadsTable,
  leadNotesTable,
  leadActivitiesTable,
  leadCompaniesTable,
  leadDocumentsTable,
  leadValueHistoryTable,
  companiesTable,
  servicesTable,
  usersTable,
  auditLogTable,
  pipelineStagesTable,
  pipelineStatusesTable,
} from "@workspace/db";
import leadDocumentsRouter from "./lead-documents";
import { eq, inArray, and, or, gte, asc, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { sendActivityAlertEmail } from "../lib/email";

const router = Router();

async function getLeadWithRelations(leadId: string) {
  const lead = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId))
    .limit(1);
  if (!lead[0]) return null;

  const linkedCompanies = await db
    .select({ company: companiesTable })
    .from(leadCompaniesTable)
    .leftJoin(companiesTable, eq(leadCompaniesTable.companyId, companiesTable.id))
    .where(eq(leadCompaniesTable.leadId, leadId));

  let serviceName: string | null = null;
  if (lead[0].serviceId) {
    const svc = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, lead[0].serviceId))
      .limit(1);
    serviceName = svc[0]?.name || null;
  }

  let stageInfo: any = null;
  if (lead[0].pipelineStageId) {
    const st = await db.select().from(pipelineStagesTable).where(eq(pipelineStagesTable.id, lead[0].pipelineStageId!)).limit(1);
    stageInfo = st[0] || null;
  }

  let statusInfo: any = null;
  if (lead[0].pipelineStatusId) {
    const st = await db.select().from(pipelineStatusesTable).where(eq(pipelineStatusesTable.id, lead[0].pipelineStatusId!)).limit(1);
    statusInfo = st[0] || null;
  }

  // Compute activeFollowUpDate from latest note with a followUpDate set
  const latestNoteWithDate = await db
    .select({ followUpDate: leadNotesTable.followUpDate })
    .from(leadNotesTable)
    .where(and(eq(leadNotesTable.leadId, leadId), sql`${leadNotesTable.followUpDate} IS NOT NULL`))
    .orderBy(desc(leadNotesTable.createdAt))
    .limit(1);
  const activeFollowUpDate = latestNoteWithDate[0]?.followUpDate ?? lead[0].followUpDate ?? null;

  return {
    ...lead[0],
    serviceName,
    companies: linkedCompanies.map((lc) => lc.company).filter(Boolean),
    stageInfo,
    statusInfo,
    activeFollowUpDate,
  };
}

function formatLead(lead: any) {
  const stage = lead.stageInfo;
  const status = lead.statusInfo;
  const activeFollowUpDate = lead.activeFollowUpDate ?? lead.followUpDate ?? null;
  return {
    id: lead.id,
    leadName: lead.leadName,
    createdBy: lead.createdBy,
    // ─── New pipeline fields ───
    pipelineStageId:  lead.pipelineStageId  || null,
    pipelineStatusId: lead.pipelineStatusId || null,
    stageName:        stage?.displayName    || null,
    stageColor:       stage?.color          || null,
    stageSortOrder:   stage?.sortOrder      || null,
    stageIsTerminal:  stage?.isTerminal     ?? null,
    statusName:       status?.displayName   || null,
    statusColor:      status?.color         || null,
    statusIsWon:      status?.isWon         ?? false,
    statusIsLost:     status?.isLost        ?? false,
    // ─── Legacy (kept for backward compat) ───
    stage: lead.stage,
    outcome: lead.outcome,
    leadType: lead.leadType,
    contactEmail: lead.contactEmail,
    phone: lead.phone,
    serviceId: lead.serviceId,
    serviceName: lead.serviceName || null,
    company: lead.company,
    leadOwner: lead.leadOwner,
    dealHandler: lead.dealHandler,
    dealValue: lead.dealValue,
    value: lead.value,
    description: lead.description || null,
    followUpDate: lead.followUpDate,
    activeFollowUpDate,
    nextAction: lead.nextAction,
    sourceContext: lead.sourceContext,
    internalRating: lead.internalRating,
    resolvedAt: lead.resolvedAt?.toISOString?.() || (typeof lead.resolvedAt === "string" ? lead.resolvedAt : null),
    leadKillReason: lead.leadKillReason || null,
    finalValue: lead.finalValue || null,
    valueUpdatedAt: lead.valueUpdatedAt?.toISOString?.() || null,
    valueUpdatedBy: lead.valueUpdatedBy || null,
    closureNote: lead.closureNote || null,
    companies: (lead.companies || []).map((c: any) => ({
      id: c?.id,
      name: c?.name,
      industry: c?.industry || null,
      notes: c?.notes || null,
      createdBy: c?.createdBy || null,
      createdAt: c?.createdAt?.toISOString?.() || new Date().toISOString(),
    })),
    createdAt: lead.createdAt?.toISOString?.() || lead.createdAt,
    updatedAt: lead.updatedAt?.toISOString?.() || lead.updatedAt,
  };
}

router.get("/export/csv", requireAuth, async (req: AuthRequest, res) => {
  try {
    const leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));

    const headers = [
      "Lead Name", "Contact Email", "Phone", "Lead Type",
      "Stage", "Status",
      "Service", "Companies", "Lead Owner", "Deal Handler",
      "Deal Value", "Follow-up Date", "Next Action", "Created"
    ];

    const rows = await Promise.all(
      leads.map(async (lead) => {
        let serviceName = "";
        if (lead.serviceId) {
          const svc = await db.select().from(servicesTable).where(eq(servicesTable.id, lead.serviceId)).limit(1);
          serviceName = svc[0]?.name || "";
        }
        const linkedCompanies = await db
          .select({ name: companiesTable.name })
          .from(leadCompaniesTable)
          .leftJoin(companiesTable, eq(leadCompaniesTable.companyId, companiesTable.id))
          .where(eq(leadCompaniesTable.leadId, lead.id));

        let stageName = "";
        if (lead.pipelineStageId) {
          const st = await db.select().from(pipelineStagesTable).where(eq(pipelineStagesTable.id, lead.pipelineStageId)).limit(1);
          stageName = st[0]?.displayName || "";
        }
        let statusName = "";
        if (lead.pipelineStatusId) {
          const st = await db.select().from(pipelineStatusesTable).where(eq(pipelineStatusesTable.id, lead.pipelineStatusId)).limit(1);
          statusName = st[0]?.displayName || "";
        }

        return [
          lead.leadName,
          lead.contactEmail || "",
          lead.phone || "",
          lead.leadType || "",
          stageName,
          statusName,
          serviceName,
          linkedCompanies.map((c) => c.name).join("; "),
          lead.leadOwner || "",
          lead.dealHandler || "",
          lead.dealValue || "",
          lead.followUpDate || "",
          lead.nextAction || "",
          lead.createdAt.toISOString(),
        ];
      })
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const today = new Date().toISOString().split("T")[0];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=leads-${today}.csv`);
    res.send(csvContent);
  } catch (err) {
    req.log.error({ err }, "Export CSV error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role;
    const userId = req.user!.userId;

    let leads = await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));

    if (role === "manager" || role === "lead_owner") {
      leads = leads.filter(
        (l) => l.leadOwner === userId || l.dealHandler === userId
      );
    } else if (role === "deal_handler") {
      leads = leads.filter((l) => l.dealHandler === userId);
    }

    // Fetch all pipeline stages/statuses once (batch for performance)
    const allStages = await db.select().from(pipelineStagesTable);
    const allStatuses = await db.select().from(pipelineStatusesTable);

    // Batch-fetch latest note followUpDate per lead
    const leadIds = leads.map((l) => l.id);
    const notesWithDates = leadIds.length > 0
      ? await db
          .select({ leadId: leadNotesTable.leadId, followUpDate: leadNotesTable.followUpDate, createdAt: leadNotesTable.createdAt })
          .from(leadNotesTable)
          .where(and(inArray(leadNotesTable.leadId, leadIds), sql`${leadNotesTable.followUpDate} IS NOT NULL`))
          .orderBy(desc(leadNotesTable.createdAt))
      : [];
    // Build map: leadId → latest note followUpDate
    const latestNoteFollowUpMap = new Map<string, string>();
    for (const n of notesWithDates) {
      if (!latestNoteFollowUpMap.has(n.leadId) && n.followUpDate) {
        latestNoteFollowUpMap.set(n.leadId, n.followUpDate);
      }
    }

    const result = await Promise.all(
      leads.map(async (lead) => {
        const linkedCompanies = await db
          .select({ company: companiesTable })
          .from(leadCompaniesTable)
          .leftJoin(companiesTable, eq(leadCompaniesTable.companyId, companiesTable.id))
          .where(eq(leadCompaniesTable.leadId, lead.id));

        let serviceName: string | null = null;
        if (lead.serviceId) {
          const svc = await db.select().from(servicesTable).where(eq(servicesTable.id, lead.serviceId)).limit(1);
          serviceName = svc[0]?.name || null;
        }

        const stageInfo = lead.pipelineStageId
          ? allStages.find((s) => s.id === lead.pipelineStageId) || null
          : null;
        const statusInfo = lead.pipelineStatusId
          ? allStatuses.find((s) => s.id === lead.pipelineStatusId) || null
          : null;

        return formatLead({
          ...lead,
          serviceName,
          companies: linkedCompanies.map((lc) => lc.company),
          stageInfo,
          statusInfo,
          activeFollowUpDate: latestNoteFollowUpMap.get(lead.id) ?? lead.followUpDate ?? null,
        });
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get leads error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { companyIds: rawCompanyIds, ...data } = req.body;
    const companyIds: string[] = [...new Set<string>((rawCompanyIds || []).filter(Boolean))];
    const leadId = uuidv4();

    await db.insert(leadsTable).values({
      id: leadId,
      leadName: data.leadName,
      description: data.description || null,
      createdBy: req.user!.userId,
      stage: "discovery",
      pipelineStageId: data.pipelineStageId || null,
      pipelineStatusId: data.pipelineStatusId || null,
      leadType: data.leadType || null,
      contactEmail: data.contactEmail || null,
      phone: data.phone || null,
      serviceId: data.serviceId || null,
      company: data.company || null,
      leadOwner: data.leadOwner || null,
      dealHandler: data.dealHandler || null,
      dealValue: data.dealValue || null,
      followUpDate: data.followUpDate || null,
      nextAction: data.nextAction || null,
      sourceContext: data.sourceContext || null,
    });

    if (companyIds && companyIds.length > 0) {
      await db.insert(leadCompaniesTable).values(
        companyIds.map((cId: string) => ({
          id: uuidv4(),
          leadId,
          companyId: cId,
        }))
      );
    }

    await db.insert(leadActivitiesTable).values({
      id: uuidv4(),
      leadId,
      userId: req.user!.userId,
      action: "created",
    });

    const lead = await getLeadWithRelations(leadId);
    res.status(201).json(formatLead(lead));
  } catch (err) {
    req.log.error({ err }, "Create lead error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const lead = await getLeadWithRelations(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.json(formatLead(lead));
  } catch (err) {
    req.log.error({ err }, "Get lead error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const existing = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, req.params.id))
      .limit(1);

    if (!existing[0]) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    const old = existing[0];
    const { companyIds, ...updateData } = req.body;

    // Track changes for activity log
    const activities: any[] = [];
    const trackableFields = [
      "pipelineStageId", "pipelineStatusId",
      "stage", "leadType", "contactEmail", "phone", "serviceId", "company",
      "leadOwner", "dealHandler", "dealValue", "value", "followUpDate",
      "nextAction", "emotionalState", "decisionRole", "strategicTier",
      "customHook", "objection", "outcome", "killReason", "leadKillReason", "internalRating", "frictionPoint",
      "finalValue", "closureNote"
    ];

    for (const field of trackableFields) {
      if (updateData[field] !== undefined) {
        const oldVal = (old as any)[field];
        const newVal = updateData[field];
        if (String(oldVal) !== String(newVal)) {
          activities.push({ field_name: field, old_value: String(oldVal || ""), new_value: String(newVal || "") });
        }
      }
    }

    // Auto-set resolved_at when moving to a terminal pipeline status or legacy outcome change
    let autoResolvedAt: Date | undefined;
    if (updateData.pipelineStatusId && !old.resolvedAt) {
      const newStatus = await db.select().from(pipelineStatusesTable)
        .where(eq(pipelineStatusesTable.id, updateData.pipelineStatusId)).limit(1);
      if (newStatus[0] && (newStatus[0].isWon || newStatus[0].isLost)) {
        autoResolvedAt = new Date();
      }
    } else if (updateData.outcome && updateData.outcome !== "wip" && !old.resolvedAt) {
      autoResolvedAt = new Date();
    }

    const dbUpdate: any = { updatedAt: new Date() };
    if (updateData.leadName !== undefined) dbUpdate.leadName = updateData.leadName;
    if (updateData.description !== undefined) dbUpdate.description = updateData.description || null;
    if (updateData.pipelineStageId !== undefined) dbUpdate.pipelineStageId = updateData.pipelineStageId;
    if (updateData.pipelineStatusId !== undefined) dbUpdate.pipelineStatusId = updateData.pipelineStatusId;
    if (updateData.stage !== undefined) dbUpdate.stage = updateData.stage;
    if (updateData.leadType !== undefined) dbUpdate.leadType = updateData.leadType;
    if (updateData.contactEmail !== undefined) dbUpdate.contactEmail = updateData.contactEmail;
    if (updateData.phone !== undefined) dbUpdate.phone = updateData.phone;
    if (updateData.serviceId !== undefined) dbUpdate.serviceId = updateData.serviceId;
    if (updateData.company !== undefined) dbUpdate.company = updateData.company;
    if (updateData.leadOwner !== undefined) dbUpdate.leadOwner = updateData.leadOwner;
    if (updateData.dealHandler !== undefined) dbUpdate.dealHandler = updateData.dealHandler;
    if (updateData.dealValue !== undefined) dbUpdate.dealValue = updateData.dealValue;
    if (updateData.value !== undefined) dbUpdate.value = updateData.value;
    if (updateData.followUpDate !== undefined) dbUpdate.followUpDate = updateData.followUpDate;
    if (updateData.nextAction !== undefined) dbUpdate.nextAction = updateData.nextAction;
    if (updateData.sourceContext !== undefined) dbUpdate.sourceContext = updateData.sourceContext;
    if (updateData.emotionalState !== undefined) dbUpdate.emotionalState = updateData.emotionalState;
    if (updateData.decisionRole !== undefined) dbUpdate.decisionRole = updateData.decisionRole;
    if (updateData.strategicTier !== undefined) dbUpdate.strategicTier = updateData.strategicTier;
    if (updateData.customHook !== undefined) dbUpdate.customHook = updateData.customHook;
    if (updateData.objection !== undefined) dbUpdate.objection = updateData.objection;
    if (updateData.outcome !== undefined) dbUpdate.outcome = updateData.outcome;
    if (updateData.killReason !== undefined) dbUpdate.killReason = updateData.killReason;
    if (updateData.leadKillReason !== undefined) dbUpdate.leadKillReason = updateData.leadKillReason || null;
    if (updateData.internalRating !== undefined) dbUpdate.internalRating = updateData.internalRating;
    if (updateData.frictionPoint !== undefined) dbUpdate.frictionPoint = updateData.frictionPoint;
    if (updateData.resolvedAt !== undefined) dbUpdate.resolvedAt = updateData.resolvedAt;
    if (autoResolvedAt) dbUpdate.resolvedAt = autoResolvedAt;
    if (updateData.closureNote !== undefined) dbUpdate.closureNote = updateData.closureNote || null;

    // finalValue: track change + auto-set valueUpdatedAt/By
    let valueHistoryEntry: any = null;
    if (updateData.finalValue !== undefined) {
      const oldFinal = old.finalValue;
      const newFinal = updateData.finalValue || null;
      if (String(oldFinal || "") !== String(newFinal || "")) {
        valueHistoryEntry = {
          id: uuidv4(),
          leadId: req.params.id,
          oldValue: oldFinal || old.dealValue || null,
          newValue: newFinal,
          changedBy: req.user!.userId,
          reason: "Won Adjustment",
        };
      }
      dbUpdate.finalValue = newFinal;
      dbUpdate.valueUpdatedAt = new Date();
      dbUpdate.valueUpdatedBy = req.user!.userId;
    }

    await db.update(leadsTable).set(dbUpdate).where(eq(leadsTable.id, req.params.id));

    // Insert value history after lead update
    if (valueHistoryEntry) {
      await db.insert(leadValueHistoryTable).values(valueHistoryEntry);
    }

    if (companyIds !== undefined) {
      const uniqueCompanyIds: string[] = [...new Set<string>((companyIds as string[]).filter(Boolean))];
      await db.delete(leadCompaniesTable).where(eq(leadCompaniesTable.leadId, req.params.id));
      if (uniqueCompanyIds.length > 0) {
        await db.insert(leadCompaniesTable).values(
          uniqueCompanyIds.map((cId: string) => ({
            id: uuidv4(),
            leadId: req.params.id,
            companyId: cId,
          }))
        );
      }
    }

    // Log activities
    if (activities.length > 0) {
      await db.insert(leadActivitiesTable).values(
        activities.map((a) => ({
          id: uuidv4(),
          leadId: req.params.id,
          userId: req.user!.userId,
          action: "field_update",
          fieldName: a.field_name,
          oldValue: a.old_value,
          newValue: a.new_value,
        }))
      );

      // Send activity alert emails
      const updated = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).limit(1);
      if (updated[0]) {
        const recipientIds = [updated[0].leadOwner, updated[0].dealHandler].filter(Boolean);
        for (const recipientId of recipientIds) {
          try {
            const user = await db.select().from(usersTable).where(eq(usersTable.id, recipientId!)).limit(1);
            if (user[0]) {
              const actor = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
              await sendActivityAlertEmail({
                recipientEmail: user[0].email,
                leadName: updated[0].leadName,
                changeDetails: activities.map((a) => `${a.field_name}: "${a.old_value}" → "${a.new_value}"`).join("\n"),
                actorName: actor[0]?.displayName || req.user!.email,
              });
            }
          } catch {
            // ignore email errors
          }
        }
      }
    }

    const lead = await getLeadWithRelations(req.params.id);
    res.json(formatLead(lead));
  } catch (err) {
    req.log.error({ err }, "Update lead error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const lead = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).limit(1);
    if (!lead[0]) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    await db.insert(auditLogTable).values({
      id: uuidv4(),
      userId: req.user!.userId,
      action: "delete",
      resource: "leads",
      resourceId: req.params.id,
      details: { leadName: lead[0].leadName },
    });

    await db.delete(leadsTable).where(eq(leadsTable.id, req.params.id));
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete lead error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// Notes
router.get("/:id/notes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const notes = await db
      .select()
      .from(leadNotesTable)
      .where(eq(leadNotesTable.leadId, req.params.id))
      .orderBy(leadNotesTable.createdAt);

    const result = await Promise.all(
      notes.map(async (note) => {
        const author = await db.select().from(usersTable).where(eq(usersTable.id, note.userId)).limit(1);
        return {
          id: note.id,
          leadId: note.leadId,
          userId: note.userId,
          content: note.content,
          stageContext: note.stageContext,
          followUpDate: note.followUpDate || null,
          createdAt: note.createdAt.toISOString(),
          authorName: author[0]?.displayName || "Unknown",
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get notes error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/notes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content, stageContext, followUpDate } = req.body;
    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    // Idempotency guard: reject a duplicate note with identical content from the
    // same user for the same lead submitted within the last 5 seconds.
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentDuplicate = await db
      .select()
      .from(leadNotesTable)
      .where(
        and(
          eq(leadNotesTable.leadId, req.params.id),
          eq(leadNotesTable.userId, req.user!.userId),
          eq(leadNotesTable.content, content),
          gte(leadNotesTable.createdAt, fiveSecondsAgo),
        ),
      )
      .limit(1);

    if (recentDuplicate.length > 0) {
      // Return the existing note silently — idempotent response
      res.status(201).json(recentDuplicate[0]);
      return;
    }

    const noteId = uuidv4();
    await db.insert(leadNotesTable).values({
      id: noteId,
      leadId: req.params.id,
      userId: req.user!.userId,
      content,
      stageContext: stageContext || null,
      followUpDate: followUpDate || null,
    });

    await db.insert(leadActivitiesTable).values({
      id: uuidv4(),
      leadId: req.params.id,
      userId: req.user!.userId,
      action: "note_added",
      noteContent: content,
      newValue: followUpDate || null,
    });

    // Bump the lead's updatedAt so the table re-sorts to top
    await db.update(leadsTable).set({ updatedAt: new Date() }).where(eq(leadsTable.id, req.params.id));

    const note = await db.select().from(leadNotesTable).where(eq(leadNotesTable.id, noteId)).limit(1);
    const author = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

    // Send activity alert
    const lead = await db.select().from(leadsTable).where(eq(leadsTable.id, req.params.id)).limit(1);
    if (lead[0]) {
      const recipientIds = [lead[0].leadOwner, lead[0].dealHandler].filter(
        (id) => id && id !== req.user!.userId
      );
      for (const recipientId of recipientIds) {
        try {
          const user = await db.select().from(usersTable).where(eq(usersTable.id, recipientId!)).limit(1);
          if (user[0]) {
            await sendActivityAlertEmail({
              recipientEmail: user[0].email,
              leadName: lead[0].leadName,
              changeDetails: `Note added: "${content}"`,
              actorName: author[0]?.displayName || req.user!.email,
            });
          }
        } catch {
          // ignore email errors
        }
      }
    }

    res.status(201).json({
      id: note[0].id,
      leadId: note[0].leadId,
      userId: note[0].userId,
      content: note[0].content,
      stageContext: note[0].stageContext,
      followUpDate: note[0].followUpDate || null,
      createdAt: note[0].createdAt.toISOString(),
      authorName: author[0]?.displayName || "Unknown",
    });
  } catch (err) {
    req.log.error({ err }, "Add note error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/notes/:noteId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { content } = req.body;
    const note = await db.select().from(leadNotesTable).where(eq(leadNotesTable.id, req.params.noteId)).limit(1);

    if (!note[0]) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    if (note[0].userId !== req.user!.userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Not authorized to edit this note" });
      return;
    }

    await db.update(leadNotesTable).set({ content }).where(eq(leadNotesTable.id, req.params.noteId));

    const updated = await db.select().from(leadNotesTable).where(eq(leadNotesTable.id, req.params.noteId)).limit(1);
    const author = await db.select().from(usersTable).where(eq(usersTable.id, updated[0].userId)).limit(1);

    res.json({
      id: updated[0].id,
      leadId: updated[0].leadId,
      userId: updated[0].userId,
      content: updated[0].content,
      stageContext: updated[0].stageContext,
      createdAt: updated[0].createdAt.toISOString(),
      authorName: author[0]?.displayName || "Unknown",
    });
  } catch (err) {
    req.log.error({ err }, "Update note error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id/notes/:noteId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const note = await db.select().from(leadNotesTable).where(eq(leadNotesTable.id, req.params.noteId)).limit(1);

    if (!note[0]) {
      res.status(404).json({ message: "Note not found" });
      return;
    }

    if (note[0].userId !== req.user!.userId && req.user!.role !== "admin") {
      res.status(403).json({ message: "Not authorized to delete this note" });
      return;
    }

    await db.delete(leadNotesTable).where(eq(leadNotesTable.id, req.params.noteId));
    // Bump the lead's updatedAt on note deletion too
    await db.update(leadsTable).set({ updatedAt: new Date() }).where(eq(leadsTable.id, req.params.id));
    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete note error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// Activities
router.get("/:id/activities", requireAuth, async (req: AuthRequest, res) => {
  try {
    const activities = await db
      .select()
      .from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, req.params.id))
      .orderBy(leadActivitiesTable.createdAt);

    const result = await Promise.all(
      activities.map(async (a) => {
        const actor = await db.select().from(usersTable).where(eq(usersTable.id, a.userId)).limit(1);
        return {
          id: a.id,
          leadId: a.leadId,
          userId: a.userId,
          action: a.action,
          fieldName: a.fieldName,
          oldValue: a.oldValue,
          newValue: a.newValue,
          noteContent: a.noteContent,
          createdAt: a.createdAt.toISOString(),
          actorName: actor[0]?.displayName || "Unknown",
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get activities error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// Value history
router.get("/:id/value-history", requireAuth, async (req: AuthRequest, res) => {
  try {
    const history = await db
      .select({
        id: leadValueHistoryTable.id,
        leadId: leadValueHistoryTable.leadId,
        oldValue: leadValueHistoryTable.oldValue,
        newValue: leadValueHistoryTable.newValue,
        changedAt: leadValueHistoryTable.changedAt,
        reason: leadValueHistoryTable.reason,
        changedByName: usersTable.displayName,
      })
      .from(leadValueHistoryTable)
      .leftJoin(usersTable, eq(leadValueHistoryTable.changedBy, usersTable.id))
      .where(eq(leadValueHistoryTable.leadId, req.params.id))
      .orderBy(desc(leadValueHistoryTable.changedAt));

    res.json(history.map((h) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get value history error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mount documents sub-router
router.use("/:leadId/documents", leadDocumentsRouter);

export default router;
