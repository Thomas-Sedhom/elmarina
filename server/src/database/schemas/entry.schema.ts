import mongoose, { Schema } from "mongoose";

export type EntryType = "work" | "breakage";

export interface MongoSheetEntry {
  id: number;
  brokerAccountId: number;
  businessDate: Date;
  weight: mongoose.Types.Decimal128;
  description: string;
  cash: mongoose.Types.Decimal128;
  notes: string | null;
  type: EntryType;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export const SheetEntrySchema = new Schema(
  {
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
  },
  { timestamps: true, versionKey: false }
);

export const SheetEntryModel =
  mongoose.models.SheetEntry || mongoose.model("SheetEntry", SheetEntrySchema);
