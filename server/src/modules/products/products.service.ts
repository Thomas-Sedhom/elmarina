import { NotFoundError } from "@shared/errors";
import { productsRepository } from "./products.repository";
import { cloudinaryService } from "../../shared/services/cloudinary.service";

export class ProductsService {
  async list(search?: string) {
    return productsRepository.list(search);
  }

  async getById(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) throw NotFoundError("Product not found");
    return product;
  }

  async uploadImage(base64OrUrl: string) {
    if (!cloudinaryService.isConfigured()) {
      // In local dev without Cloudinary keys, fallback to raw string or throw clear message
      return {
        imageUrl: base64OrUrl,
        publicId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
    }

    const uploadRes = await cloudinaryService.uploadImage(base64OrUrl, {
      folder: "elmarina/products",
    });

    return {
      imageUrl: uploadRes.secureUrl,
      publicId: uploadRes.publicId,
    };
  }

  async create(input: {
    name: string;
    price: string;
    description?: string;
    images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }>;
  }) {
    return productsRepository.create(input);
  }

  async update(
    id: string,
    input: {
      name?: string;
      price?: string;
      description?: string;
      images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }>;
    }
  ) {
    const updated = await productsRepository.update(id, input);
    if (!updated) throw NotFoundError("Product not found");
    return updated;
  }

  async delete(id: string) {
    const success = await productsRepository.softDelete(id);
    if (!success) throw NotFoundError("Product not found");
    return { success: true };
  }
}

export const productsService = new ProductsService();
