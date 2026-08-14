import { api } from "@/lib/api";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth(options: { redirectPath?: string } = {}) {
  const [, navigate] = useLocation();
  const query = api.auth.me.useQuery();
  const logoutMutation = api.auth.logout.useMutation({ onSuccess: () => query.refetch() });

  useEffect(() => {
    if (!query.isLoading && !query.data && options.redirectPath) navigate(options.redirectPath);
  }, [navigate, options.redirectPath, query.data, query.isLoading]);

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    isAuthenticated: Boolean(query.data),
    logout: () => logoutMutation.mutate(),
    logoutPending: logoutMutation.isPending,
    refetch: query.refetch,
  };
}
