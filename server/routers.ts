import { z } from "zod";
import type { User } from "@shared/types";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

const phoneSchema = z.string().trim().min(8).max(32);
const passwordSchema = z.string().min(8).max(128);
const entrySchema = z.object({
  brokerAccountId: z.number().int().positive(),
  businessDate: z.string().datetime(),
  weight: z.string().regex(/^\d+(\.\d{1,3})?$/, "Invalid weight"),
  description: z.string().trim().min(1).max(500),
  cash: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cash"),
  notes: z.string().trim().max(500).nullable().optional(),
  type: z.enum(["work", "breakage"]),
});

export function canUserViewBrokerAccount(user: User, account: { userId: number } | undefined) {
  if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Broker account not found" });
  if (user.role !== "admin" && account.userId !== user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own account" });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? db.toSafeUser(opts.ctx.user) : null),
    login: publicProcedure
      .input(z.object({ phone: phoneSchema, password: passwordSchema }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.authenticateLocalUser(input.phone, input.password);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid phone or password" });
        const sessionToken = await (await import("./_core/sdk")).sdk.createSessionToken(user.openId, { name: user.name ?? undefined });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return { user: db.toSafeUser(user) };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  brokers: router({
    list: adminProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => db.listBrokers(input?.search)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const account = await db.getBrokerAccount(input.id);
      canUserViewBrokerAccount(ctx.user, account);
      return account;
    }),
    create: adminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(255), phone: phoneSchema, password: passwordSchema }))
      .mutation(({ input }) => db.createBroker(input)),
  }),
  sheetEntries: router({
    list: protectedProcedure.input(z.object({ brokerAccountId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const account = await db.getBrokerAccount(input.brokerAccountId);
      canUserViewBrokerAccount(ctx.user, account);
      return db.listSheetEntries(input.brokerAccountId);
    }),
    create: adminProcedure.input(entrySchema).mutation(({ input, ctx }) => db.createSheetEntry({
      ...input,
      businessDate: new Date(input.businessDate),
      notes: input.notes ?? null,
      createdBy: ctx.user.id,
      updatedBy: ctx.user.id,
    })),
    update: adminProcedure.input(entrySchema.extend({ id: z.number().int().positive() })).mutation(({ input, ctx }) => {
      const { id, ...entry } = input;
      return db.updateSheetEntry(id, {
        ...entry,
        businessDate: new Date(entry.businessDate),
        notes: entry.notes ?? null,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteSheetEntry(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
