import type { Request, Response } from "express";
import { asyncHandler, sendData } from "../../shared/utils/http";
import { usersService } from "./users.service";

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => sendData(res, usersService.me(req.user!)));
