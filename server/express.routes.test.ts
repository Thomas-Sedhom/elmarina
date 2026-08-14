import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "http";
import { createApp } from "./src/app";
import { BrokerAccountModel, SheetEntryModel, UserModel } from "./mongoModels";
import { closeMongo } from "./mongo";

type HttpResponse<T> = { status: number; body: T; cookie?: string };
let server: Server;
let baseUrl = "";

async function request<T>(path: string, init: RequestInit = {}, cookie?: string): Promise<HttpResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) } });
  const body = await response.json();
  const setCookie = response.headers.get("set-cookie")?.split(";")[0];
  return { status: response.status, body, cookie: setCookie };
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown): RequestInit => ({ method: "PATCH", body: JSON.stringify(body) });

describe.skipIf(!process.env.MONGODB_URI)("Express HTTP routes", () => {
  let adminCookie = "";
  let brokerCookie = "";
  let brokerUserId: number | undefined;
  let brokerAccountId: number | undefined;
  let otherBrokerUserId: number | undefined;
  let otherBrokerAccountId: number | undefined;
  let entryId: number | undefined;

  beforeAll(async () => {
    server = createServer(createApp());
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}`;
    const login = await request<{ data: { user: { role: string } } }>("/api/auth/login", json({ phone: "01023999511", password: "Rm-24222682" }));
    expect(login.status).toBe(200);
    adminCookie = login.cookie!;
  }, 120000);

  afterAll(async () => {
    if (entryId) await SheetEntryModel.deleteOne({ id: entryId });
    if (brokerAccountId) await BrokerAccountModel.deleteOne({ id: brokerAccountId });
    if (otherBrokerAccountId) await BrokerAccountModel.deleteOne({ id: otherBrokerAccountId });
    if (brokerUserId) await UserModel.deleteOne({ id: brokerUserId });
    if (otherBrokerUserId) await UserModel.deleteOne({ id: otherBrokerUserId });
    await new Promise<void>(resolve => server?.close(() => resolve()));
    await closeMongo();
  });

  it("supports login, current-user, and logout endpoints", async () => {
    const me = await request<{ data: { role: string; phone: string } }>("/api/users/me", {}, adminCookie);
    expect(me.status).toBe(200);
    expect(me.body.data.role).toBe("admin");
    expect(me.body.data.phone).toBe("01023999511");
    const logout = await request<{ data: { success: true } }>("/api/auth/logout", json({}), adminCookie);
    expect(logout.status).toBe(200);
    expect(logout.body.data.success).toBe(true);
  });

  it("enforces broker isolation and performs ledger mutations through HTTP", async () => {
    const suffix = Date.now().toString().slice(-8);
    const created = await request<{ data: { id: number; userId: number } }>("/api/brokers", json({ name: "Express Test Broker", phone: `012${suffix}`, password: "TestPass123" }), adminCookie);
    expect(created.status).toBe(201);
    brokerAccountId = created.body.data.id;
    brokerUserId = created.body.data.userId;

    const otherCreated = await request<{ data: { id: number; userId: number } }>("/api/brokers", json({ name: "Express Other Broker", phone: `013${suffix}`, password: "TestPass123" }), adminCookie);
    expect(otherCreated.status).toBe(201);
    otherBrokerAccountId = otherCreated.body.data.id;
    otherBrokerUserId = otherCreated.body.data.userId;
    const brokerLogin = await request<{ data: { user: { role: string } } }>("/api/auth/login", json({ phone: `012${suffix}`, password: "TestPass123" }));
    expect(brokerLogin.status).toBe(200);
    brokerCookie = brokerLogin.cookie!;
    const own = await request<{ data: { id: number } }>(`/api/brokers/${brokerAccountId}`, {}, brokerCookie);
    expect(own.status).toBe(200);
    const forbidden = await request<{ error: { message: string } }>(`/api/brokers/${otherBrokerAccountId}`, {}, brokerCookie);
    expect(forbidden.status).toBe(403);

    const createdEntry = await request<{ data: number }>("/api/entries", json({ brokerAccountId, businessDate: "2026-08-14T00:00:00.000Z", weight: "2.500", description: "خاتم", cash: "900.00", notes: null, type: "work" }), adminCookie);
    expect(createdEntry.status).toBe(201);
    entryId = createdEntry.body.data;
    const updated = await request<{ data: { success: true } }>(`/api/entries/${entryId}`, patch({ brokerAccountId, businessDate: "2026-08-14T00:00:00.000Z", weight: "3.500", description: "خاتم معدل", cash: "1000.00", notes: null, type: "work" }), adminCookie);
    expect(updated.status).toBe(200);
    const deleted = await request<{ data: { success: true } }>(`/api/entries/${entryId}`, { method: "DELETE" }, adminCookie);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.success).toBe(true);
    entryId = undefined;
  }, 120000);
});
