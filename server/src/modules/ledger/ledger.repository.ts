import mongoose, { type ClientSession } from "mongoose";
import type { SheetEntry } from "@shared/types";
import { SheetEntryModel } from "../../database/schemas/entry.schema";
import { BrokerAccountModel } from "../../database/schemas/broker.schema";

export type LedgerEntryInput = {
  brokerAccountId: string;
  businessDate: Date;
  weight: string;
  description: string;
  cash: string;
  notes: string | null;
  type: "work" | "breakage";
};

function decimal(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0");
}

function mongoDecimal(value: string | number) {
  return mongoose.Types.Decimal128.fromString(String(value));
}

function signedAmount(type: "work" | "breakage", value: string) {
  return type === "work" ? Number(value) : -Number(value);
}

function toEntry(doc: any): SheetEntry {
  return {
    id: doc._id.toString(),
    brokerAccountId: doc.brokerAccountId.toString(),
    businessDate: doc.businessDate,
    weight: decimal(doc.weight),
    description: doc.description,
    cash: decimal(doc.cash),
    notes: doc.notes ?? null,
    type: doc.type,
    createdBy: doc.createdBy.toString(),
    updatedBy: doc.updatedBy.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function entryEffect(type: "work" | "breakage", weight: string, cash: string) {
  return { weight: signedAmount(type, weight), cash: signedAmount(type, cash) };
}

export function editEffectDelta(
  previous: { type: "work" | "breakage"; weight: string; cash: string },
  next: { type: "work" | "breakage"; weight: string; cash: string }
) {
  const oldEffect = entryEffect(previous.type, previous.weight, previous.cash);
  const newEffect = entryEffect(next.type, next.weight, next.cash);
  return { weight: newEffect.weight - oldEffect.weight, cash: newEffect.cash - oldEffect.cash };
}

export function deleteEffectReversal(entry: { type: "work" | "breakage"; weight: string; cash: string }) {
  const effect = entryEffect(entry.type, entry.weight, entry.cash);
  return { weight: -effect.weight, cash: -effect.cash };
}

async function updateTotals(accountId: string, delta: { weight: number; cash: number }, session: ClientSession) {
  const result = await BrokerAccountModel.findByIdAndUpdate(
    accountId,
    { $inc: { totalWeight: mongoDecimal(String(delta.weight)), totalCash: mongoDecimal(String(delta.cash)) } },
    { session }
  );
  if (!result) throw new Error("BROKER_ACCOUNT_NOT_FOUND");
}

export class LedgerRepository {
  async findBrokerAccount(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BrokerAccountModel.findById(id).lean();
  }

  async listByBrokerAccount(brokerAccountId: string): Promise<SheetEntry[]> {
    if (!mongoose.Types.ObjectId.isValid(brokerAccountId)) return [];
    const rows = await SheetEntryModel.find({ brokerAccountId })
      .sort({ businessDate: -1, _id: -1 })
      .lean();
    return rows.map(toEntry);
  }

  async create(input: LedgerEntryInput & { createdBy: string; updatedBy: string }): Promise<string> {
    return mongoose.connection.transaction(async session => {
      const [entry] = await SheetEntryModel.create(
        [
          {
            brokerAccountId: new mongoose.Types.ObjectId(input.brokerAccountId),
            businessDate: input.businessDate,
            weight: mongoDecimal(String(input.weight)),
            description: input.description,
            cash: mongoDecimal(String(input.cash)),
            notes: input.notes ?? null,
            type: input.type,
            createdBy: new mongoose.Types.ObjectId(input.createdBy),
            updatedBy: new mongoose.Types.ObjectId(input.updatedBy),
          },
        ],
        { session, ordered: true }
      );
      await updateTotals(
        input.brokerAccountId,
        entryEffect(input.type, String(input.weight), String(input.cash)),
        session
      );
      return entry._id.toString();
    });
  }

  async update(id: string, input: LedgerEntryInput & { createdBy: string; updatedBy: string }): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ENTRY_NOT_FOUND");
    return mongoose.connection.transaction(async session => {
      const previous = await SheetEntryModel.findById(id).session(session).lean();
      if (!previous) throw new Error("ENTRY_NOT_FOUND");
      if (previous.brokerAccountId.toString() !== input.brokerAccountId) throw new Error("BROKER_ACCOUNT_CANNOT_CHANGE");

      await SheetEntryModel.findByIdAndUpdate(
        id,
        {
          $set: {
            businessDate: input.businessDate,
            weight: mongoDecimal(String(input.weight)),
            description: input.description,
            cash: mongoDecimal(String(input.cash)),
            notes: input.notes ?? null,
            type: input.type,
            updatedBy: new mongoose.Types.ObjectId(input.updatedBy),
          },
        },
        { session }
      );

      await updateTotals(
        input.brokerAccountId,
        editEffectDelta(
          { type: previous.type, weight: decimal(previous.weight), cash: decimal(previous.cash) },
          { type: input.type, weight: String(input.weight), cash: String(input.cash) }
        ),
        session
      );
    });
  }

  async delete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ENTRY_NOT_FOUND");
    return mongoose.connection.transaction(async session => {
      const previous = await SheetEntryModel.findByIdAndDelete(id).session(session).lean();
      if (!previous) throw new Error("ENTRY_NOT_FOUND");

      await updateTotals(
        previous.brokerAccountId.toString(),
        deleteEffectReversal({
          type: previous.type,
          weight: decimal(previous.weight),
          cash: decimal(previous.cash),
        }),
        session
      );
    });
  }
}

export const ledgerRepository = new LedgerRepository();
