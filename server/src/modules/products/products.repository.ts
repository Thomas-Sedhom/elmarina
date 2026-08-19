import mongoose from "mongoose";
import type { Product, ProductImage } from "@shared/types";
import { ProductModel, ProductImageModel, type MongoProduct, type MongoProductImage } from "../../database/schemas/product.schema";

function decimal(value: unknown) {
  return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0");
}

function mongoDecimal(value: string | number) {
  return mongoose.Types.Decimal128.fromString(String(value));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toProductImage(doc: MongoProductImage): ProductImage {
  return {
    id: doc._id.toString(),
    productId: doc.productId.toString(),
    imageUrl: doc.imageUrl,
    publicId: doc.publicId,
    isPrimary: Boolean(doc.isPrimary),
    createdAt: doc.createdAt,
  };
}

function toProduct(doc: MongoProduct, images: MongoProductImage[] = []): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: decimal(doc.price),
    description: doc.description || "",
    images: images.map(toProductImage),
    isDeleted: Boolean(doc.isDeleted),
    deletedAt: doc.deletedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class ProductsRepository {
  async list(search?: string): Promise<Product[]> {
    const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      const pattern = new RegExp(escapeRegex(normalizedSearch), "i");
      filter.$or = [{ name: pattern }, { description: pattern }];
    }

    const products = (await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .lean()) as unknown as MongoProduct[];

    if (!products.length) return [];

    const productIds = products.map(p => p._id);
    const images = (await ProductImageModel.find({ productId: { $in: productIds } })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean()) as unknown as MongoProductImage[];

    const imageMap = new Map<string, MongoProductImage[]>();
    for (const img of images) {
      const pId = img.productId.toString();
      if (!imageMap.has(pId)) imageMap.set(pId, []);
      imageMap.get(pId)!.push(img);
    }

    return products.map(p => toProduct(p, imageMap.get(p._id.toString()) || []));
  }

  async findById(id: string): Promise<Product | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;

    const product = (await ProductModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isDeleted: { $ne: true },
    }).lean()) as unknown as MongoProduct | null;

    if (!product) return undefined;

    const images = (await ProductImageModel.find({ productId: product._id })
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean()) as unknown as MongoProductImage[];

    return toProduct(product, images);
  }

  async create(input: {
    name: string;
    price: string;
    description?: string;
    images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }>;
  }): Promise<Product> {
    return mongoose.connection.transaction(async session => {
      const [productDoc] = await ProductModel.create(
        [
          {
            name: input.name.trim(),
            price: mongoDecimal(input.price),
            description: input.description?.trim() || "",
            isDeleted: false,
          },
        ],
        { session, ordered: true }
      );

      let savedImages: MongoProductImage[] = [];
      if (input.images && input.images.length > 0) {
        savedImages = (await ProductImageModel.insertMany(
          input.images.map((img, idx) => ({
            productId: productDoc._id,
            imageUrl: img.imageUrl,
            publicId: img.publicId,
            isPrimary: img.isPrimary ?? idx === 0,
          })),
          { session }
        )) as unknown as MongoProductImage[];
      }

      return toProduct(productDoc as unknown as MongoProduct, savedImages);
    });
  }

  async update(
    id: string,
    input: {
      name?: string;
      price?: string;
      description?: string;
      images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }>;
    }
  ): Promise<Product | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const pObjectId = new mongoose.Types.ObjectId(id);

    return mongoose.connection.transaction(async session => {
      const updateDoc: Record<string, unknown> = {};
      if (input.name !== undefined) updateDoc.name = input.name.trim();
      if (input.price !== undefined) updateDoc.price = mongoDecimal(input.price);
      if (input.description !== undefined) updateDoc.description = input.description.trim();

      const productDoc = (await ProductModel.findByIdAndUpdate(
        pObjectId,
        { $set: updateDoc },
        { new: true, session }
      ).lean()) as unknown as MongoProduct | null;

      if (!productDoc) return undefined;

      if (input.images !== undefined) {
        await ProductImageModel.deleteMany({ productId: pObjectId }).session(session);
        if (input.images.length > 0) {
          await ProductImageModel.insertMany(
            input.images.map((img, idx) => ({
              productId: pObjectId,
              imageUrl: img.imageUrl,
              publicId: img.publicId,
              isPrimary: img.isPrimary ?? idx === 0,
            })),
            { session }
          );
        }
      }

      const images = (await ProductImageModel.find({ productId: pObjectId })
        .sort({ isPrimary: -1, createdAt: 1 })
        .session(session)
        .lean()) as unknown as MongoProductImage[];

      return toProduct(productDoc, images);
    });
  }

  async softDelete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await ProductModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    return Boolean(res);
  }

  async findImagesByProductId(id: string): Promise<ProductImage[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) return [];
    const images = (await ProductImageModel.find({
      productId: new mongoose.Types.ObjectId(id),
    }).lean()) as unknown as MongoProductImage[];
    return images.map(toProductImage);
  }
}

export const productsRepository = new ProductsRepository();
