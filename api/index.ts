import "dotenv/config";
import type { Request, Response } from "express";
import { createApp } from "../server/src/app";
import { connectDatabase } from "../server/src/database";
import { usersRepository } from "../server/src/modules/users/users.repository";

const app = createApp();

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await connectDatabase();
    await usersRepository.ensureSeedAdmin();
    initialized = true;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureInit();
    return app(req, res);
  } catch (error) {
    console.error("Vercel serverless handler error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "حدث خطأ في معالجة الطلب على الخادم",
      },
    });
  }
}
