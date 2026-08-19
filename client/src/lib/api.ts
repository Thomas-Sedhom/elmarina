import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";

export type ApiUser = { id: string; name: string | null; phone: string | null; email: string | null; role: "admin" | "broker"; createdAt: string; updatedAt: string; lastSignedIn: string };
export type BrokerAccount = { id: string; userId: string; name: string | null; phone: string | null; totalWeight: string; totalCash: string; isBlocked: boolean };
export type SheetEntry = { id: string; brokerAccountId: string; businessDate: string; weight: string; description: string; cash: string; notes: string | null; type: "work" | "breakage"; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string };
export type EntryInput = { brokerAccountId: string; businessDate: string; weight: string; description?: string | null; cash: string; notes?: string | null; type: "work" | "breakage" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "حدث خطأ في الاتصال");
  return body.data as T;
}

const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });
const patch = (body: unknown): RequestInit => ({ method: "PATCH", body: JSON.stringify(body) });

export type ProductImage = { id: string; productId: string; imageUrl: string; publicId: string; isPrimary: boolean; createdAt: string };
export type Product = { id: string; name: string; price: string; description: string; images: ProductImage[]; createdAt: string; updatedAt: string };
export type ProductInput = { name: string; price: string; description?: string; images?: Array<{ imageUrl: string; publicId: string; isPrimary?: boolean }> };

export type RequestImage = { id: string; requestId: string; imageUrl: string; publicId: string; createdAt: string };
export type BrokerRequest = { id: string; brokerAccountId: string; userId: string; brokerName?: string | null; brokerPhone?: string | null; productName: string; description: string; status: "pending" | "reviewed" | "completed"; images: RequestImage[]; createdAt: string; updatedAt: string };
export type CreateRequestInput = { productName: string; description?: string; images?: Array<{ imageUrl: string; publicId: string }> };

export const api = {
  auth: {
    me: { useQuery: (options?: Partial<UseQueryOptions<ApiUser | null>>) => useQuery({ queryKey: ["auth", "me"], queryFn: () => request<ApiUser>("/api/auth/me"), retry: false, staleTime: 30_000, ...(options ?? {}) }) },
    login: { useMutation: (options?: { onSuccess?: (data: { user: ApiUser }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { phone: string; password: string }) => request<{ user: ApiUser }>("/api/auth/login", json(input)), ...options }) },
    logout: { useMutation: (options?: { onSuccess?: () => void }) => useMutation({ mutationFn: () => request<{ success: true }>("/api/auth/logout", json({})), ...options }) },
    changePassword: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { newPassword: string }) => request<{ success: true }>("/api/auth/change-password", patch(input)), ...options }) },
  },
  brokers: {
    list: { useQuery: (input?: { search?: string }, options?: Partial<UseQueryOptions<BrokerAccount[]>>) => useQuery({ queryKey: ["brokers", "list", input?.search ?? ""], queryFn: () => request<BrokerAccount[]>(`/api/brokers${input?.search ? `?search=${encodeURIComponent(input.search)}` : ""}`), ...(options ?? {}) }) },
    get: { useQuery: (input: { id: string }, options?: Partial<UseQueryOptions<BrokerAccount>>) => useQuery({ queryKey: ["brokers", "get", input.id], queryFn: () => request<BrokerAccount>(`/api/brokers/${input.id}`), ...(options ?? {}) }) },
    meAccount: { useQuery: (options?: Partial<UseQueryOptions<BrokerAccount>>) => useQuery({ queryKey: ["brokers", "meAccount"], queryFn: () => request<BrokerAccount>("/api/brokers/me/account"), ...(options ?? {}) }) },
    create: { useMutation: (options?: { onSuccess?: (data: BrokerAccount) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { name: string; phone: string; password: string }) => request<BrokerAccount>("/api/brokers", json(input)), ...options }) },
    toggleBlock: { useMutation: (options?: { onSuccess?: (data: BrokerAccount) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string; isBlocked: boolean }) => request<BrokerAccount>(`/api/brokers/${input.id}/block`, patch({ isBlocked: input.isBlocked })), ...options }) },
    updatePassword: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string; newPassword: string }) => request<{ success: true }>(`/api/brokers/${input.id}/password`, patch({ newPassword: input.newPassword })), ...options }) },
    delete: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string }) => request<{ success: true }>(`/api/brokers/${input.id}`, { method: "DELETE" }), ...options }) },
  },
  entries: {
    list: { useQuery: (input: { brokerAccountId: string }, options?: Partial<UseQueryOptions<SheetEntry[]>>) => useQuery({ queryKey: ["entries", "list", input.brokerAccountId], queryFn: () => request<SheetEntry[]>(`/api/entries/broker/${input.brokerAccountId}`), ...(options ?? {}) }) },
    create: { useMutation: (options?: { onSuccess?: (data: string) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: EntryInput) => request<string>("/api/entries", json(input)), ...options }) },
    update: { useMutation: (options?: { onSuccess?: (data: { success: true }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: EntryInput & { id: string }) => { const { id, ...body } = input; return request<{ success: true }>(`/api/entries/${id}`, patch(body)); }, ...options }) },
    delete: { useMutation: (options?: { onSuccess?: (data: { success: true }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string }) => request<{ success: true }>(`/api/entries/${input.id}`, { method: "DELETE" }), ...options }) },
  },
  products: {
    list: { useQuery: (input?: { search?: string }, options?: Partial<UseQueryOptions<Product[]>>) => useQuery({ queryKey: ["products", "list", input?.search ?? ""], queryFn: () => request<Product[]>(`/api/products${input?.search ? `?search=${encodeURIComponent(input.search)}` : ""}`), ...(options ?? {}) }) },
    get: { useQuery: (input: { id: string }, options?: Partial<UseQueryOptions<Product>>) => useQuery({ queryKey: ["products", "get", input.id], queryFn: () => request<Product>(`/api/products/${input.id}`), ...(options ?? {}) }) },
    uploadImage: { useMutation: (options?: { onSuccess?: (data: { imageUrl: string; publicId: string }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { image: string }) => request<{ imageUrl: string; publicId: string }>("/api/products/upload-image", json(input)), ...options }) },
    create: { useMutation: (options?: { onSuccess?: (data: Product) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: ProductInput) => request<Product>("/api/products", json(input)), ...options }) },
    update: { useMutation: (options?: { onSuccess?: (data: Product) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: ProductInput & { id: string }) => { const { id, ...body } = input; return request<Product>(`/api/products/${id}`, patch(body)); }, ...options }) },
    delete: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string }) => request<{ success: true }>(`/api/products/${input.id}`, { method: "DELETE" }), ...options }) },
  },
  requests: {
    list: { useQuery: (options?: Partial<UseQueryOptions<BrokerRequest[]>>) => useQuery({ queryKey: ["requests", "list"], queryFn: () => request<BrokerRequest[]>("/api/requests"), ...(options ?? {}) }) },
    get: { useQuery: (input: { id: string }, options?: Partial<UseQueryOptions<BrokerRequest>>) => useQuery({ queryKey: ["requests", "get", input.id], queryFn: () => request<BrokerRequest>(`/api/requests/${input.id}`), ...(options ?? {}) }) },
    uploadImage: { useMutation: (options?: { onSuccess?: (data: { imageUrl: string; publicId: string }) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { image: string }) => request<{ imageUrl: string; publicId: string }>("/api/requests/upload-image", json(input)), ...options }) },
    create: { useMutation: (options?: { onSuccess?: (data: BrokerRequest) => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: CreateRequestInput) => request<BrokerRequest>("/api/requests", json(input)), ...options }) },
    delete: { useMutation: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => useMutation({ mutationFn: (input: { id: string }) => request<{ success: true }>(`/api/requests/${input.id}`, { method: "DELETE" }), ...options }) },
  },
  useUtils: () => {
    const queryClient = useQueryClient();
    return {
      auth: { me: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["auth", "me"] }) } },
      brokers: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["brokers", "list"] }) }, get: { invalidate: (input: { id: string }) => queryClient.invalidateQueries({ queryKey: ["brokers", "get", input.id] }) } },
      entries: { list: { invalidate: (input: { brokerAccountId: string }) => queryClient.invalidateQueries({ queryKey: ["entries", "list", input.brokerAccountId] }) } },
      products: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["products", "list"] }) }, get: { invalidate: (input: { id: string }) => queryClient.invalidateQueries({ queryKey: ["products", "get", input.id] }) } },
      requests: { list: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["requests", "list"] }) }, get: { invalidate: (input: { id: string }) => queryClient.invalidateQueries({ queryKey: ["requests", "get", input.id] }) } },
    };
  },
};
