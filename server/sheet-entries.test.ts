import { describe, expect, it } from "vitest";
import { deleteEffectReversal, editEffectDelta, entryEffect } from "./db";
import { assertCanViewBrokerAccount } from "./src/shared/security/access";
import * as database from "./db";
import type { User } from "@shared/types";
import { BrokerAccountModel, SheetEntryModel, UserModel } from "./mongoModels";
import { closeMongo } from "./mongo";

const user = (id: number, role: User["role"]): User => ({ id, openId: `local:${id}`, name: `User ${id}`, phone: `0100000000${id}`, passwordHash: null, email: null, loginMethod: "phone", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() });

describe("Express ledger domain", () => {
  it("adds work entries to both totals", () => expect(entryEffect("work", "12.500", "1500.00")).toEqual({ weight: 12.5, cash: 1500 }));
  it("subtracts breakage entries from both totals", () => expect(entryEffect("breakage", "2.250", "300.00")).toEqual({ weight: -2.25, cash: -300 }));
  it("applies only the delta when an entry changes", () => expect(editEffectDelta({ type: "work", weight: "10.000", cash: "1000.00" }, { type: "breakage", weight: "3.000", cash: "250.00" })).toEqual({ weight: -13, cash: -1250 }));
  it("reverses the exact effect when an entry is deleted", () => expect(deleteEffectReversal({ type: "breakage", weight: "2.500", cash: "400.00" })).toEqual({ weight: 2.5, cash: 400 }));
  it("rejects a broker from viewing another broker account", () => {
    expect(() => assertCanViewBrokerAccount(user(7, "broker"), { userId: 8 })).toThrowError(/only view your own account/);
    expect(() => assertCanViewBrokerAccount(user(7, "broker"), { userId: 7 })).not.toThrow();
    expect(() => assertCanViewBrokerAccount(user(1, "admin"), { userId: 8 })).not.toThrow();
  });
});

describe.skipIf(!process.env.MONGODB_URI)("Express MongoDB ledger flows", () => {
  it("persists work/breakage, applies edit delta, and reverses delete", async () => {
    const phone = `011${Date.now().toString().slice(-8)}`;
    let accountId: number | undefined;
    let userId: number | undefined;
    try {
      const broker = await database.createBroker({ name: "اختبار Express", phone, password: "TestPass123" });
      accountId = broker.id; userId = broker.userId;
      const base = { brokerAccountId: accountId, businessDate: new Date("2026-08-14T00:00:00.000Z"), description: "اختبار", notes: null, createdBy: userId, updatedBy: userId } as const;
      const workId = await database.createSheetEntry({ ...base, weight: "10.000", cash: "1000.00", type: "work" });
      let totals = await database.getBrokerAccount(accountId);
      expect(Number(totals?.totalWeight)).toBe(10); expect(Number(totals?.totalCash)).toBe(1000);
      const breakageId = await database.createSheetEntry({ ...base, weight: "2.000", cash: "250.00", type: "breakage" });
      totals = await database.getBrokerAccount(accountId);
      expect(Number(totals?.totalWeight)).toBe(8); expect(Number(totals?.totalCash)).toBe(750);
      await database.updateSheetEntry(workId, { ...base, weight: "12.000", cash: "1200.00", type: "work" });
      totals = await database.getBrokerAccount(accountId);
      expect(Number(totals?.totalWeight)).toBe(10); expect(Number(totals?.totalCash)).toBe(950);
      await database.deleteSheetEntry(breakageId);
      totals = await database.getBrokerAccount(accountId);
      expect(Number(totals?.totalWeight)).toBe(12); expect(Number(totals?.totalCash)).toBe(1200);
    } finally {
      if (accountId) await SheetEntryModel.deleteMany({ brokerAccountId: accountId });
      if (accountId) await BrokerAccountModel.deleteOne({ id: accountId });
      if (userId) await UserModel.deleteOne({ id: userId });
      await closeMongo();
    }
  }, 120000);
});
