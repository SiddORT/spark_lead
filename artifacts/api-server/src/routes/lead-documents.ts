import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { leadDocumentsTable, leadActivitiesTable, usersTable, pipelineStagesTable, pipelineStatusesTable, leadsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router({ mergeParams: true });

// GET /api/leads/:leadId/documents
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { leadId } = req.params;
    const docs = await db
      .select({
        id: leadDocumentsTable.id,
        leadId: leadDocumentsTable.leadId,
        fileName: leadDocumentsTable.fileName,
        fileUrl: leadDocumentsTable.fileUrl,
        fileSize: leadDocumentsTable.fileSize,
        mimeType: leadDocumentsTable.mimeType,
        uploadedAt: leadDocumentsTable.uploadedAt,
        uploadedBy: leadDocumentsTable.uploadedBy,
        stage: leadDocumentsTable.stage,
        status: leadDocumentsTable.status,
        noteId: leadDocumentsTable.noteId,
        uploaderName: usersTable.displayName,
      })
      .from(leadDocumentsTable)
      .leftJoin(usersTable, eq(leadDocumentsTable.uploadedBy, usersTable.id))
      .where(eq(leadDocumentsTable.leadId, leadId))
      .orderBy(desc(leadDocumentsTable.uploadedAt));

    res.json(docs);
  } catch (err) {
    req.log.error({ err }, "Get lead documents error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/leads/:leadId/documents
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { leadId } = req.params;
    const { fileName, fileUrl, fileSize, mimeType, stage, status, noteId } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({ message: "fileName and fileUrl are required" });
    }

    const docId = uuidv4();
    // Atomic: document record + timeline activity succeed or fail together
    await db.transaction(async (tx) => {
      await tx.insert(leadDocumentsTable).values({
        id: docId,
        leadId,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        uploadedBy: req.user!.userId,
        stage: stage || null,
        status: status || null,
        noteId: noteId || null,
      });
      await tx.insert(leadActivitiesTable).values({
        id: uuidv4(),
        leadId,
        userId: req.user!.userId,
        action: "document_uploaded",
        newValue: JSON.stringify({
          docId,
          fileName,
          fileUrl,
          stage: stage || null,
        }),
      });
    });

    const [doc] = await db
      .select({
        id: leadDocumentsTable.id,
        leadId: leadDocumentsTable.leadId,
        fileName: leadDocumentsTable.fileName,
        fileUrl: leadDocumentsTable.fileUrl,
        fileSize: leadDocumentsTable.fileSize,
        mimeType: leadDocumentsTable.mimeType,
        uploadedAt: leadDocumentsTable.uploadedAt,
        uploadedBy: leadDocumentsTable.uploadedBy,
        stage: leadDocumentsTable.stage,
        status: leadDocumentsTable.status,
        noteId: leadDocumentsTable.noteId,
        uploaderName: usersTable.displayName,
      })
      .from(leadDocumentsTable)
      .leftJoin(usersTable, eq(leadDocumentsTable.uploadedBy, usersTable.id))
      .where(eq(leadDocumentsTable.id, docId));

    res.status(201).json(doc);
  } catch (err) {
    req.log.error({ err }, "Create lead document error");
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/leads/:leadId/documents/:docId
router.delete("/:docId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { leadId, docId } = req.params;

    // Non-UUID ids would throw a Postgres cast error — treat as not found
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(docId)) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Fetch first so we can log the file name and scope by lead
    const [doc] = await db
      .select()
      .from(leadDocumentsTable)
      .where(and(eq(leadDocumentsTable.id, docId), eq(leadDocumentsTable.leadId, leadId)))
      .limit(1);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Atomic: delete + timeline activity succeed or fail together
    await db.transaction(async (tx) => {
      await tx.delete(leadDocumentsTable).where(eq(leadDocumentsTable.id, docId));
      await tx.insert(leadActivitiesTable).values({
        id: uuidv4(),
        leadId,
        userId: req.user!.userId,
        action: "document_deleted",
        newValue: JSON.stringify({
          docId,
          fileName: doc.fileName,
          stage: doc.stage || null,
        }),
      });
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete lead document error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
