import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  brokerAccounts,
  InsertUser,
  User,
  InsertSheetEntry,
  sheetEntries,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, encoded: string | null) {
  if (!encoded) return false;
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function upsertUser(user: Partial<InsertUser> & Pick<InsertUser, "openId">): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? "User",
    phone: user.phone ?? null,
    passwordHash: user.passwordHash ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "oauth",
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "broker"),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  if (user.name !== undefined) updateSet.name = user.name;
  if (user.phone !== undefined) updateSet.phone = user.phone;
  if (user.email !== undefined) updateSet.email = user.email;
  if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
  if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) updateSet.role = values.role;

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export function toSafeUser(user: User) {
  const { passwordHash: _passwordHash, openId: _openId, ...safeUser } = user;
  return safeUser;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.phone, normalizePhone(phone))).limit(1);
  return result[0];
}

export async function ensureSeedAdmin() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Skipping admin seed because DATABASE_URL is unavailable");
    return;
  }
  const phone = normalizePhone("01023999511");
  const seedOpenId = `local:${createHash("sha256").update(phone).digest("hex")}`;
  const existing = (await getUserByPhone(phone)) ?? (await getUserByOpenId(seedOpenId));
  const passwordHash = hashPassword("Rm-24222682");

  if (!existing) {
    await db.insert(users).values({
      openId: seedOpenId,
      name: "سيدهم بسطوروس",
      phone,
      passwordHash,
      loginMethod: "phone",
      role: "admin",
    });
    console.log("[Auth] Seeded initial admin account");
  } else if (existing.role !== "admin" || existing.name !== "سيدهم بسطوروس" || existing.phone !== phone || !existing.passwordHash) {
    await db.update(users).set({ name: "سيدهم بسطوروس", phone, passwordHash, loginMethod: "phone", role: "admin" }).where(eq(users.id, existing.id));
  }
}

export async function authenticateLocalUser(phone: string, password: string) {
  const user = await getUserByPhone(phone);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  const db = await getDb();
  if (db) await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return user;
}

export async function listBrokers(search?: string) {
  const db = await getDb();
  if (!db) return [];
  const filter = search?.trim()
    ? or(like(users.name, `%${search.trim()}%`), like(users.phone, `%${normalizePhone(search)}%`))
    : undefined;
  return db
    .select({
      id: brokerAccounts.id,
      userId: users.id,
      name: users.name,
      phone: users.phone,
      totalWeight: brokerAccounts.totalWeight,
      totalCash: brokerAccounts.totalCash,
    })
    .from(brokerAccounts)
    .innerJoin(users, eq(users.id, brokerAccounts.userId))
    .where(filter ? and(eq(users.role, "broker"), filter) : eq(users.role, "broker"))
    .orderBy(desc(brokerAccounts.updatedAt));
}

export async function getBrokerAccount(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      id: brokerAccounts.id,
      userId: users.id,
      name: users.name,
      phone: users.phone,
      totalWeight: brokerAccounts.totalWeight,
      totalCash: brokerAccounts.totalCash,
    })
    .from(brokerAccounts)
    .innerJoin(users, eq(users.id, brokerAccounts.userId))
    .where(eq(brokerAccounts.id, id))
    .limit(1);
  return result[0];
}

export async function createBroker(input: { name: string; phone: string; password: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const phone = normalizePhone(input.phone);
  return db.transaction(async tx => {
    const existing = await tx.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1);
    if (existing[0]) throw new Error("PHONE_ALREADY_EXISTS");
    const userResult = await tx.insert(users).values({
      openId: `local:${createHash("sha256").update(`${phone}:${Date.now()}`).digest("hex")}`,
      name: input.name.trim(),
      phone,
      passwordHash: hashPassword(input.password),
      loginMethod: "phone",
      role: "broker",
    });
    const userId = Number(userResult[0].insertId);
    const accountResult = await tx.insert(brokerAccounts).values({ userId });
    return { id: Number(accountResult[0].insertId), userId };
  });
}

export function signedAmount(type: "work" | "breakage", value: string) {
  return type === "work" ? value : `-${value}`;
}

export function entryEffect(type: "work" | "breakage", weight: string, cash: string) {
  return { weight: Number(signedAmount(type, weight)), cash: Number(signedAmount(type, cash)) };
}

export function editEffectDelta(previous: { type: "work" | "breakage"; weight: string; cash: string }, next: { type: "work" | "breakage"; weight: string; cash: string }) {
  const oldEffect = entryEffect(previous.type, previous.weight, previous.cash);
  const newEffect = entryEffect(next.type, next.weight, next.cash);
  return { weight: newEffect.weight - oldEffect.weight, cash: newEffect.cash - oldEffect.cash };
}

export function deleteEffectReversal(entry: { type: "work" | "breakage"; weight: string; cash: string }) {
  const effect = entryEffect(entry.type, entry.weight, entry.cash);
  return { weight: -effect.weight, cash: -effect.cash };
}

export async function listSheetEntries(brokerAccountId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sheetEntries).where(eq(sheetEntries.brokerAccountId, brokerAccountId)).orderBy(desc(sheetEntries.businessDate), desc(sheetEntries.id));
}

export async function createSheetEntry(input: Omit<InsertSheetEntry, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const inserted = await tx.insert(sheetEntries).values(input);
    await tx.update(brokerAccounts).set({
      totalWeight: sql`${brokerAccounts.totalWeight} + ${signedAmount(input.type, input.weight as string)}`,
      totalCash: sql`${brokerAccounts.totalCash} + ${signedAmount(input.type, input.cash as string)}`,
    }).where(eq(brokerAccounts.id, input.brokerAccountId));
    return Number(inserted[0].insertId);
  });
}

export async function updateSheetEntry(id: number, input: Omit<InsertSheetEntry, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const previousResult = await tx.select().from(sheetEntries).where(eq(sheetEntries.id, id)).limit(1);
    const previous = previousResult[0];
    if (!previous) throw new Error("ENTRY_NOT_FOUND");
    await tx.update(sheetEntries).set(input).where(eq(sheetEntries.id, id));
    await tx.update(brokerAccounts).set({
      totalWeight: sql`${brokerAccounts.totalWeight} + ${editEffectDelta({ type: previous.type, weight: previous.weight as string, cash: previous.cash as string }, { type: input.type, weight: input.weight as string, cash: input.cash as string }).weight}`,
      totalCash: sql`${brokerAccounts.totalCash} + ${editEffectDelta({ type: previous.type, weight: previous.weight as string, cash: previous.cash as string }, { type: input.type, weight: input.weight as string, cash: input.cash as string }).cash}`,
    }).where(eq(brokerAccounts.id, previous.brokerAccountId));
  });
}

export async function deleteSheetEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const previousResult = await tx.select().from(sheetEntries).where(eq(sheetEntries.id, id)).limit(1);
    const previous = previousResult[0];
    if (!previous) throw new Error("ENTRY_NOT_FOUND");
    await tx.delete(sheetEntries).where(eq(sheetEntries.id, id));
    await tx.update(brokerAccounts).set({
      totalWeight: sql`${brokerAccounts.totalWeight} + ${deleteEffectReversal({ type: previous.type, weight: previous.weight as string, cash: previous.cash as string }).weight}`,
      totalCash: sql`${brokerAccounts.totalCash} + ${deleteEffectReversal({ type: previous.type, weight: previous.weight as string, cash: previous.cash as string }).cash}`,
    }).where(eq(brokerAccounts.id, previous.brokerAccountId));
  });
}
