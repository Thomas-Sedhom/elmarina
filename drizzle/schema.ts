import {
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 128 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    passwordHash: varchar("passwordHash", { length: 255 }),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }).default("phone").notNull(),
    role: mysqlEnum("role", ["admin", "broker"]).default("broker").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => ({
    phoneUnique: uniqueIndex("users_phone_unique").on(table.phone),
  })
);

export const brokerAccounts = mysqlTable(
  "broker_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    totalWeight: decimal("totalWeight", { precision: 18, scale: 3 }).default("0").notNull(),
    totalCash: decimal("totalCash", { precision: 18, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdx: index("broker_accounts_user_idx").on(table.userId),
    userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id], name: "broker_accounts_user_fk" }),
  })
);

export const sheetEntries = mysqlTable(
  "sheet_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    brokerAccountId: int("brokerAccountId").notNull(),
    businessDate: timestamp("businessDate").notNull(),
    weight: decimal("weight", { precision: 18, scale: 3 }).notNull(),
    description: varchar("description", { length: 500 }).notNull(),
    cash: decimal("cash", { precision: 18, scale: 2 }).notNull(),
    notes: text("notes"),
    type: mysqlEnum("type", ["work", "breakage"]).notNull(),
    createdBy: int("createdBy").notNull(),
    updatedBy: int("updatedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    brokerDateIdx: index("sheet_entries_broker_date_idx").on(
      table.brokerAccountId,
      table.businessDate
    ),
    brokerFk: foreignKey({ columns: [table.brokerAccountId], foreignColumns: [brokerAccounts.id], name: "sheet_entries_broker_fk" }),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  brokerAccount: one(brokerAccounts, {
    fields: [users.id],
    references: [brokerAccounts.userId],
  }),
}));

export const brokerAccountsRelations = relations(brokerAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [brokerAccounts.userId],
    references: [users.id],
  }),
  entries: many(sheetEntries),
}));

export const sheetEntriesRelations = relations(sheetEntries, ({ one }) => ({
  brokerAccount: one(brokerAccounts, {
    fields: [sheetEntries.brokerAccountId],
    references: [brokerAccounts.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BrokerAccount = typeof brokerAccounts.$inferSelect;
export type InsertBrokerAccount = typeof brokerAccounts.$inferInsert;
export type SheetEntry = typeof sheetEntries.$inferSelect;
export type InsertSheetEntry = typeof sheetEntries.$inferInsert;
