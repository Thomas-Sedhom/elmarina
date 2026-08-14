import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import type { InsertSheetEntry, InsertUser, User } from "@shared/types";
import { ENV } from "./_core/env";
import { getMongo, nextId, ensureCounterAtLeast, ensureCounterDocuments } from "./mongo";
import { BrokerAccountModel, SheetEntryModel, UserModel } from "./mongoModels";

export async function getDb() {
  return getMongo();
}

function normalizePhone(phone: string) { return phone.replace(/[\s()-]/g, ""); }
function decimal(value: unknown) { return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0"); }
function mongoDecimal(value: string | number) { return mongoose.Types.Decimal128.fromString(String(value)); }
function signedAmount(type: "work" | "breakage", value: string) { return type === "work" ? Number(value) : -Number(value); }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function toUser(doc: any): User {
  return {
    id: doc.id,
    openId: doc.openId,
    name: doc.name ?? null,
    phone: doc.phone ?? null,
    passwordHash: doc.passwordHash ?? null,
    email: doc.email ?? null,
    loginMethod: doc.loginMethod ?? "phone",
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastSignedIn: doc.lastSignedIn,
  };
}

function toBroker(doc: any, user: any) {
  return {
    id: doc.id,
    userId: user.id,
    name: user.name,
    phone: user.phone,
    totalWeight: decimal(doc.totalWeight),
    totalCash: decimal(doc.totalCash),
  };
}

function toEntry(doc: any) {
  return {
    id: doc.id,
    brokerAccountId: doc.brokerAccountId,
    businessDate: doc.businessDate,
    weight: decimal(doc.weight),
    description: doc.description,
    cash: decimal(doc.cash),
    notes: doc.notes ?? null,
    type: doc.type,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
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
  await getMongo();
  const existing = await UserModel.findOne({ openId: user.openId }).select("+passwordHash");
  const update: Record<string, unknown> = { lastSignedIn: user.lastSignedIn ?? new Date() };
  if (user.name !== undefined) update.name = user.name;
  if (user.phone !== undefined) update.phone = user.phone;
  if (user.email !== undefined) update.email = user.email;
  if (user.loginMethod !== undefined) update.loginMethod = user.loginMethod;
  if (user.passwordHash !== undefined) update.passwordHash = user.passwordHash;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) update.role = user.role ?? "admin";
  if (existing) {
    await UserModel.updateOne({ id: existing.id }, { $set: update });
    return;
  }
  const id = await nextId("users");
  await UserModel.create({
    id,
    openId: user.openId,
    name: user.name ?? "User",
    phone: user.phone ?? null,
    passwordHash: user.passwordHash ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "phone",
    role: user.role ?? "broker",
    lastSignedIn: user.lastSignedIn ?? new Date(),
  });
}

export function toSafeUser(user: User) {
  const { passwordHash: _passwordHash, openId: _openId, ...safeUser } = user;
  return safeUser;
}

export async function getUserByOpenId(openId: string) {
  await getMongo();
  const result = await UserModel.findOne({ openId }).lean();
  return result ? toUser(result) : undefined;
}

export async function getUserByPhone(phone: string) {
  await getMongo();
  const result = await UserModel.findOne({ phone: normalizePhone(phone) }).select("+passwordHash").lean();
  return result ? toUser(result) : undefined;
}

export async function ensureSeedAdmin() {
  await getMongo();
  await ensureCounterDocuments();
  const phone = normalizePhone("01023999511");
  const seedOpenId = `local:${createHash("sha256").update(phone).digest("hex")}`;
  const passwordHash = hashPassword("Rm-24222682");
  const existing = await UserModel.findOne({ $or: [{ phone }, { openId: seedOpenId }] }).select("+passwordHash").lean();
  if (!existing) {
    const id = await nextId("users");
    await UserModel.create({ id, openId: seedOpenId, name: "سيدهم بسطوروس", phone, passwordHash, loginMethod: "phone", role: "admin" });
    console.log("[Auth] Seeded initial admin account in MongoDB");
    return;
  }
  await ensureCounterAtLeast("users", existing.id);
  await UserModel.updateOne({ id: existing.id }, { $set: { openId: seedOpenId, name: "سيدهم بسطوروس", phone, passwordHash, loginMethod: "phone", role: "admin" } });
}

export async function authenticateLocalUser(phone: string, password: string) {
  const user = await getUserByPhone(phone);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  await UserModel.updateOne({ id: user.id }, { $set: { lastSignedIn: new Date() } });
  return user;
}

export async function listBrokers(search?: string) {
  await getMongo();
  const accounts = await BrokerAccountModel.find().sort({ updatedAt: -1 }).lean();
  const userIds = accounts.map(account => account.userId);
  const users = await UserModel.find({ id: { $in: userIds }, role: "broker" }).lean();
  const byId = new Map(users.map(user => [user.id, user]));
  const normalizedSearch = search?.trim();
  return accounts.map(account => {
    const user = byId.get(account.userId);
    return user ? toBroker(account, user) : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item)).filter(item => {
    if (!normalizedSearch) return true;
    const pattern = new RegExp(escapeRegex(normalizedSearch), "i");
    return pattern.test(item.name ?? "") || pattern.test(item.phone ?? "");
  });
}

export async function getBrokerAccount(id: number) {
  await getMongo();
  const account = await BrokerAccountModel.findOne({ id }).lean();
  if (!account) return undefined;
  const user = await UserModel.findOne({ id: account.userId }).lean();
  return user ? toBroker(account, user) : undefined;
}

export async function createBroker(input: { name: string; phone: string; password: string }) {
  await getMongo();
  await ensureCounterDocuments();
  const phone = normalizePhone(input.phone);
  return mongoose.connection.transaction(async session => {
    const existing = await UserModel.findOne({ phone }).session(session);
    if (existing) throw new Error("PHONE_ALREADY_EXISTS");
    const userId = await nextId("users", session);
    const accountId = await nextId("brokerAccounts", session);
    await UserModel.create([{ id: userId, openId: `local:${createHash("sha256").update(`${phone}:${userId}`).digest("hex")}`, name: input.name.trim(), phone, passwordHash: hashPassword(input.password), loginMethod: "phone", role: "broker" }], { session });
    await BrokerAccountModel.create([{ id: accountId, userId, totalWeight: mongoDecimal("0"), totalCash: mongoDecimal("0") }], { session });
    return { id: accountId, userId };
  });
}

export function entryEffect(type: "work" | "breakage", weight: string, cash: string) { return { weight: signedAmount(type, weight), cash: signedAmount(type, cash) }; }
export function editEffectDelta(previous: { type: "work" | "breakage"; weight: string; cash: string }, next: { type: "work" | "breakage"; weight: string; cash: string }) {
  const oldEffect = entryEffect(previous.type, previous.weight, previous.cash);
  const newEffect = entryEffect(next.type, next.weight, next.cash);
  return { weight: newEffect.weight - oldEffect.weight, cash: newEffect.cash - oldEffect.cash };
}
export function deleteEffectReversal(entry: { type: "work" | "breakage"; weight: string; cash: string }) { const effect = entryEffect(entry.type, entry.weight, entry.cash); return { weight: -effect.weight, cash: -effect.cash }; }

export async function listSheetEntries(brokerAccountId: number) {
  await getMongo();
  const rows = await SheetEntryModel.find({ brokerAccountId }).sort({ businessDate: -1, id: -1 }).lean();
  return rows.map(toEntry);
}

async function updateTotals(accountId: number, delta: { weight: number; cash: number }, session: ClientSession) {
  const result = await BrokerAccountModel.updateOne({ id: accountId }, { $inc: { totalWeight: mongoDecimal(String(delta.weight)), totalCash: mongoDecimal(String(delta.cash)) } }, { session });
  if (result.matchedCount !== 1) throw new Error("BROKER_ACCOUNT_NOT_FOUND");
}

export async function createSheetEntry(input: Omit<InsertSheetEntry, "id" | "createdAt" | "updatedAt">) {
  await getMongo();
  await ensureCounterDocuments();
  return mongoose.connection.transaction(async session => {
    const entryId = await nextId("sheetEntries", session);
    await SheetEntryModel.create([{ id: entryId, brokerAccountId: input.brokerAccountId, businessDate: input.businessDate, weight: mongoDecimal(String(input.weight)), description: input.description, cash: mongoDecimal(String(input.cash)), notes: input.notes ?? null, type: input.type, createdBy: input.createdBy, updatedBy: input.updatedBy }], { session });
    await updateTotals(input.brokerAccountId, entryEffect(input.type, String(input.weight), String(input.cash)), session);
    return entryId;
  });
}

export async function updateSheetEntry(id: number, input: Omit<InsertSheetEntry, "id" | "createdAt" | "updatedAt">) {
  await getMongo();
  return mongoose.connection.transaction(async session => {
    const previous = await SheetEntryModel.findOne({ id }).session(session).lean();
    if (!previous) throw new Error("ENTRY_NOT_FOUND");
    if (previous.brokerAccountId !== input.brokerAccountId) throw new Error("BROKER_ACCOUNT_CANNOT_CHANGE");
    await SheetEntryModel.updateOne({ id }, { $set: { businessDate: input.businessDate, weight: mongoDecimal(String(input.weight)), description: input.description, cash: mongoDecimal(String(input.cash)), notes: input.notes ?? null, type: input.type, updatedBy: input.updatedBy } }, { session });
    await updateTotals(input.brokerAccountId, editEffectDelta({ type: previous.type, weight: decimal(previous.weight), cash: decimal(previous.cash) }, { type: input.type, weight: String(input.weight), cash: String(input.cash) }), session);
  });
}

export async function deleteSheetEntry(id: number) {
  await getMongo();
  return mongoose.connection.transaction(async session => {
    const previous = await SheetEntryModel.findOne({ id }).session(session).lean();
    if (!previous) throw new Error("ENTRY_NOT_FOUND");
    await SheetEntryModel.deleteOne({ id }).session(session);
    await updateTotals(previous.brokerAccountId, deleteEffectReversal({ type: previous.type, weight: decimal(previous.weight), cash: decimal(previous.cash) }), session);
  });
}
