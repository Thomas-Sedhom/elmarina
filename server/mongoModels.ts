import mongoose, { Schema } from "mongoose";

export type Role = "admin" | "broker";
export type EntryType = "work" | "breakage";

export interface MongoUser {
  id: number;
  openId: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  email: string | null;
  loginMethod: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

const UserSchema = new Schema<MongoUser>({
  id: { type: Number, required: true, unique: true, index: true },
  openId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: null },
  phone: { type: String, default: null, unique: true, sparse: true, index: true },
  passwordHash: { type: String, default: null, select: false },
  email: { type: String, default: null },
  loginMethod: { type: String, required: true, default: "phone" },
  role: { type: String, enum: ["admin", "broker"], required: true, default: "broker", index: true },
  lastSignedIn: { type: Date, required: true, default: Date.now },
}, { timestamps: true, versionKey: false });

const BrokerAccountSchema = new Schema({
  id: { type: Number, required: true, unique: true, index: true },
  userId: { type: Number, required: true, unique: true, index: true, ref: "User" },
  totalWeight: { type: Schema.Types.Decimal128, required: true, default: "0" },
  totalCash: { type: Schema.Types.Decimal128, required: true, default: "0" },
}, { timestamps: true, versionKey: false });

const SheetEntrySchema = new Schema({
  id: { type: Number, required: true, unique: true, index: true },
  brokerAccountId: { type: Number, required: true, index: true, ref: "BrokerAccount" },
  businessDate: { type: Date, required: true, index: true },
  weight: { type: Schema.Types.Decimal128, required: true },
  description: { type: String, required: true },
  cash: { type: Schema.Types.Decimal128, required: true },
  notes: { type: String, default: null },
  type: { type: String, enum: ["work", "breakage"], required: true },
  createdBy: { type: Number, required: true },
  updatedBy: { type: Number, required: true },
}, { timestamps: true, versionKey: false });

const CounterSchema = new Schema({ _id: String, seq: { type: Number, required: true, default: 0 } }, { versionKey: false });

export const UserModel = mongoose.models.User || mongoose.model<MongoUser>("User", UserSchema);
export const BrokerAccountModel = mongoose.models.BrokerAccount || mongoose.model("BrokerAccount", BrokerAccountSchema);
export const SheetEntryModel = mongoose.models.SheetEntry || mongoose.model("SheetEntry", SheetEntrySchema);
export const CounterModel = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
