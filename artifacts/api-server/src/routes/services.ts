import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "@workspace/db";
import { servicesTable, companiesTable, companyServicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requirePermission } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function getServiceWithCompanies(serviceId: string) {
  const service = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)).limit(1);
  if (!service[0]) return null;

  const companies = await db
    .select({ company: companiesTable })
    .from(companyServicesTable)
    .leftJoin(companiesTable, eq(companyServicesTable.companyId, companiesTable.id))
    .where(eq(companyServicesTable.serviceId, serviceId));

  return {
    ...service[0],
    companies: companies.map((c) => c.company).filter(Boolean).map((c) => ({ id: c!.id, name: c!.name })),
  };
}

router.get("/", requireAuth, requirePermission("services", "read"), async (req: AuthRequest, res) => {
  try {
    const services = await db.select().from(servicesTable).orderBy(servicesTable.name);
    const result = await Promise.all(services.map((s) => getServiceWithCompanies(s.id)));
    res.json(
      result.map((s) => ({
        id: s!.id,
        name: s!.name,
        category: s!.category,
        description: s!.description,
        createdBy: s!.createdBy,
        createdAt: s!.createdAt.toISOString(),
        companies: s!.companies,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get services error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", requireAuth, requirePermission("services", "create"), async (req: AuthRequest, res) => {
  try {
    const { name, category, description } = req.body;
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }

    const id = uuidv4();
    await db.insert(servicesTable).values({
      id,
      name,
      category: category || null,
      description: description || null,
      createdBy: req.user!.userId,
    });

    const service = await getServiceWithCompanies(id);
    res.status(201).json({
      id: service!.id,
      name: service!.name,
      category: service!.category,
      description: service!.description,
      createdBy: service!.createdBy,
      createdAt: service!.createdAt.toISOString(),
      companies: service!.companies,
    });
  } catch (err) {
    req.log.error({ err }, "Create service error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", requireAuth, requirePermission("services", "update"), async (req: AuthRequest, res) => {
  try {
    const { name, category, description } = req.body;
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (category !== undefined) update.category = category;
    if (description !== undefined) update.description = description;

    await db.update(servicesTable).set(update).where(eq(servicesTable.id, req.params.id));
    const service = await getServiceWithCompanies(req.params.id);
    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.json({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      createdBy: service.createdBy,
      createdAt: service.createdAt.toISOString(),
      companies: service.companies,
    });
  } catch (err) {
    req.log.error({ err }, "Update service error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, requirePermission("services", "delete"), async (req: AuthRequest, res) => {
  try {
    await db.delete(servicesTable).where(eq(servicesTable.id, req.params.id));
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete service error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id/companies", requireAuth, async (req: AuthRequest, res) => {
  try {
    const companies = await db
      .select({ company: companiesTable })
      .from(companyServicesTable)
      .leftJoin(companiesTable, eq(companyServicesTable.companyId, companiesTable.id))
      .where(eq(companyServicesTable.serviceId, req.params.id));

    res.json(
      companies.map((c) => ({
        id: c.company!.id,
        name: c.company!.name,
        industry: c.company!.industry,
        notes: c.company!.notes,
        createdBy: c.company!.createdBy,
        createdAt: c.company!.createdAt.toISOString(),
        services: [],
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get service companies error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id/companies", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { companyIds } = req.body;
    if (!Array.isArray(companyIds)) {
      res.status(400).json({ message: "companyIds must be an array" });
      return;
    }

    await db.delete(companyServicesTable).where(eq(companyServicesTable.serviceId, req.params.id));

    if (companyIds.length > 0) {
      await db.insert(companyServicesTable).values(
        companyIds.map((cId: string) => ({
          id: uuidv4(),
          serviceId: req.params.id,
          companyId: cId,
        }))
      );
    }

    res.json({ success: true, message: "Company links updated" });
  } catch (err) {
    req.log.error({ err }, "Link service companies error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
