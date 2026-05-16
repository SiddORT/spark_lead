import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { companiesTable, companyServicesTable, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requirePermission } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function getCompanyWithServices(companyId: string) {
  const company = await db.select().from(companiesTable).where(eq(companiesTable.id, companyId)).limit(1);
  if (!company[0]) return null;

  const services = await db
    .select({ service: servicesTable })
    .from(companyServicesTable)
    .leftJoin(servicesTable, eq(companyServicesTable.serviceId, servicesTable.id))
    .where(eq(companyServicesTable.companyId, companyId));

  return {
    ...company[0],
    services: services.map((s) => s.service).filter(Boolean).map((s) => ({ id: s!.id, name: s!.name })),
  };
}

router.get("/", requireAuth, requirePermission("companies", "read"), async (req: AuthRequest, res) => {
  try {
    const companies = await db.select().from(companiesTable).orderBy(companiesTable.name);
    const result = await Promise.all(companies.map((c) => getCompanyWithServices(c.id)));
    res.json(
      result.map((c) => ({
        id: c!.id,
        name: c!.name,
        industry: c!.industry,
        notes: c!.notes,
        createdBy: c!.createdBy,
        createdAt: c!.createdAt.toISOString(),
        services: c!.services,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get companies error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireAuth, requirePermission("companies", "create"), async (req: AuthRequest, res) => {
  try {
    const { name, industry, notes } = req.body;
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const id = uuidv4();
    await db.insert(companiesTable).values({
      id,
      name,
      industry: industry || null,
      notes: notes || null,
      createdBy: req.user!.userId,
    });

    const company = await getCompanyWithServices(id);
    res.status(201).json({
      id: company!.id,
      name: company!.name,
      industry: company!.industry,
      notes: company!.notes,
      createdBy: company!.createdBy,
      createdAt: company!.createdAt.toISOString(),
      services: company!.services,
    });
  } catch (err) {
    req.log.error({ err }, "Create company error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requirePermission("companies", "update"), async (req: AuthRequest, res) => {
  try {
    const { name, industry, notes } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (industry !== undefined) update.industry = industry;
    if (notes !== undefined) update.notes = notes;

    await db.update(companiesTable).set(update).where(eq(companiesTable.id, req.params.id));

    const company = await getCompanyWithServices(req.params.id);
    if (!company) {
      res.status(404).json({ message: "Company not found" });
      return;
    }

    res.json({
      id: company.id,
      name: company.name,
      industry: company.industry,
      notes: company.notes,
      createdBy: company.createdBy,
      createdAt: company.createdAt.toISOString(),
      services: company.services,
    });
  } catch (err) {
    req.log.error({ err }, "Update company error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, requirePermission("companies", "delete"), async (req: AuthRequest, res) => {
  try {
    await db.delete(companiesTable).where(eq(companiesTable.id, req.params.id));
    res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete company error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
