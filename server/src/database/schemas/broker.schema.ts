import mongoose, { Schema } from "mongoose";

export interface MongoBrokerAccount {
  id: number;
  userId: number;
  totalWeight: mongoose.Types.Decimal128;
  totalCash: mongoose.Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

export const BrokerAccountSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    userId: { type: Number, required: true, unique: true, index: true, ref: "User" },
    totalWeight: { type: Schema.Types.Decimal128, required: true, default: "0" },
    totalCash: { type: Schema.Types.Decimal128, required: true, default: "0" },
  },
  { timestamps: true, versionKey: false }
);

export const BrokerAccountModel =
  mongoose.models.BrokerAccount || mongoose.model("BrokerAccount", BrokerAccountSchema);
