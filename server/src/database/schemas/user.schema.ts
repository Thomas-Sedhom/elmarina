import mongoose, { Schema } from "mongoose";

export type Role = "admin" | "broker";

export interface MongoUser {
  id: number;
  openId: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export const UserSchema = new Schema<MongoUser>(
  {
    id: { type: Number, required: true, unique: true, index: true },
    openId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: null },
    phone: { type: String, default: null, unique: true, sparse: true, index: true },
    passwordHash: { type: String, default: null, select: false },
    email: { type: String, default: null },
    role: { type: String, enum: ["admin", "broker"], required: true, default: "broker", index: true },
    lastSignedIn: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

export const UserModel = mongoose.models.User || mongoose.model<MongoUser>("User", UserSchema);
