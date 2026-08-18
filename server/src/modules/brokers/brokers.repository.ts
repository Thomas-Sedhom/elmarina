import mongoose from "mongoose";
import type { BrokerAccount } from "@shared/types";
import { BrokerAccountModel } from "../../database/schemas/broker.schema";
import { UserModel, type MongoUser } from "../../database/schemas/user.schema";
import { hashPassword } from "../../shared/utils/crypto";

function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

function decimal(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0");
}

function mongoDecimal(value: string | number) {
  return mongoose.Types.Decimal128.fromString(String(value));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type PopulatedBrokerAccount = {
  _id: mongoose.Types.ObjectId;
  userId: MongoUser;
  totalWeight: mongoose.Types.Decimal128;
  totalCash: mongoose.Types.Decimal128;
  isBlocked?: boolean;
};

function toBroker(accountDoc: PopulatedBrokerAccount, userDoc: MongoUser): BrokerAccount {
  return {
    id: accountDoc._id.toString(),
    userId: userDoc._id.toString(),
    name: userDoc.name,
    phone: userDoc.phone,
    totalWeight: decimal(accountDoc.totalWeight),
    totalCash: decimal(accountDoc.totalCash),
    isBlocked: Boolean(accountDoc.isBlocked),
  };
}

export class BrokersRepository {
  async list(search?: string): Promise<BrokerAccount[]> {
    const accounts = (await BrokerAccountModel.find()
      .populate("userId")
      .sort({ updatedAt: -1 })
      .lean()) as unknown as PopulatedBrokerAccount[];

    const normalizedSearch = search?.trim();
    const pattern = normalizedSearch ? new RegExp(escapeRegex(normalizedSearch), "i") : null;

    return accounts
      .filter(account => account && account.userId)
      .map(account => toBroker(account, account.userId))
      .filter(item => {
        if (!pattern) return true;
        return pattern.test(item.name ?? "") || pattern.test(item.phone ?? "");
      });
  }

  async findById(id: string): Promise<BrokerAccount | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const account = (await BrokerAccountModel.findById(id)
      .populate("userId")
      .lean()) as unknown as PopulatedBrokerAccount | null;

    if (!account || !account.userId) return undefined;
    return toBroker(account, account.userId);
  }

  async findByUserId(userId: string): Promise<BrokerAccount | undefined> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return undefined;
    const account = (await BrokerAccountModel.findOne({ userId: new mongoose.Types.ObjectId(userId) })
      .populate("userId")
      .lean()) as unknown as PopulatedBrokerAccount | null;

    if (!account || !account.userId) return undefined;
    return toBroker(account, account.userId);
  }

  async updateBlockStatus(id: string, isBlocked: boolean): Promise<BrokerAccount | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const account = (await BrokerAccountModel.findByIdAndUpdate(
      id,
      { $set: { isBlocked } },
      { new: true }
    )
      .populate("userId")
      .lean()) as unknown as PopulatedBrokerAccount | null;

    if (!account || !account.userId) return undefined;
    return toBroker(account, account.userId);
  }

  async create(input: { name: string; phone: string; password: string }): Promise<{ id: string; userId: string }> {
    const phone = normalizePhone(input.phone);
    return mongoose.connection.transaction(async session => {
      const existing = await UserModel.findOne({ phone }).session(session);
      if (existing) throw new Error("PHONE_ALREADY_EXISTS");

      const [user] = await UserModel.create(
        [
          {
            name: input.name.trim(),
            phone,
            passwordHash: hashPassword(input.password),
            role: "broker",
          },
        ],
        { session }
      );

      const [account] = await BrokerAccountModel.create(
        [
          {
            userId: user._id,
            totalWeight: mongoDecimal("0"),
            totalCash: mongoDecimal("0"),
          },
        ],
        { session }
      );

      return { id: account._id.toString(), userId: user._id.toString() };
    });
  }
}

export const brokersRepository = new BrokersRepository();
