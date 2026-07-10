import { Router, type IRouter } from "express";
import { and, eq, gt, isNull, isNotNull, lt, sql } from "drizzle-orm";
import { db, linksTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();

  const [totals] = await db
    .select({
      totalLinks: sql<number>`count(*)::int`,
      totalClicks: sql<number>`coalesce(sum(${linksTable.clickCount}), 0)::int`,
    })
    .from(linksTable)
    .where(isNull(linksTable.deletedAt));

  const [active] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(linksTable)
    .where(
      and(
        isNull(linksTable.deletedAt),
        eq(linksTable.isActive, true),
        sql`(${linksTable.expiresAt} is null or ${linksTable.expiresAt} > ${now})`,
      ),
    );

  const [expired] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(linksTable)
    .where(
      and(
        isNull(linksTable.deletedAt),
        isNotNull(linksTable.expiresAt),
        lt(linksTable.expiresAt, now),
      ),
    );

  res.json(
    GetDashboardSummaryResponse.parse({
      totalLinks: totals?.totalLinks ?? 0,
      totalClicks: totals?.totalClicks ?? 0,
      activeLinks: active?.count ?? 0,
      expiredLinks: expired?.count ?? 0,
    }),
  );
});

export default router;
