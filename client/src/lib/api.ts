import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";

export type ApiUser = { id: number; openId: string; name: string | null; phone: string | null; email: string | null; loginMethod: string; role: "admin" | "broker"; createdAt: string; updatedAt: string; lastSignedIn: string };
export type BrokerAccount = { id: number; userId: number; name: string | null; phone: string | null; totalWeight: string; totalCash: string };
export type SheetEntry = { id: number; brokerAccountId: number; businessDate: string; weight: string; description: string; cash: string; notes: string | null; type: "work" | "breakage"; createdBy: number; updatedBy: number; createdAt: string; updatedAt: string };
export type EntryInput = { brokerAccountId: number; businessDate: string; weight: string; description: string; cash: string; notes?: string | null; type: "work" | "breakage" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "حدث خطأ في الاتصال");
  return body.data as T;
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown): RequestInit => ({ method: "PATCH", body: JSON.stringify(body) });

export const api = {
  auth: {
    me: { useQuery: (options?: Partial<UseQueryOptions<ApiUser | null>>) => useQuery({ queryKey: ["auth", "me"], queryFn: () => request<ApiUser>("/api/auth/me"), retry: false, staleTime: 30_000, ...(options ?? {}) }) },
    login: { useMutation: (options?: { onSuccess?: (data: { user: ApiUser }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { phone: string; password: string }) => request<{ user: ApiUser }>("/api/auth/login", json(input)), ...options }) },
    logout: { useMutation: (options?: { onSuccess?: () => void }) => useMutation({ mutationFn: () => request<{ success: true }>("/api/auth/logout", json({})), ...options }) },
  },
  brokers: {
    list: { useQuery: (input?: { search?: string }, options?: Partial<UseQueryOptions<BrokerAccount[]>>) => useQuery({ queryKey: ["brokers", "list", input?.search ?? ""], queryFn: () => request<BrokerAccount[]>(`/api/brokers${input?.search ? `?search=${encodeURIComponent(input.search)}` : ""}`), ...(options ?? {}) }) },
    get: { useQuery: (input: { id: number }, options?: Partial<UseQueryOptions<BrokerAccount>>) => useQuery({ queryKey: ["brokers", "get", input.id], queryFn: () => request<BrokerAccount>(`/api/brokers/${input.id}`), ...(options ?? {}) }) },
    create: { useMutation: (options?: { onSuccess?: (data: BrokerAccount) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { name: string; phone: string; password: string }) => request<BrokerAccount>("/api/brokers", json(input)), ...options }) },
  },
  entries: {
    list: { useQuery: (input: { brokerAccountId: number }, options?: Partial<UseQueryOptions<SheetEntry[]>>) => useQuery({ queryKey: ["entries", "list", input.brokerAccountId], queryFn: () => request<SheetEntry[]>(`/api/entries/broker/${input.brokerAccountId}`), ...(options ?? {}) }) },
    create: { useMutation: (options?: { onSuccess?: (data: number) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: EntryInput) => request<number>("/api/entries", json(input)), ...options }) },
    update: { useMutation: (options?: { onSuccess?: (data: { success: true }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: EntryInput & { id: number }) => { const { id, ...body } = input; return request<{ success: true }>(`/api/entries/${id}`, patch(body)); }, ...options }) },
    delete: { useMutation: (options?: { onSuccess?: (data: { success: true }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: number }) => request<{ success: true }>(`/api/entries/${input.id}`, { method: "DELETE" }), ...options }) },
  },
  useUtils: () => {
    const queryClient = useQueryClient();
    return { auth: { me: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }) } }, brokers: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["brokers", "list"] }) }, get: { invalidate: (input: { id: number }) => queryClient.invalidateQueries({ queryKey: ["brokers", "get", input.id] }) } }, entries: { list: { invalidate: (input: { brokerAccountId: number }) => queryClient.invalidateQueries({ queryKey: ["entries", "list", input.brokerAccountId] }) } } };
  },
};
