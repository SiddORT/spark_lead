import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable, pipelineStagesTable, pipelineStatusesTable, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

function getNextActions(stageName: string | null): string[] {
  if (!stageName) return [];
  const lower = stageName.toLowerCase();
  if (lower.includes("initiation") || lower.includes("discovery")) {
    return [
      "Call the lead to introduce yourself",
      "Verify and complete contact details",
      "Assign a lead owner",
      "Research the prospect company",
    ];
  }
  if (lower.includes("qualification") || lower.includes("analysis")) {
    return [
      "Schedule a requirements meeting",
      "Identify the decision maker",
      "Assess budget and timeline",
      "Send a qualification questionnaire",
    ];
  }
  if (lower.includes("proposal") || lower.includes("negotiation") || lower.includes("strategy")) {
    return [
      "Send the tailored proposal",
      "Follow up in 2 business days",
      "Address any objections",
      "Share relevant case studies",
    ];
  }
  if (lower.includes("closure") || lower.includes("resolution")) {
    return [
      "Confirm the final deal outcome",
      "Send the agreement/contract",
      "Capture post-deal feedback",
      "Schedule onboarding kickoff",
    ];
  }
  return [
    "Review lead details",
    "Follow up with the prospect",
    "Update lead status",
  ];
}

router.post("/:id/generate-notes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const leads = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    if (!leads[0]) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    const lead = leads[0];

    let stageName: string | null = null;
    let statusName: string | null = null;
    let serviceName: string | null = null;

    if (lead.pipelineStageId) {
      const stages = await db.select().from(pipelineStagesTable).where(eq(pipelineStagesTable.id, lead.pipelineStageId)).limit(1);
      stageName = stages[0]?.displayName || null;
    }
    if (lead.pipelineStatusId) {
      const statuses = await db.select().from(pipelineStatusesTable).where(eq(pipelineStatusesTable.id, lead.pipelineStatusId)).limit(1);
      statusName = statuses[0]?.displayName || null;
    }
    if (lead.serviceId) {
      const services = await db.select().from(servicesTable).where(eq(servicesTable.id, lead.serviceId)).limit(1);
      serviceName = services[0]?.name || null;
    }

    const prompt = `You are a CRM sales assistant. Generate professional, concise sales notes for this lead.

Lead Name: ${lead.leadName}
Company: ${lead.company || "Not specified"}
Service: ${serviceName || "Not specified"}
Deal Value: ${lead.dealValue ? `₹${lead.dealValue}` : "Not specified"}
Stage: ${stageName || lead.stage || "Not specified"}
Status: ${statusName || "Not specified"}
Lead Type: ${lead.leadType || "Not specified"}
Next Action: ${lead.nextAction || "Not specified"}

Return structured notes in this exact format:

**Initial Context:**
<2-3 sentence summary of the lead situation>

**Key Observations:**
- <observation 1>
- <observation 2>
- <observation 3>

**Recommended Next Steps:**
- <step 1>
- <step 2>
- <step 3>

Keep each section concise and actionable. Focus on sales strategy and deal progression.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const aiNotes = response.choices[0]?.message?.content || "";
    const nextActions = getNextActions(stageName);
    const lastAiGeneratedAt = new Date();

    await db
      .update(leadsTable)
      .set({ aiNotes, nextActions, lastAiGeneratedAt, updatedAt: lastAiGeneratedAt })
      .where(eq(leadsTable.id, id));

    res.json({ aiNotes, nextActions, lastAiGeneratedAt: lastAiGeneratedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Generate notes error");
    res.status(500).json({ message: "Failed to generate notes" });
  }
});

export default router;
