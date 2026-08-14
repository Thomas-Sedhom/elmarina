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

export async function nextId(sequence: "users" | "brokerAccounts" | "sheetEntries", session?: ClientSession) {
  await getMongo();
  const counter = await CounterModel.findOneAndUpdate(
    { _id: sequence },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  ).lean();
  if (!counter) throw new Error(`Failed to allocate ${sequence} id`);
  return counter.seq;
}

export async function ensureCounterAtLeast(sequence: "users" | "brokerAccounts" | "sheetEntries", value: number) {
  await getMongo();
  await CounterModel.findOneAndUpdate(
    { _id: sequence, seq: { $lt: value } },
    { $set: { seq: value } },
    { upsert: true }
  );
}
