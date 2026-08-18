import mongoose from "mongoose";
import { UserModel } from "./schemas/user.schema";
import { BrokerAccountModel } from "./schemas/broker.schema";
import { SheetEntryModel } from "./schemas/entry.schema";

let connecting: Promise<typeof mongoose> | null = null;

async function syncAllIndexes() {
  try {
    // Drop known stale unique indexes if present
    const userColl = UserModel.collection;
    const staleIndexes = ["id_1", "openId_1"];
    for (const name of staleIndexes) {
      await userColl.dropIndex(name).catch(() => {});
    }

    const brokerColl = BrokerAccountModel.collection;
    await brokerColl.dropIndex("id_1").catch(() => {});

    const entryColl = SheetEntryModel.collection;
    await entryColl.dropIndex("id_1").catch(() => {});

    // Sync active schema indexes
    await Promise.allSettled([
      UserModel.syncIndexes(),
      BrokerAccountModel.syncIndexes(),
      SheetEntryModel.syncIndexes(),
    ]);
  } catch {
    // Silently ignore if collection doesn't exist yet
  }
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured in environment variables");
  if (!connecting) {
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 })
      .then(async m => {
        await syncAllIndexes();
        return m;
      })
      .catch(error => {
        connecting = null;
        throw error;
      });
  }
  return connecting;
}

export const getMongo = connectDatabase;

export async function pingDatabase() {
  await connectDatabase();
  await mongoose.connection.db?.command({ ping: 1 });
  return true;
}

export async function closeDatabase() {
  connecting = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
