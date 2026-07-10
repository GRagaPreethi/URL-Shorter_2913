import { Router, type IRouter } from "express";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, clicksTable, linksTable } from "@workspace/db";
import { GetLinkAnalyticsParams, GetLinkAnalyticsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function groupCounts(linkId: number, column: "browser" | "operatingSystem" | "device" | "country" | "referrer") {
  const columnRef = {
    browser: clicksTable.browser,
    operatingSystem: clicksTable.operatingSystem,
    device: clicksTable.device,
    country: clicksTable.country,
    referrer: clicksTable.referrer,
  }[column];

  const rows = await db
    .select({ name: columnRef, count: sql<number>`count(*)::int` })
    .from(clicksTable)
    .where(eq(clicksTable.linkId, linkId))
    .groupBy(columnRef)
    .orderBy(sql`count(*) desc`);

  return rows;
}

router.get("/analytics/:id", async (req, res): Promise<void> => {
  const params = GetLinkAnalyticsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { id } = params.data;

  const [link] = await db
    .select()
    .from(linksTable)
    .where(and(eq(linksTable.id, id), isNull(linksTable.deletedAt)));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  const dailyRows = await db
    .select({
      name: sql<string>`to_char(${clicksTable.clickedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(clicksTable)
    .where(eq(clicksTable.linkId, id))
    .groupBy(sql`to_char(${clicksTable.clickedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${clicksTable.clickedAt}, 'YYYY-MM-DD') asc`);

  const [browsers, devices, countries, referrers] = await Promise.all([
    groupCounts(id, "browser"),
    groupCounts(id, "device"),
    groupCounts(id, "country"),
    groupCounts(id, "referrer"),
  ]);

  res.json(
    GetLinkAnalyticsResponse.parse({
      linkId: id,
      totalClicks: link.clickCount,
      dailyClicks: dailyRows,
      browsers,
      devices,
      countries,
      referrers,
    }),
  );
});

export default router;
