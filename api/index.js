// api/handler.ts
import "dotenv/config";

// server/src/app.ts
import express from "express";

// server/src/routes.ts
import { Router as Router5 } from "express";

// server/src/modules/auth/auth.routes.ts
import { Router } from "express";
import { z } from "zod";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;

// shared/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var UnauthorizedError = (msg) => new HttpError(401, msg);
var ForbiddenError = (msg) => new HttpError(403, msg);
var NotFoundError = (msg) => new HttpError(404, msg);

// server/src/shared/utils/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/src/shared/security/session.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/src/modules/users/users.repository.ts
import mongoose2 from "mongoose";

// server/src/database/schemas/user.schema.ts
import mongoose, { Schema } from "mongoose";
var UserSchema = new Schema(
  {
    name: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      index: true
    },
    passwordHash: {
      type: String,
      default: null,
      select: false
    },
    email: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ["admin", "broker"],
      required: true,
      default: "broker",
      index: true
    },
    lastSignedIn: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  { timestamps: true, versionKey: false }
);
var UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

// server/src/shared/utils/crypto.ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}
function verifyPassword(password, encoded) {
  if (!encoded) return false;
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

// server/src/modules/users/users.repository.ts
function normalizePhone(phone) {
  return phone.replace(/[\s()-]/g, "");
}
function toUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    phone: doc.phone ?? null,
    passwordHash: doc.passwordHash ?? null,
    email: doc.email ?? null,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    lastSignedIn: doc.lastSignedIn
  };
}
var UsersRepository = class {
  toSafeUser(user) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
  async findById(id) {
    if (!mongoose2.Types.ObjectId.isValid(id)) return void 0;
    const result = await UserModel.findById(id).lean();
    return result ? toUser(result) : void 0;
  }
  async findByPhone(phone, includePassword = false) {
    const query = UserModel.findOne({ phone: normalizePhone(phone) });
    if (includePassword) query.select("+passwordHash");
    const result = await query.lean();
    return result ? toUser(result) : void 0;
  }
  async updateLastSignedIn(id) {
    await UserModel.updateOne({ _id: id }, { $set: { lastSignedIn: /* @__PURE__ */ new Date() } });
  }
  async ensureSeedAdmin() {
    const phone = normalizePhone(process.env.ADMIN_PHONE || "01023999511");
    const password = process.env.ADMIN_PASSWORD || "Rm-24222682";
    const name = process.env.ADMIN_NAME || "\u0633\u064A\u062F\u0647\u0645 \u0628\u0633\u0637\u0648\u0631\u0648\u0633";
    const existing = await UserModel.findOne({ role: "admin" }).select("+passwordHash");
    if (existing) {
      await UserModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            name,
            phone,
            passwordHash: hashPassword(password)
          }
        }
      );
      return;
    }
    await UserModel.create({
      name,
      phone,
      passwordHash: hashPassword(password),
      email: null,
      role: "admin",
      lastSignedIn: /* @__PURE__ */ new Date()
    });
  }
};
var usersRepository = new UsersRepository();

// server/src/shared/config/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "elmarina",
  cookieSecret: process.env.JWT_SECRET || process.env.COOKIE_SECRET || "elmarina-workshop-secret-jwt-key-2024-secure",
  mongoUri: process.env.MONGODB_URI ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
    url: process.env.CLOUDINARY_URL ?? ""
  }
};

// server/src/shared/security/session.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var SessionSDK = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) return /* @__PURE__ */ new Map();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }
  getSessionSecret() {
    if (!ENV.cookieSecret) throw new Error("JWT_SECRET is not configured");
    return new TextEncoder().encode(ENV.cookieSecret);
  }
  async createSessionToken(userId, options = {}) {
    return this.signSession({ userId, name: options.name || "" }, options);
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    return new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt(Math.floor(issuedAt / 1e3)).setExpirationTime(Math.floor((issuedAt + expiresInMs) / 1e3)).sign(this.getSessionSecret());
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { userId, name } = payload;
      if (!isNonEmptyString(userId) || typeof name !== "string") return null;
      return { userId, name };
    } catch {
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) sessionToken = authHeader.slice(7);
    }
    const session = await this.verifySession(sessionToken);
    if (!session) throw ForbiddenError("Invalid session");
    const user = await usersRepository.findById(session.userId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
};
var sdk = new SessionSDK();

// server/src/modules/auth/auth.service.ts
var AuthService = class {
  async login(req, res, phone, password) {
    const user = await usersRepository.findByPhone(phone, true);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw UnauthorizedError("Invalid phone or password");
    }
    await usersRepository.updateLastSignedIn(user.id);
    const token = await sdk.createSessionToken(user.id, { name: user.name ?? void 0 });
    res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: 1e3 * 60 * 60 * 24 * 30 });
    return usersRepository.toSafeUser(user);
  }
  async me(req) {
    if (!req.user) throw UnauthorizedError("Authentication required");
    return usersRepository.toSafeUser(req.user);
  }
  logout(req, res) {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    return { success: true };
  }
};
var authService = new AuthService();

// server/src/shared/middlewares/auth.middleware.ts
async function requireAuth(req, _res, next) {
  try {
    req.user = await sdk.authenticateRequest(req);
    next();
  } catch (error) {
    next(error instanceof Error && "statusCode" in error ? error : UnauthorizedError("Authentication required"));
  }
}
function requireAdmin(req, _res, next) {
  if (!req.user) return next(UnauthorizedError("Authentication required"));
  if (req.user.role !== "admin") return next(ForbiddenError("Admin access required"));
  next();
}

// server/src/shared/utils/http.ts
var asyncHandler = (handler2) => (req, res, next) => Promise.resolve(handler2(req, res, next)).catch(next);
var sendData = (res, data, status = 200) => res.status(status).json({ data });
var errorHandler = (error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  if (status >= 500) console.error("[HTTP]", error);
  res.status(status).json({ error: { message } });
};

// server/src/modules/auth/auth.routes.ts
var router = Router();
var credentials = z.object({ phone: z.string().trim().min(8).max(32), password: z.string().min(8).max(128) });
router.post("/login", asyncHandler(async (req, res) => {
  const input = credentials.parse(req.body);
  sendData(res, { user: await authService.login(req, res, input.phone, input.password) });
}));
router.get("/me", requireAuth, asyncHandler(async (req, res) => sendData(res, await authService.me(req))));
router.post("/logout", asyncHandler(async (req, res) => sendData(res, authService.logout(req, res))));
var auth_routes_default = router;

// server/src/modules/brokers/brokers.routes.ts
import { Router as Router2 } from "express";

// server/src/modules/brokers/brokers.controller.ts
import { z as z2 } from "zod";

// server/src/modules/brokers/brokers.repository.ts
import mongoose4 from "mongoose";

// server/src/database/schemas/broker.schema.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var BrokerAccountSchema = new Schema2(
  {
    userId: {
      type: Schema2.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    totalWeight: {
      type: Schema2.Types.Decimal128,
      required: true,
      default: () => mongoose3.Types.Decimal128.fromString("0")
    },
    totalCash: {
      type: Schema2.Types.Decimal128,
      required: true,
      default: () => mongoose3.Types.Decimal128.fromString("0")
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);
var BrokerAccountModel = mongoose3.models.BrokerAccount || mongoose3.model("BrokerAccount", BrokerAccountSchema);

// server/src/modules/brokers/brokers.repository.ts
function normalizePhone2(phone) {
  return phone.replace(/[\s()-]/g, "");
}
function decimal(value) {
  return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0");
}
function mongoDecimal(value) {
  return mongoose4.Types.Decimal128.fromString(String(value));
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toBroker(accountDoc, userDoc) {
  return {
    id: accountDoc._id.toString(),
    userId: userDoc._id.toString(),
    name: userDoc.name,
    phone: userDoc.phone,
    totalWeight: decimal(accountDoc.totalWeight),
    totalCash: decimal(accountDoc.totalCash),
    isBlocked: Boolean(accountDoc.isBlocked)
  };
}
var BrokersRepository = class {
  async list(search) {
    const accounts = await BrokerAccountModel.find().populate("userId").sort({ updatedAt: -1 }).lean();
    const normalizedSearch = search?.trim();
    const pattern = normalizedSearch ? new RegExp(escapeRegex(normalizedSearch), "i") : null;
    return accounts.filter((account) => account && account.userId).map((account) => toBroker(account, account.userId)).filter((item) => {
      if (!pattern) return true;
      return pattern.test(item.name ?? "") || pattern.test(item.phone ?? "");
    });
  }
  async findById(id) {
    if (!mongoose4.Types.ObjectId.isValid(id)) return void 0;
    const account = await BrokerAccountModel.findById(id).populate("userId").lean();
    if (!account || !account.userId) return void 0;
    return toBroker(account, account.userId);
  }
  async findByUserId(userId) {
    if (!mongoose4.Types.ObjectId.isValid(userId)) return void 0;
    const account = await BrokerAccountModel.findOne({ userId: new mongoose4.Types.ObjectId(userId) }).populate("userId").lean();
    if (!account || !account.userId) return void 0;
    return toBroker(account, account.userId);
  }
  async updateBlockStatus(id, isBlocked) {
    if (!mongoose4.Types.ObjectId.isValid(id)) return void 0;
    const account = await BrokerAccountModel.findByIdAndUpdate(
      id,
      { $set: { isBlocked } },
      { new: true }
    ).populate("userId").lean();
    if (!account || !account.userId) return void 0;
    return toBroker(account, account.userId);
  }
  async create(input) {
    const phone = normalizePhone2(input.phone);
    return mongoose4.connection.transaction(async (session) => {
      const existing = await UserModel.findOne({ phone }).session(session);
      if (existing) throw new Error("PHONE_ALREADY_EXISTS");
      const [user] = await UserModel.create(
        [
          {
            name: input.name.trim(),
            phone,
            passwordHash: hashPassword(input.password),
            role: "broker"
          }
        ],
        { session }
      );
      const [account] = await BrokerAccountModel.create(
        [
          {
            userId: user._id,
            totalWeight: mongoDecimal("0"),
            totalCash: mongoDecimal("0")
          }
        ],
        { session }
      );
      return { id: account._id.toString(), userId: user._id.toString() };
    });
  }
};
var brokersRepository = new BrokersRepository();

// server/src/modules/brokers/brokers.service.ts
var BrokersService = class {
  list(search) {
    return brokersRepository.list(search);
  }
  create(input) {
    return brokersRepository.create(input);
  }
  async getById(id, user) {
    const account = await brokersRepository.findById(id);
    if (!account) throw NotFoundError("Broker account not found");
    if (user.role !== "admin" && account.userId !== user.id) throw ForbiddenError("You can only view your own account");
    return account;
  }
  async getMyAccount(user) {
    const account = await brokersRepository.findByUserId(user.id);
    if (!account) throw NotFoundError("Broker account not found");
    return account;
  }
  async toggleBlock(id, isBlocked) {
    const account = await brokersRepository.updateBlockStatus(id, isBlocked);
    if (!account) throw NotFoundError("Broker account not found");
    return account;
  }
};
var brokersService = new BrokersService();

// server/src/modules/brokers/brokers.controller.ts
var idSchema = z2.string().trim().min(1);
var brokerInput = z2.object({ name: z2.string().trim().min(2).max(255), phone: z2.string().trim().min(8).max(32), password: z2.string().min(8).max(128) });
var blockInput = z2.object({ isBlocked: z2.boolean() });
var listBrokers = asyncHandler(async (req, res) => sendData(res, await brokersService.list(typeof req.query.search === "string" ? req.query.search : void 0)));
var createBroker = asyncHandler(async (req, res) => sendData(res, await brokersService.create(brokerInput.parse(req.body)), 201));
var getBroker = asyncHandler(async (req, res) => sendData(res, await brokersService.getById(idSchema.parse(req.params.id), req.user)));
var getMyBrokerAccount = asyncHandler(async (req, res) => sendData(res, await brokersService.getMyAccount(req.user)));
var toggleBlockBroker = asyncHandler(async (req, res) => {
  const { isBlocked } = blockInput.parse(req.body);
  sendData(res, await brokersService.toggleBlock(idSchema.parse(req.params.id), isBlocked));
});

// server/src/modules/brokers/brokers.routes.ts
var router2 = Router2();
router2.get("/", requireAuth, requireAdmin, listBrokers);
router2.post("/", requireAuth, requireAdmin, createBroker);
router2.get("/me/account", requireAuth, getMyBrokerAccount);
router2.patch("/:id/block", requireAuth, requireAdmin, toggleBlockBroker);
router2.get("/:id", requireAuth, getBroker);
var brokers_routes_default = router2;

// server/src/modules/ledger/ledger.routes.ts
import { Router as Router3 } from "express";

// server/src/modules/ledger/ledger.controller.ts
import { z as z3 } from "zod";

// server/src/shared/security/access.ts
function assertCanViewBrokerAccount(user, account) {
  if (!account) throw NotFoundError("Broker account not found");
  if (user.role !== "admin" && account.userId !== user.id) throw ForbiddenError("You can only view your own account");
}

// server/src/modules/ledger/ledger.repository.ts
import mongoose6 from "mongoose";

// server/src/database/schemas/entry.schema.ts
import mongoose5, { Schema as Schema3 } from "mongoose";
var SheetEntrySchema = new Schema3(
  {
    brokerAccountId: {
      type: Schema3.Types.ObjectId,
      ref: "BrokerAccount",
      required: true,
      index: true
    },
    businessDate: {
      type: Date,
      required: true,
      index: true
    },
    weight: {
      type: Schema3.Types.Decimal128,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    cash: {
      type: Schema3.Types.Decimal128,
      required: true
    },
    notes: {
      type: String,
      default: null
    },
    type: {
      type: String,
      enum: ["work", "breakage"],
      required: true
    },
    createdBy: {
      type: Schema3.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: { type: Schema3.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);
var SheetEntryModel = mongoose5.models.SheetEntry || mongoose5.model("SheetEntry", SheetEntrySchema);

// server/src/modules/ledger/ledger.repository.ts
function decimal2(value) {
  return value && typeof value === "object" && "toString" in value ? String(value) : String(value ?? "0");
}
function mongoDecimal2(value) {
  return mongoose6.Types.Decimal128.fromString(String(value));
}
function signedAmount(type, value) {
  return type === "work" ? Number(value) : -Number(value);
}
function toEntry(doc) {
  return {
    id: doc._id.toString(),
    brokerAccountId: doc.brokerAccountId.toString(),
    businessDate: doc.businessDate,
    weight: decimal2(doc.weight),
    description: doc.description,
    cash: decimal2(doc.cash),
    notes: doc.notes ?? null,
    type: doc.type,
    createdBy: doc.createdBy.toString(),
    updatedBy: doc.updatedBy.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}
function entryEffect(type, weight, cash) {
  return { weight: signedAmount(type, weight), cash: signedAmount(type, cash) };
}
function editEffectDelta(previous, next) {
  const oldEffect = entryEffect(previous.type, previous.weight, previous.cash);
  const newEffect = entryEffect(next.type, next.weight, next.cash);
  return { weight: newEffect.weight - oldEffect.weight, cash: newEffect.cash - oldEffect.cash };
}
function deleteEffectReversal(entry) {
  const effect = entryEffect(entry.type, entry.weight, entry.cash);
  return { weight: -effect.weight, cash: -effect.cash };
}
async function updateTotals(accountId, delta, session) {
  const result = await BrokerAccountModel.findByIdAndUpdate(
    accountId,
    { $inc: { totalWeight: mongoDecimal2(String(delta.weight)), totalCash: mongoDecimal2(String(delta.cash)) } },
    { session }
  );
  if (!result) throw new Error("BROKER_ACCOUNT_NOT_FOUND");
}
var LedgerRepository = class {
  async findBrokerAccount(id) {
    if (!mongoose6.Types.ObjectId.isValid(id)) return null;
    return BrokerAccountModel.findById(id).lean();
  }
  async listByBrokerAccount(brokerAccountId) {
    if (!mongoose6.Types.ObjectId.isValid(brokerAccountId)) return [];
    const rows = await SheetEntryModel.find({ brokerAccountId }).sort({ businessDate: -1, _id: -1 }).lean();
    return rows.map(toEntry);
  }
  async create(input) {
    return mongoose6.connection.transaction(async (session) => {
      const [entry] = await SheetEntryModel.create(
        [
          {
            brokerAccountId: new mongoose6.Types.ObjectId(input.brokerAccountId),
            businessDate: input.businessDate,
            weight: mongoDecimal2(String(input.weight)),
            description: input.description,
            cash: mongoDecimal2(String(input.cash)),
            notes: input.notes ?? null,
            type: input.type,
            createdBy: new mongoose6.Types.ObjectId(input.createdBy),
            updatedBy: new mongoose6.Types.ObjectId(input.updatedBy)
          }
        ],
        { session }
      );
      await updateTotals(
        input.brokerAccountId,
        entryEffect(input.type, String(input.weight), String(input.cash)),
        session
      );
      return entry._id.toString();
    });
  }
  async update(id, input) {
    if (!mongoose6.Types.ObjectId.isValid(id)) throw new Error("ENTRY_NOT_FOUND");
    return mongoose6.connection.transaction(async (session) => {
      const previous = await SheetEntryModel.findById(id).session(session).lean();
      if (!previous) throw new Error("ENTRY_NOT_FOUND");
      if (previous.brokerAccountId.toString() !== input.brokerAccountId) throw new Error("BROKER_ACCOUNT_CANNOT_CHANGE");
      await SheetEntryModel.findByIdAndUpdate(
        id,
        {
          $set: {
            businessDate: input.businessDate,
            weight: mongoDecimal2(String(input.weight)),
            description: input.description,
            cash: mongoDecimal2(String(input.cash)),
            notes: input.notes ?? null,
            type: input.type,
            updatedBy: new mongoose6.Types.ObjectId(input.updatedBy)
          }
        },
        { session }
      );
      await updateTotals(
        input.brokerAccountId,
        editEffectDelta(
          { type: previous.type, weight: decimal2(previous.weight), cash: decimal2(previous.cash) },
          { type: input.type, weight: String(input.weight), cash: String(input.cash) }
        ),
        session
      );
    });
  }
  async delete(id) {
    if (!mongoose6.Types.ObjectId.isValid(id)) throw new Error("ENTRY_NOT_FOUND");
    return mongoose6.connection.transaction(async (session) => {
      const previous = await SheetEntryModel.findByIdAndDelete(id).session(session).lean();
      if (!previous) throw new Error("ENTRY_NOT_FOUND");
      await updateTotals(
        previous.brokerAccountId.toString(),
        deleteEffectReversal({
          type: previous.type,
          weight: decimal2(previous.weight),
          cash: decimal2(previous.cash)
        }),
        session
      );
    });
  }
};
var ledgerRepository = new LedgerRepository();

// server/src/modules/ledger/ledger.service.ts
var LedgerService = class {
  async listForBroker(accountId, user) {
    const account = await ledgerRepository.findBrokerAccount(accountId);
    assertCanViewBrokerAccount(user, account ? { userId: account.userId.toString() } : null);
    return ledgerRepository.listByBrokerAccount(accountId);
  }
  create(input) {
    return ledgerRepository.create(input);
  }
  update(id, input) {
    return ledgerRepository.update(id, input);
  }
  delete(id) {
    return ledgerRepository.delete(id);
  }
};
var ledgerService = new LedgerService();

// server/src/modules/ledger/ledger.controller.ts
var idSchema2 = z3.string().trim().min(1);
var entryInput = z3.object({
  brokerAccountId: z3.string().trim().min(1),
  businessDate: z3.string().datetime(),
  weight: z3.string().regex(/^\d+(\.\d{1,3})?$/, "Invalid weight"),
  description: z3.string().trim().max(500).default("").optional().nullable(),
  cash: z3.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cash"),
  notes: z3.string().trim().max(500).nullable().optional(),
  type: z3.enum(["work", "breakage"])
});
var parseInput = (body) => {
  const input = entryInput.parse(body);
  return {
    ...input,
    description: input.description?.trim() || "",
    businessDate: new Date(input.businessDate),
    notes: input.notes ?? null
  };
};
var listEntries = asyncHandler(async (req, res) => {
  const accountId = idSchema2.parse(req.params.brokerAccountId);
  sendData(res, await ledgerService.listForBroker(accountId, req.user));
});
var createEntry = asyncHandler(
  async (req, res) => sendData(
    res,
    await ledgerService.create({
      ...parseInput(req.body),
      createdBy: req.user.id,
      updatedBy: req.user.id
    }),
    201
  )
);
var updateEntry = asyncHandler(async (req, res) => {
  await ledgerService.update(idSchema2.parse(req.params.id), {
    ...parseInput(req.body),
    createdBy: req.user.id,
    updatedBy: req.user.id
  });
  sendData(res, { success: true });
});
var deleteEntry = asyncHandler(async (req, res) => {
  await ledgerService.delete(idSchema2.parse(req.params.id));
  sendData(res, { success: true });
});

// server/src/modules/ledger/ledger.routes.ts
var router3 = Router3();
router3.get("/broker/:brokerAccountId", requireAuth, listEntries);
router3.post("/", requireAuth, requireAdmin, createEntry);
router3.patch("/:id", requireAuth, requireAdmin, updateEntry);
router3.delete("/:id", requireAuth, requireAdmin, deleteEntry);
var ledger_routes_default = router3;

// server/src/modules/users/users.routes.ts
import { Router as Router4 } from "express";

// server/src/modules/users/users.service.ts
var UsersService = class {
  me(user) {
    return usersRepository.toSafeUser(user);
  }
};
var usersService = new UsersService();

// server/src/modules/users/users.controller.ts
var getCurrentUser = asyncHandler(async (req, res) => sendData(res, usersService.me(req.user)));

// server/src/modules/users/users.routes.ts
var router4 = Router4();
router4.get("/me", requireAuth, getCurrentUser);
var users_routes_default = router4;

// server/src/routes.ts
var routes = Router5();
routes.use("/auth", auth_routes_default);
routes.use("/brokers", brokers_routes_default);
routes.use("/entries", ledger_routes_default);
routes.use("/users", users_routes_default);

// server/src/app.ts
function createApp() {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  app2.use("/api", routes);
  app2.use(errorHandler);
  return app2;
}

// server/src/database/connection.ts
import mongoose7 from "mongoose";
var connecting = null;
async function syncAllIndexes() {
  try {
    const userColl = UserModel.collection;
    const staleIndexes = ["id_1", "openId_1"];
    for (const name of staleIndexes) {
      await userColl.dropIndex(name).catch(() => {
      });
    }
    const brokerColl = BrokerAccountModel.collection;
    await brokerColl.dropIndex("id_1").catch(() => {
    });
    const entryColl = SheetEntryModel.collection;
    await entryColl.dropIndex("id_1").catch(() => {
    });
    await Promise.allSettled([
      UserModel.syncIndexes(),
      BrokerAccountModel.syncIndexes(),
      SheetEntryModel.syncIndexes()
    ]);
  } catch {
  }
}
async function connectDatabase() {
  if (mongoose7.connection.readyState === 1) return mongoose7;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured in environment variables");
  if (!connecting) {
    connecting = mongoose7.connect(uri, { serverSelectionTimeoutMS: 8e3, maxPoolSize: 10 }).then(async (m) => {
      await syncAllIndexes();
      return m;
    }).catch((error) => {
      connecting = null;
      throw error;
    });
  }
  return connecting;
}

// api/handler.ts
var app = createApp();
var initialized = false;
async function ensureInit() {
  if (!initialized) {
    await connectDatabase();
    await usersRepository.ensureSeedAdmin();
    initialized = true;
  }
}
async function handler(req, res) {
  try {
    await ensureInit();
    return app(req, res);
  } catch (error) {
    console.error("Vercel serverless handler error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0637\u0644\u0628 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645"
      }
    });
  }
}
export {
  handler as default
};
