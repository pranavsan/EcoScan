import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListReportsQueryParams,
  ListReportsResponse,
  CreateReportBody,
  GetReportParams,
  GetReportResponse,
  UpdateReportParams,
  UpdateReportBody,
  UpdateReportResponse,
  DeleteReportParams,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports", async (req, res): Promise<void> => {
  const parsed = ListReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { area, wasteType, status, limit } = parsed.data;

  let query = db.select().from(reportsTable).$dynamic();

  if (area) {
    query = query.where(eq(reportsTable.area, area));
  }
  if (wasteType) {
    query = query.where(eq(reportsTable.wasteType, wasteType));
  }
  if (status) {
    query = query.where(eq(reportsTable.status, status));
  }

  const rows = await query
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit ?? 100);

  res.json(ListReportsResponse.parse(rows));
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .insert(reportsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(GetReportResponse.parse(report));
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetReportResponse.parse(report));
});

router.patch("/reports/:id", async (req, res): Promise<void> => {
  const params = UpdateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateReportBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [report] = await db
    .update(reportsTable)
    .set(body.data)
    .where(eq(reportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(UpdateReportResponse.parse(report));
});

router.delete("/reports/:id", async (req, res): Promise<void> => {
  const params = DeleteReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .delete(reportsTable)
    .where(eq(reportsTable.id, params.data.id))
    .returning();

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
