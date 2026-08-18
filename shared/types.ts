export type Role = "admin" | "broker";
export type EntryType = "work" | "breakage";

export type User = {
  id: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = {
  name?: string | null;
  phone?: string | null;
  passwordHash?: string | null;
  email?: string | null;
  role?: Role;
  createdAt?: Date;
  updatedAt?: Date;
  lastSignedIn?: Date;
};

export type BrokerAccount = {
  id: string;
  userId: string;
  name: string | null;
  phone: string | null;
  totalWeight: string;
  totalCash: string;
  isBlocked: boolean;
};

export type SheetEntry = {
  id: string;
  brokerAccountId: string;
  businessDate: Date;
  weight: string;
  description: string;
  cash: string;
  notes: string | null;
  type: EntryType;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertSheetEntry = Omit<SheetEntry, "id" | "createdAt" | "updatedAt"> & Partial<Pick<SheetEntry, "createdAt" | "updatedAt">>;
export * from "./errors";
