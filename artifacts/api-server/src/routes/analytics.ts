import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import {
  GetWasteTypeStatsQueryParams,
  GetWasteTypeStatsResponse,
  GetHotspotsResponse,
  GetTrendsQueryParams,
  GetTrendsResponse,
  GetAnalyticsSummaryResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analytics/waste-types", async (req, res): Promise<void> => {
  const parsed = GetWasteTypeStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { area } = parsed.data;

  let baseQuery = db
    .select({
      wasteType: reportsTable.wasteType,
      count: sql<number>`count(*)::int`,
    })
    .from(reportsTable)
    .$dynamic();

  if (area) {
    baseQuery = baseQuery.where(eq(reportsTable.area, area));
  }

  const rows = await baseQuery.groupBy(reportsTable.wasteType).orderBy(sql`count(*) desc`);

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const stats = rows.map((r) => ({
    wasteType: r.wasteType,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100 * 10) / 10 : 0,
  }));

  res.json(GetWasteTypeStatsResponse.parse(stats));
});

router.get("/analytics/hotspots", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      area: reportsTable.area,
      count: sql<number>`count(*)::int`,
      topWasteType: sql<string>`mode() within group (order by ${reportsTable.wasteType})`,
      pendingCount: sql<number>`count(*) filter (where ${reportsTable.status} = 'pending')::int`,
      latitude: sql<number | null>`avg(${reportsTable.latitude})`,
      longitude: sql<number | null>`avg(${reportsTable.longitude})`,
    })
    .from(reportsTable)
    .groupBy(reportsTable.area)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  res.json(GetHotspotsResponse.parse(rows));
});

router.get("/analytics/trends", async (req, res): Promise<void> => {
  const parsed = GetTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const days = parsed.data.days ?? 30;

  const rows = await db
    .select({
      date: sql<string>`date(${reportsTable.createdAt})::text`,
      count: sql<number>`count(*)::int`,
      resolved: sql<number>`count(*) filter (where ${reportsTable.status} = 'resolved')::int`,
    })
    .from(reportsTable)
    .where(sql`${reportsTable.createdAt} >= now() - interval '${sql.raw(String(days))} days'`)
    .groupBy(sql`date(${reportsTable.createdAt})`)
    .orderBy(sql`date(${reportsTable.createdAt})`);

  res.json(GetTrendsResponse.parse(rows));
});

router.get("/analytics/summary", async (req, res): Promise<void> => {
  const [totals] = await db
    .select({
      totalReports: sql<number>`count(*)::int`,
      resolvedReports: sql<number>`count(*) filter (where ${reportsTable.status} = 'resolved')::int`,
      pendingReports: sql<number>`count(*) filter (where ${reportsTable.status} = 'pending')::int`,
      inProgressReports: sql<number>`count(*) filter (where ${reportsTable.status} = 'in_progress')::int`,
      reportsTodayCount: sql<number>`count(*) filter (where date(${reportsTable.createdAt}) = current_date)::int`,
    })
    .from(reportsTable);

  const [topWasteRow] = await db
    .select({ wasteType: reportsTable.wasteType })
    .from(reportsTable)
    .groupBy(reportsTable.wasteType)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  const [topAreaRow] = await db
    .select({ area: reportsTable.area })
    .from(reportsTable)
    .groupBy(reportsTable.area)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  const summary = {
    totalReports: totals?.totalReports ?? 0,
    resolvedReports: totals?.resolvedReports ?? 0,
    pendingReports: totals?.pendingReports ?? 0,
    inProgressReports: totals?.inProgressReports ?? 0,
    reportsTodayCount: totals?.reportsTodayCount ?? 0,
    topWasteType: topWasteRow?.wasteType ?? "N/A",
    topArea: topAreaRow?.area ?? "N/A",
  };

  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

export default router;
