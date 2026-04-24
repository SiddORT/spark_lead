import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { leadDocumentsTable, usersTable, pipelineStagesTable, pipelineStatusesTable, leadsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
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
    await db.insert(leadDocumentsTable).values({
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
    await db
      .delete(leadDocumentsTable)
      .where(eq(leadDocumentsTable.id, docId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete lead document error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
