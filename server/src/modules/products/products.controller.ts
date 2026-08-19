import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { productsService } from "./products.service";

const idSchema = z.string().trim().min(1);

const imageInput = z.object({
  imageUrl: z.string().trim().min(1),
  publicId: z.string().trim().min(1),
  isPrimary: z.boolean().optional(),
});

const createProductInput = z.object({
  name: z.string().trim().min(1, "اسم المنتج مطلوب").max(255),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "سعر غير صحيح"),
  description: z.string().trim().max(2000).default("").optional().nullable(),
  images: z.array(imageInput).optional().default([]),
});

const updateProductInput = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  images: z.array(imageInput).optional(),
});

const uploadImageInput = z.object({
  image: z.string().min(10, "بيانات الصورة غير صحيحة"),
});

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  sendData(res, await productsService.list(search));
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await productsService.getById(idSchema.parse(req.params.id)));
});

export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  const { image } = uploadImageInput.parse(req.body);
  const result = await productsService.uploadImage(image);
  sendData(res, result, 201);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProductInput.parse(req.body);
  sendData(
    res,
    await productsService.create({
      ...parsed,
      description: parsed.description || "",
    }),
    201
  );
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = idSchema.parse(req.params.id);
  const parsed = updateProductInput.parse(req.body);
  sendData(
    res,
    await productsService.update(id, {
      ...parsed,
      description: parsed.description ?? undefined,
    })
  );
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await productsService.delete(idSchema.parse(req.params.id)));
});
