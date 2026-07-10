import { Router, type IRouter } from "express";
import { UAParser } from "ua-parser-js";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, clicksTable, linksTable } from "@workspace/db";
import { lookupCountry } from "../lib/geo";

const router: IRouter = Router();

router.get("/r/:shortCode", async (req, res): Promise<void> => {
  const raw = req.params.shortCode;
  const shortCode = Array.isArray(raw) ? raw[0] : raw;

  const [link] = await db
    .select()
    .from(linksTable)
    .where(and(eq(linksTable.shortCode, shortCode!), isNull(linksTable.deletedAt)));

  if (!link) {
    res.status(404).send("Short link not found");
    return;
  }
  if (!link.isActive) {
    res.status(410).send("This link has been disabled");
    return;
  }
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    res.status(410).send("This link has expired");
    return;
  }

  // Redirect immediately -- analytics are recorded asynchronously afterward
  // so they never delay the response.
  res.redirect(302, link.originalUrl);

  void (async () => {
    try {
      const ua = new UAParser(req.headers["user-agent"] ?? "");
      const uaResult = ua.getResult();
      const ipAddress =
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
        req.socket.remoteAddress ??
        "unknown";

      await Promise.all([
        db.insert(clicksTable).values({
          linkId: link.id,
          browser: uaResult.browser.name ?? "Unknown",
          operatingSystem: uaResult.os.name ?? "Unknown",
          device: uaResult.device.type ?? "Desktop",
          country: lookupCountry(ipAddress),
          referrer: req.headers["referer"] ?? "Direct",
          ipAddress,
        }),
        db
          .update(linksTable)
          .set({ clickCount: sql`${linksTable.clickCount} + 1` })
          .where(eq(linksTable.id, link.id)),
      ]);
    } catch (err) {
      req.log.error({ err }, "Failed to record click analytics");
    }
  })();
});

export default router;
