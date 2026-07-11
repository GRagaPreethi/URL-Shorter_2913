import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { ilike, inArray } from "drizzle-orm";
import app from "../app";
import { db, linksTable, clicksTable } from "@workspace/db";

const TEST_PREFIX = "TEST_analytics_";

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

describe("GET /api/analytics/:id", () => {
  it("aggregates clicks by browser, device, country, and referrer", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}link`, originalUrl: "https://example.com/analytics" });
    const id = create.body.id;

    await db.insert(clicksTable).values([
      {
        linkId: id,
        browser: "Chrome",
        operatingSystem: "Windows",
        device: "desktop",
        country: "United States",
        referrer: "https://twitter.com",
        ipAddress: "203.0.113.1",
      },
      {
        linkId: id,
        browser: "Safari",
        operatingSystem: "iOS",
        device: "mobile",
        country: "Germany",
        referrer: "Direct",
        ipAddress: "203.0.113.2",
      },
    ]);
    await db
      .update(linksTable)
      .set({ clickCount: 2 })
      .where(ilike(linksTable.title, `${TEST_PREFIX}link`));

    const res = await request(app).get(`/api/analytics/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.linkId).toBe(id);
    expect(res.body.totalClicks).toBe(2);
    expect(res.body.browsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Chrome", count: 1 }),
        expect.objectContaining({ name: "Safari", count: 1 }),
      ]),
    );
    expect(res.body.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "desktop", count: 1 }),
        expect.objectContaining({ name: "mobile", count: 1 }),
      ]),
    );
    expect(res.body.countries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "United States", count: 1 }),
        expect.objectContaining({ name: "Germany", count: 1 }),
      ]),
    );
    expect(res.body.referrers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "https://twitter.com", count: 1 }),
        expect.objectContaining({ name: "Direct", count: 1 }),
      ]),
    );
  });

  it("returns 404 for a soft-deleted link", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}deleted`, originalUrl: "https://example.com/deleted" });
    const id = create.body.id;

    await request(app).delete(`/api/links/${id}`);

    const res = await request(app).get(`/api/analytics/${id}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for a nonexistent link", async () => {
    const res = await request(app).get("/api/analytics/999999999");
    expect(res.status).toBe(404);
  });
});
