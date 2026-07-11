import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { ilike } from "drizzle-orm";
import app from "../app";
import { db, linksTable } from "@workspace/db";

const TEST_PREFIX = "TEST_dashboard_";

afterAll(async () => {
  await db.delete(linksTable).where(ilike(linksTable.title, `${TEST_PREFIX}%`));
});

describe("GET /api/dashboard/summary", () => {
  it("reflects created, active, and expired links in the totals", async () => {
    const before = await request(app).get("/api/dashboard/summary");
    expect(before.status).toBe(200);

    await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}active`, originalUrl: "https://example.com/active" });

    const expired = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}expired`,
      originalUrl: "https://example.com/expired",
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    });
    expect(expired.status).toBe(201);

    const after = await request(app).get("/api/dashboard/summary");
    expect(after.status).toBe(200);
    expect(after.body.totalLinks).toBeGreaterThanOrEqual(before.body.totalLinks + 2);
    expect(after.body.expiredLinks).toBeGreaterThanOrEqual(before.body.expiredLinks + 1);
    expect(after.body.activeLinks).toBeGreaterThanOrEqual(before.body.activeLinks + 1);
  });
});
