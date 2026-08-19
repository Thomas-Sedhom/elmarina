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
  isDeleted?: boolean;
  deletedAt?: Date | null;
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

export type ProductImage = {
  id: string;
  productId: string;
  imageUrl: string;
  publicId: string;
  isPrimary: boolean;
  createdAt: Date;
};

export type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
  images: ProductImage[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertProduct = {
  name: string;
  price: string;
  description?: string;
  images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }>;
};

export type RequestImage = {
  id: string;
  requestId: string;
  imageUrl: string;
  publicId: string;
  createdAt: Date;
};

export type BrokerRequest = {
  id: string;
  brokerAccountId: string;
  userId: string;
  brokerName?: string | null;
  brokerPhone?: string | null;
  productName: string;
  description: string;
  status: "pending" | "reviewed" | "completed";
  images: RequestImage[];
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertBrokerRequest = {
  productName: string;
  description?: string;
  images?: Array<{ imageUrl: string; publicId: string }>;
};

export * from "./errors";
