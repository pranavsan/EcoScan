import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ListAreasResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/areas", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      name: reportsTable.area,
      reportCount: sql<number>`count(*)::int`,
      latitude: sql<number | null>`avg(${reportsTable.latitude})`,
      longitude: sql<number | null>`avg(${reportsTable.longitude})`,
    })
    .from(reportsTable)
    .groupBy(reportsTable.area)
    .orderBy(sql`count(*) desc`);

  res.json(ListAreasResponse.parse(rows));
});

export default router;
