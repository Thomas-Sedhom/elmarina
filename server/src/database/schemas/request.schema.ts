import mongoose, { Schema } from "mongoose";

export interface MongoBrokerRequest {
  _id: mongoose.Types.ObjectId;
  brokerAccountId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productName: string;
  description: string;
  status: "pending" | "reviewed" | "completed";
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoRequestImage {
  _id: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  imageUrl: string;
  publicId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BrokerRequestSchema = new Schema<MongoBrokerRequest>(
  {
    brokerAccountId: {
      type: Schema.Types.ObjectId,
      ref: "BrokerAccount",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "completed"],
      default: "pending",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

export const RequestImageSchema = new Schema<MongoRequestImage>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "BrokerRequest",
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const BrokerRequestModel =
  mongoose.models.BrokerRequest || mongoose.model<MongoBrokerRequest>("BrokerRequest", BrokerRequestSchema);

export const RequestImageModel =
  mongoose.models.RequestImage || mongoose.model<MongoRequestImage>("RequestImage", RequestImageSchema);
