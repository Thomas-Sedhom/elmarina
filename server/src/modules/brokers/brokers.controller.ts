import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { brokersService } from "./brokers.service";

const idSchema = z.string().trim().min(1);
const brokerInput = z.object({ name: z.string().trim().min(2).max(255), phone: z.string().trim().min(8).max(32), password: z.string().min(8).max(128) });

const blockInput = z.object({ isBlocked: z.boolean() });

export const listBrokers = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.list(typeof req.query.search === "string" ? req.query.search : undefined)));
export const createBroker = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.create(brokerInput.parse(req.body)), 201));
export const getBroker = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.getById(idSchema.parse(req.params.id), req.user!)));
export const getMyBrokerAccount = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.getMyAccount(req.user!)));
export const toggleBlockBroker = asyncHandler(async (req: Request, res: Response) => {
  const { isBlocked } = blockInput.parse(req.body);
  sendData(res, await brokersService.toggleBlock(idSchema.parse(req.params.id), isBlocked));
});
export const deleteBroker = asyncHandler(async (req: Request, res: Response) => {
  sendData(res, await brokersService.softDelete(idSchema.parse(req.params.id)));
});

const passwordInput = z.object({ newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(128) });
export const updateBrokerPassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = passwordInput.parse(req.body);
  sendData(res, await brokersService.updatePassword(idSchema.parse(req.params.id), newPassword));
});
