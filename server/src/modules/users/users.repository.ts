import mongoose from "mongoose";
import type { User } from "@shared/types";
import { UserModel } from "../../database/schemas/user.schema";
import { hashPassword } from "../../shared/utils/crypto";

function normalizePhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    phone: doc.phone ?? null,
    passwordHash: doc.passwordHash ?? null,
    email: doc.email ?? null,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastSignedIn: doc.lastSignedIn,
  };
}

export class UsersRepository {
  toSafeUser(user: User) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async findById(id: string): Promise<User | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const result = await UserModel.findById(id).lean();
    return result ? toUser(result) : undefined;
  }

  async findByPhone(phone: string, includePassword = false): Promise<User | undefined> {
    const query = UserModel.findOne({ phone: normalizePhone(phone) });
    if (includePassword) query.select("+passwordHash");
    const result = await query.lean();
    return result ? toUser(result) : undefined;
  }

  async updateLastSignedIn(id: string): Promise<void> {
    await UserModel.updateOne({ _id: id }, { $set: { lastSignedIn: new Date() } });
  }

  async ensureSeedAdmin(): Promise<void> {
    const phone = normalizePhone(process.env.ADMIN_PHONE || "01023999511");
    const password = process.env.ADMIN_PASSWORD || "Rm-24222682";
    const name = process.env.ADMIN_NAME || "سيدهم بسطوروس";
    const existing = await UserModel.findOne({ role: "admin" }).select("+passwordHash");
    if (existing) {
      await UserModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            name,
            phone,
            passwordHash: hashPassword(password),
          },
        }
      );
      return;
    }
    await UserModel.create({
      name,
      phone,
      passwordHash: hashPassword(password),
      email: null,
      role: "admin",
      lastSignedIn: new Date(),
    });
  }
}

export const usersRepository = new UsersRepository();
