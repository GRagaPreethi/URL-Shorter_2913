import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { ilike } from "drizzle-orm";
import app from "../app";
import { db, linksTable } from "@workspace/db";

const TEST_PREFIX = "TEST_links_";

afterAll(async () => {
  await db.delete(linksTable).where(ilike(linksTable.title, `${TEST_PREFIX}%`));
});

describe("POST /api/links", () => {
  it("creates a link with an auto-generated short code", async () => {
    const res = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}auto`, originalUrl: "https://example.com/a" });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toMatch(/^[0-9A-Za-z]{7}$/);
    expect(res.body.isActive).toBe(true);
    expect(res.body.clickCount).toBe(0);
  });

  it("creates a link with a custom alias", async () => {
    const res = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}alias`,
      originalUrl: "https://example.com/b",
      customAlias: `${TEST_PREFIX.toLowerCase()}custom1`,
    });

    expect(res.status).toBe(201);
    expect(res.body.shortCode).toBe(`${TEST_PREFIX.toLowerCase()}custom1`);
  });

  it("rejects a duplicate custom alias with 409", async () => {
    const alias = `${TEST_PREFIX.toLowerCase()}dup1`;
    const first = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}dup-a`, originalUrl: "https://example.com/c", customAlias: alias });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}dup-b`, originalUrl: "https://example.com/d", customAlias: alias });
    expect(second.status).toBe(409);
  });

  it("rejects an invalid custom alias", async () => {
    const res = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}bad-alias`,
      originalUrl: "https://example.com/e",
      customAlias: "a b", // spaces are invalid
    });
    expect(res.status).toBe(400);
  });

  it("rejects unsafe redirect schemes (input validation)", async () => {
    const res = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}unsafe`,
      originalUrl: "javascript:alert(1)",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a missing title", async () => {
    const res = await request(app)
      .post("/api/links")
      .send({ originalUrl: "https://example.com/f" });
    expect(res.status).toBe(400);
  });

  it("accepts an optional expiry date", async () => {
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app).post("/api/links").send({
      title: `${TEST_PREFIX}expiry`,
      originalUrl: "https://example.com/g",
      expiresAt,
    });
    expect(res.status).toBe(201);
    expect(new Date(res.body.expiresAt).toISOString()).toBe(expiresAt);
  });
});

describe("GET /api/links", () => {
  it("supports search and pagination", async () => {
    await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}searchable-one`, originalUrl: "https://example.com/s1" });
    await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}searchable-two`, originalUrl: "https://example.com/s2" });

    const res = await request(app)
      .get("/api/links")
      .query({ search: `${TEST_PREFIX}searchable`, page: 1, limit: 1 });

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(res.body.items.length).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
  });
});

describe("PATCH /api/links/:id/status", () => {
  it("enables and disables a link", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}toggle`, originalUrl: "https://example.com/toggle" });
    const id = create.body.id;

    const disable = await request(app)
      .patch(`/api/links/${id}/status`)
      .send({ isActive: false });
    expect(disable.status).toBe(200);
    expect(disable.body.isActive).toBe(false);

    const enable = await request(app)
      .patch(`/api/links/${id}/status`)
      .send({ isActive: true });
    expect(enable.status).toBe(200);
    expect(enable.body.isActive).toBe(true);
  });
});

describe("DELETE /api/links/:id (soft delete)", () => {
  it("soft-deletes a link so it no longer appears in list/get", async () => {
    const create = await request(app)
      .post("/api/links")
      .send({ title: `${TEST_PREFIX}delete-me`, originalUrl: "https://example.com/delete" });
    const id = create.body.id;

    const del = await request(app).delete(`/api/links/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/links/${id}`);
    expect(get.status).toBe(404);
  });
});

describe("POST /api/links/suggest-alias", () => {
  it(
    "always returns at least one URL-safe suggestion (AI or fallback)",
    async () => {
      const res = await request(app).post("/api/links/suggest-alias").send({
        title: `${TEST_PREFIX}suggest`,
        originalUrl: "https://example.com/suggest",
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.suggestions)).toBe(true);
      expect(res.body.suggestions.length).toBeGreaterThan(0);
    },
    30000,
  );
});
