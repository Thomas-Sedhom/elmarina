import { describe, expect, it } from "vitest";
import { deleteEffectReversal, editEffectDelta, entryEffect } from "./db";
import { canUserViewBrokerAccount } from "./routers";
import type { User } from "../drizzle/schema";

const user = (id: number, role: User["role"]): User => ({
  id,
  openId: `local:${id}`,
  name: `User ${id}`,
  phone: `0100000000${id}`,
  passwordHash: null,
  email: null,
  loginMethod: "phone",
  role,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

describe("sheet entry accounting rules", () => {
  it("adds work entries to both totals", () => {
    expect(entryEffect("work", "12.500", "1500.00")).toEqual({ weight: 12.5, cash: 1500 });
  });

  it("subtracts breakage entries from both totals", () => {
    expect(entryEffect("breakage", "2.250", "300.00")).toEqual({ weight: -2.25, cash: -300 });
  });

  it("applies only the delta when an entry changes", () => {
    expect(editEffectDelta(
      { type: "work", weight: "10.000", cash: "1000.00" },
      { type: "breakage", weight: "3.000", cash: "250.00" }
    )).toEqual({ weight: -13, cash: -1250 });
  });

  it("reverses the exact effect when an entry is deleted", () => {
    expect(deleteEffectReversal({ type: "breakage", weight: "2.500", cash: "400.00" })).toEqual({ weight: 2.5, cash: 400 });
  });

  it("rejects a broker from viewing another broker account", () => {
    expect(() => canUserViewBrokerAccount(user(7, "broker"), { userId: 8 })).toThrowError(/only view your own account/);
    expect(() => canUserViewBrokerAccount(user(7, "broker"), { userId: 7 })).not.toThrow();
    expect(() => canUserViewBrokerAccount(user(1, "admin"), { userId: 8 })).not.toThrow();
  });
});

import { vi } from "vitest";
import { appRouter } from "./routers";
import * as database from "./db";

const adminContext = {
  user: user(1, "admin"),
  req: { protocol: "https", headers: {} } as any,
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as any,
};

describe("sheet entry backend procedures", () => {
  it("guards and maps create through the admin procedure", async () => {
    const createSpy = vi.spyOn(database, "createSheetEntry").mockResolvedValue(101);
    const caller = appRouter.createCaller(adminContext);
    await caller.sheetEntries.create({ brokerAccountId: 4, businessDate: "2026-08-14T00:00:00.000Z", weight: "2.500", description: "خاتم", cash: "900.00", notes: null, type: "work" });
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 1, updatedBy: 1, brokerAccountId: 4, type: "work" }));
    createSpy.mockRestore();
  });

  it("routes update and delete through the protected admin mutations", async () => {
    const updateSpy = vi.spyOn(database, "updateSheetEntry").mockResolvedValue(undefined);
    const deleteSpy = vi.spyOn(database, "deleteSheetEntry").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(adminContext);
    await caller.sheetEntries.update({ id: 9, brokerAccountId: 4, businessDate: "2026-08-14T00:00:00.000Z", weight: "1.000", description: "سلسلة", cash: "500.00", notes: null, type: "breakage" });
    await caller.sheetEntries.delete({ id: 9 });
    expect(updateSpy).toHaveBeenCalledWith(9, expect.objectContaining({ updatedBy: 1, type: "breakage" }));
    expect(deleteSpy).toHaveBeenCalledWith(9);
    updateSpy.mockRestore();
    deleteSpy.mockRestore();
  });

  it("rejects a broker attempting to access a different account through the procedure", async () => {
    const accountSpy = vi.spyOn(database, "getBrokerAccount").mockResolvedValue({ id: 4, userId: 8, name: "Other", phone: "010", totalWeight: "0", totalCash: "0" });
    const caller = appRouter.createCaller({ ...adminContext, user: user(7, "broker") });
    await expect(caller.brokers.get({ id: 4 })).rejects.toThrowError(/only view your own account/);
    accountSpy.mockRestore();
  });
});

import { and, eq } from "drizzle-orm";
import { brokerAccounts, sheetEntries, users } from "../drizzle/schema";

describe.skipIf(!process.env.DATABASE_URL)("real transactional ledger flows", () => {
  it("persists work/breakage, applies edit delta, and reverses delete", async () => {
    const database = await import("./db");
    const dbConnection = await database.getDb();
    if (!dbConnection) throw new Error("DATABASE_URL is required for integration coverage");
    const phone = `011${Date.now().toString().slice(-8)}`;
    let accountId: number | undefined;
    let userId: number | undefined;
    try {
      const broker = await database.createBroker({ name: "اختبار تكاملي", phone, password: "TestPass123" });
      accountId = broker.id;
      userId = broker.userId;
      const base = { brokerAccountId: accountId, businessDate: new Date("2026-08-14T00:00:00.000Z"), description: "اختبار", notes: null, createdBy: userId, updatedBy: userId } as const;
      const workId = await database.createSheetEntry({ ...base, weight: "10.000", cash: "1000.00", type: "work" });
      const afterWork = await database.getBrokerAccount(accountId);
      expect(Number(afterWork?.totalWeight)).toBe(10);
      expect(Number(afterWork?.totalCash)).toBe(1000);
      const breakageId = await database.createSheetEntry({ ...base, weight: "2.000", cash: "250.00", type: "breakage" });
      const afterBreakage = await database.getBrokerAccount(accountId);
      expect(Number(afterBreakage?.totalWeight)).toBe(8);
      expect(Number(afterBreakage?.totalCash)).toBe(750);
      await database.updateSheetEntry(workId, { ...base, weight: "12.000", cash: "1200.00", type: "work" });
      const afterEdit = await database.getBrokerAccount(accountId);
      expect(Number(afterEdit?.totalWeight)).toBe(10);
      expect(Number(afterEdit?.totalCash)).toBe(950);
      await database.deleteSheetEntry(breakageId);
      const afterDelete = await database.getBrokerAccount(accountId);
      expect(Number(afterDelete?.totalWeight)).toBe(12);
      expect(Number(afterDelete?.totalCash)).toBe(1200);
    } finally {
      if (accountId) await dbConnection.delete(sheetEntries).where(eq(sheetEntries.brokerAccountId, accountId));
      if (accountId) await dbConnection.delete(brokerAccounts).where(eq(brokerAccounts.id, accountId));
      if (userId) await dbConnection.delete(users).where(eq(users.id, userId));
    }
  }, 30000);
});
