import mongoose, { Schema } from "mongoose";

export interface MongoCounter {
  _id: string;
  seq: number;
}

export const CounterSchema = new Schema(
  {
    _id: String,
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export const CounterModel =
  mongoose.models.Counter || mongoose.model<MongoCounter>("Counter", CounterSchema);
