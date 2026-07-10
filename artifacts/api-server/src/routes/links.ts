import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db, linksTable } from "@workspace/db";
import {
  CreateLinkBody,
  CreateLinkResponse,
  ListLinksQueryParams,
  ListLinksResponse,
  GetLinkParams,
  GetLinkResponse,
  UpdateLinkParams,
  UpdateLinkBody,
  UpdateLinkResponse,
  DeleteLinkParams,
  UpdateLinkStatusParams,
  UpdateLinkStatusBody,
  UpdateLinkStatusResponse,
  SuggestAliasBody,
  SuggestAliasResponse,
} from "@workspace/api-zod";
import { generateBase62Code, isValidAlias } from "../lib/shortCode";
import { fallbackAliasSuggestions } from "../lib/aliasSuggestion";
import { isSafeRedirectUrl } from "../lib/url";

const router: IRouter = Router();

async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateBase62Code();
    const [existing] = await db
      .select({ id: linksTable.id })
      .from(linksTable)
      .where(eq(linksTable.shortCode, code));
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique short code after 10 attempts");
}

router.get("/links", async (req, res): Promise<void> => {
  const query = ListLinksQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { search, page, limit } = query.data;

  const conditions = [isNull(linksTable.deletedAt)];
  if (search) {
    conditions.push(
      or(
        ilike(linksTable.title, `%${search}%`),
        ilike(linksTable.originalUrl, `%${search}%`),
        ilike(linksTable.shortCode, `%${search}%`),
      )!,
    );
  }
  const where = and(...conditions);

  const [{ count: total } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(linksTable)
    .where(where);

  const items = await db
    .select()
    .from(linksTable)
    .where(where)
    .orderBy(desc(linksTable.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  res.json(ListLinksResponse.parse({ items, total, page, limit }));
});

router.post("/links", async (req, res): Promise<void> => {
  const parsed = CreateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, originalUrl, customAlias, expiresAt } = parsed.data;

  if (!isSafeRedirectUrl(originalUrl)) {
    res.status(400).json({ error: "originalUrl must be a valid http(s) URL" });
    return;
  }

  let shortCode: string;
  if (customAlias) {
    if (!isValidAlias(customAlias)) {
      res.status(400).json({
        error:
          "Alias must be 3-40 characters and contain only letters, numbers, hyphens, or underscores",
      });
      return;
    }
    const [existing] = await db
      .select({ id: linksTable.id })
      .from(linksTable)
      .where(eq(linksTable.shortCode, customAlias));
    if (existing) {
      res.status(409).json({ error: "That alias is already taken" });
      return;
    }
    shortCode = customAlias;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  const [link] = await db
    .insert(linksTable)
    .values({
      title,
      originalUrl,
      shortCode,
      customAlias: customAlias ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  res.status(201).json(CreateLinkResponse.parse(link));
});

router.post("/links/suggest-alias", async (req, res): Promise<void> => {
  const parsed = SuggestAliasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, originalUrl } = parsed.data;
  const suggestions = fallbackAliasSuggestions(title, originalUrl);
  res.json(SuggestAliasResponse.parse({ suggestions }));
});

router.get("/links/:id", async (req, res): Promise<void> => {
  const params = GetLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [link] = await db
    .select()
    .from(linksTable)
    .where(
      and(eq(linksTable.id, params.data.id), isNull(linksTable.deletedAt)),
    );

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json(GetLinkResponse.parse(link));
});

router.put("/links/:id", async (req, res): Promise<void> => {
  const params = UpdateLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { expiresAt, ...rest } = parsed.data;
  if (rest.originalUrl !== undefined && !isSafeRedirectUrl(rest.originalUrl)) {
    res.status(400).json({ error: "originalUrl must be a valid http(s) URL" });
    return;
  }
  const updates: Partial<typeof linksTable.$inferInsert> = { ...rest };
  if (expiresAt !== undefined) {
    updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  }

  const [link] = await db
    .update(linksTable)
    .set(updates)
    .where(
      and(eq(linksTable.id, params.data.id), isNull(linksTable.deletedAt)),
    )
    .returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json(UpdateLinkResponse.parse(link));
});

router.patch("/links/:id/status", async (req, res): Promise<void> => {
  const params = UpdateLinkStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLinkStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [link] = await db
    .update(linksTable)
    .set({ isActive: parsed.data.isActive })
    .where(
      and(eq(linksTable.id, params.data.id), isNull(linksTable.deletedAt)),
    )
    .returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json(UpdateLinkStatusResponse.parse(link));
});

router.delete("/links/:id", async (req, res): Promise<void> => {
  const params = DeleteLinkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [link] = await db
    .update(linksTable)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(linksTable.id, params.data.id), isNull(linksTable.deletedAt)),
    )
    .returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
