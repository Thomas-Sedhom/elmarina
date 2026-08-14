import mongoose, { type ClientSession } from "mongoose";
import { CounterModel } from "./mongoModels";

let connecting: Promise<typeof mongoose> | null = null;

export async function getMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!connecting) {
    connecting = mongoose.connect(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 10 }).catch(error => {
      connecting = null;
      throw error;
    });
  }
  return connecting;
}

export async function pingMongo() {
  const connection = await getMongo();
  await connection.connection.db?.command({ ping: 1 });
  return true;
}

export async function closeMongo() {
  connecting = null;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

export type IdSequence = "users" | "brokerAccounts" | "sheetEntries";

export async function ensureCounterDocuments() {
  await getMongo();
  for (const sequence of ["users", "brokerAccounts", "sheetEntries"] as IdSequence[]) {
    try {
      await CounterModel.updateOne({ _id: sequence }, { $setOnInsert: { seq: 0 } }, { upsert: true });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
  }
}

export async function nextId(sequence: IdSequence, session?: ClientSession) {
  await getMongo();
  const counter = await CounterModel.findOneAndUpdate(
    { _id: sequence },
    { $inc: { seq: 1 } },
    { new: true, session }
  ).lean();
  if (!counter) throw new Error(`Counter ${sequence} is not initialized`);
  return counter.seq;
}

export async function ensureCounterAtLeast(sequence: IdSequence, value: number) {
  await getMongo();
  await CounterModel.updateOne({ _id: sequence }, { $max: { seq: value } });
}
