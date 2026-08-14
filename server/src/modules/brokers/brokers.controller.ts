import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { brokersService } from "./brokers.service";

const idSchema = z.coerce.number().int().positive();
const brokerInput = z.object({ name: z.string().trim().min(2).max(255), phone: z.string().trim().min(8).max(32), password: z.string().min(8).max(128) });

export const listBrokers = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.list(typeof req.query.search === "string" ? req.query.search : undefined)));
export const createBroker = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.create(brokerInput.parse(req.body)), 201));
export const getBroker = asyncHandler(async (req: Request, res: Response) => sendData(res, await brokersService.getById(idSchema.parse(req.params.id), req.user!)));
