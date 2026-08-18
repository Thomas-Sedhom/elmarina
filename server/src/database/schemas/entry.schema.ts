import mongoose, { Schema } from "mongoose";

export type EntryType = "work" | "breakage";

export interface MongoSheetEntry {
  _id: mongoose.Types.ObjectId;
  brokerAccountId: mongoose.Types.ObjectId;
  businessDate: Date;
  weight: mongoose.Types.Decimal128;
  description: string;
  cash: mongoose.Types.Decimal128;
  notes: string | null;
  type: EntryType;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SheetEntrySchema = new Schema<MongoSheetEntry>(
  {
    brokerAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BrokerAccount",
      required: true,
      index: true
    },
    businessDate: {
      type: Date,
      required: true,
      index: true
    },
    weight: {
      type: Schema.Types.Decimal128,
      required: true
    },
    description: {
      type: String,
      default: "",
    },
    cash: {
      type: Schema.Types.Decimal128,
      required: true
    },
    notes: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ["work", "breakage"],
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false }
);

export const SheetEntryModel =
  mongoose.models.SheetEntry || mongoose.model<MongoSheetEntry>("SheetEntry", SheetEntrySchema);
