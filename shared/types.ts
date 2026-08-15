export type Role = "admin" | "broker";
export type EntryType = "work" | "breakage";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  phone: string | null;
  passwordHash: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Partial<Omit<User, "id" | "createdAt" | "updatedAt" | "lastSignedIn">> & Pick<User, "openId"> & Partial<Pick<User, "createdAt" | "updatedAt" | "lastSignedIn">>;

export type SheetEntry = {
  id: number;
  brokerAccountId: number;
  businessDate: Date;
  weight: string;
  description: string;
  cash: string;
  notes: string | null;
  type: EntryType;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertSheetEntry = Omit<SheetEntry, "id" | "createdAt" | "updatedAt"> & Partial<Pick<SheetEntry, "createdAt" | "updatedAt">>;
export * from "./errors";
