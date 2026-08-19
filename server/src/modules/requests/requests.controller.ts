import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { requestsService } from "./requests.service";

const idSchema = z.string().trim().min(1);

const requestImageInput = z.object({
  imageUrl: z.string().trim().min(1),
  publicId: z.string().trim().min(1),
});

const createRequestInput = z.object({
  productName: z.string().trim().min(1, "اسم الشغل مطلوب").max(255),
  description: z.string().trim().max(2000).default("").optional().nullable(),
  images: z.array(requestImageInput).optional().default([]),
});

const uploadImageInput = z.object({
  image: z.string().min(10, "بيانات الصورة غير صحيحة"),
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await requestsService.listForUser(req.user!));
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await requestsService.getById(idSchema.parse(req.params.id), req.user!));
});

export const uploadRequestImage = asyncHandler(async (req: Request, res: Response) => {
  const { image } = uploadImageInput.parse(req.body);
  const result = await requestsService.uploadImage(image);
  sendData(res, result, 201);
});

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createRequestInput.parse(req.body);
  sendData(
    res,
    await requestsService.create(
      {
        ...parsed,
        description: parsed.description || "",
      },
      req.user!
    ),
    201
  );
});

export const deleteRequest = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await requestsService.delete(idSchema.parse(req.params.id)));
});
