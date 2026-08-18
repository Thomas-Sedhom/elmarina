import mongoose, { Schema } from "mongoose";

export interface MongoBrokerAccount {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalWeight: mongoose.Types.Decimal128;
  totalCash: mongoose.Types.Decimal128;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const BrokerAccountSchema = new Schema<MongoBrokerAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    totalWeight: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString("0")
    },
    totalCash: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString("0")
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    },
  },
  { timestamps: true, versionKey: false }
);

export const BrokerAccountModel =
  mongoose.models.BrokerAccount || mongoose.model<MongoBrokerAccount>("BrokerAccount", BrokerAccountSchema);
