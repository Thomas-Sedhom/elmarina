import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { ledgerService } from "./ledger.service";

const idSchema = z.string().trim().min(1);
const entryInput = z.object({
  brokerAccountId: z.string().trim().min(1),
  businessDate: z.string().datetime(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/, "Invalid weight"),
  description: z.string().trim().max(500).default("").optional().nullable(),
  cash: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cash"),
  notes: z.string().trim().max(500).nullable().optional(),
  type: z.enum(["work", "breakage"]),
});

const parseInput = (body: unknown) => {
  const input = entryInput.parse(body);
  return {
    ...input,
    description: input.description?.trim() || "",
    businessDate: new Date(input.businessDate),
    notes: input.notes ?? null,
  };
};

export const listEntries = asyncHandler(async (req: Request, res: Response) => {
  const accountId = idSchema.parse(req.params.brokerAccountId);
  sendData(res, await ledgerService.listForBroker(accountId, req.user!));
});

export const createEntry = asyncHandler(async (req: Request, res: Response) =>
  sendData(
    res,
    await ledgerService.create({
      ...parseInput(req.body),
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    }),
    201
  )
);

export const updateEntry = asyncHandler(async (req: Request, res: Response) => {
  await ledgerService.update(idSchema.parse(req.params.id), {
    ...parseInput(req.body),
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });
  sendData(res, { success: true });
});

export const deleteEntry = asyncHandler(async (req: Request, res: Response) => {
  await ledgerService.delete(idSchema.parse(req.params.id));
  sendData(res, { success: true });
});
