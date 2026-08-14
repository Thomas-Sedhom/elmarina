import { describe, expect, it } from "vitest";
import { getMongo, pingMongo, closeMongo } from "./mongo";

describe("MongoDB configuration", () => {
  it.skipIf(!process.env.MONGODB_URI)("connects and responds to a lightweight ping", async () => {
    await expect(pingMongo()).resolves.toBe(true);
    await closeMongo();
  }, 30000);
  it("fails clearly when MONGODB_URI is missing", async () => {
    const original = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    await expect(getMongo()).rejects.toThrow("MONGODB_URI is not configured");
    if (original) process.env.MONGODB_URI = original;
  });
});
