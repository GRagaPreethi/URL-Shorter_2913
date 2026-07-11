import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { ilike, inArray } from "drizzle-orm";
import app from "../app";
import { db, linksTable, clicksTable } from "@workspace/db";

const TEST_PREFIX = "TEST_redirect_";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterAll(async () => {
  const rows = await db
    .select({ id: linksTable.id })
    .from(linksTable)
    .where(ilike(linksTable.title, `${TEST_PREFIX}%`));
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    await db.delete(clicksTable).where(inArray(clicksTable.linkId, ids));
  }
  await db.delete(linksTable).where(ilike(linksTable.title, `${TEST_PREFIX}%`));
});

describe("GET /api/r/:shortCode", () => {
  it("redirects to the original URL and records a click asynchronously", async () => {
    const create = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}active`,
      originalUrl: "https://example.com/redirect-target",
    });
    const { shortCode, id } = create.body;

    const res = await request(app)
      .get(`/api/r/${shortCode}`)
      .set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0")
      .set("Referer", "https://example.com/source");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com/redirect-target");

    await wait(500);
    const analytics = await request(app).get(`/api/analytics/${id}`);
    expect(analytics.body.totalClicks).toBeGreaterThanOrEqual(1);
    expect(analytics.body.browsers.length).toBeGreaterThan(0);
  });

  it("returns 404 for an unknown short code", async () => {
    const res = await request(app).get("/api/r/does-not-exist-code");
    expect(res.status).toBe(404);
  });

  it("returns 410 for a disabled link", async () => {
    const create = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}disabled`,
      originalUrl: "https://example.com/disabled",
    });
    await request(app)
      .patch(`/api/links/${create.body.id}/status`)
      .send({ isActive: false });

    const res = await request(app).get(`/api/r/${create.body.shortCode}`);
    expect(res.status).toBe(410);
  });

  it("returns 410 for an expired link", async () => {
    const create = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}expired`,
      originalUrl: "https://example.com/expired-redirect",
      expiresAt: new Date(Date.now() - 60000).toISOString(),
    });

    const res = await request(app).get(`/api/r/${create.body.shortCode}`);
    expect(res.status).toBe(410);
  });
});
