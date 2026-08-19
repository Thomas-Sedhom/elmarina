import mongoose, { Schema } from "mongoose";

export interface MongoProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: mongoose.Types.Decimal128;
  description: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoProductImage {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  imageUrl: string;
  publicId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<MongoProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Schema.Types.Decimal128,
      required: true,
      default: () => mongoose.Types.Decimal128.fromString("0"),
    },
    description: {
      type: String,
      default: "",
      trim: true,
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

export const ProductImageSchema = new Schema<MongoProductImage>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
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
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ProductModel =
  mongoose.models.Product || mongoose.model<MongoProduct>("Product", ProductSchema);

export const ProductImageModel =
  mongoose.models.ProductImage || mongoose.model<MongoProductImage>("ProductImage", ProductImageSchema);
